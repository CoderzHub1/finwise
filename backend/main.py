from flask import Flask, jsonify, request
from flask_cors import CORS
import bcrypt
from mongodb import getdatabase
from pymongo.errors import DuplicateKeyError
from datetime import datetime, timedelta
from gemini import get_gemini_suggestions, get_keywords, finance_topics
from newsapi import get_finance_tips_articles, get_top_finance_headlines, format_articles_for_display
from translation import translate_text, translate_batch, get_supported_languages

app = Flask(__name__)
CORS(app)

db = getdatabase("finwise")

# Rank definitions
RANKS = [
    {"name": "Bronze Beginner", "icon": "🪙", "min_points": 0, "max_points": 499},
    {"name": "Silver Saver", "icon": "💡", "min_points": 500, "max_points": 999},
    {"name": "Gold Planner", "icon": "🏆", "min_points": 1000, "max_points": 1999},
    {"name": "Platinum Financier", "icon": "💳", "min_points": 2000, "max_points": 3499},
    {"name": "Diamond Investor", "icon": "💎", "min_points": 3500, "max_points": 5499},
    {"name": "Elite Wealth Master", "icon": "👑", "min_points": 5500, "max_points": 7999},
    {"name": "FinWise Legend", "icon": "🌟", "min_points": 8000, "max_points": float('inf')}
]

# Achievement definitions
ACHIEVEMENTS = {
    "streak_star": {
        "id": "streak_star",
        "name": "Streak Star",
        "icon": "🔥",
        "description": "Maintain spending limits for 4 consecutive weeks",
        "requirement": 4
    },
    "budget_boss": {
        "id": "budget_boss",
        "name": "Budget Boss",
        "icon": "💰",
        "description": "Earn 100-point monthly bonus for 3 consecutive months",
        "requirement": 3
    },
    "loan_legend": {
        "id": "loan_legend",
        "name": "Loan Legend",
        "icon": "🏦",
        "description": "Complete 5 timely loan repayments",
        "requirement": 5
    }
}


def get_user_rank(points: int):
    """Calculate user's rank based on points"""
    for rank in RANKS:
        if rank["min_points"] <= points <= rank["max_points"]:
            return rank
    return RANKS[0]  # Default to Bronze Beginner


def get_next_rank(points: int):
    """Get the next rank the user can achieve"""
    current_rank_index = 0
    for i, rank in enumerate(RANKS):
        if rank["min_points"] <= points <= rank["max_points"]:
            current_rank_index = i
            break
    
    if current_rank_index < len(RANKS) - 1:
        return RANKS[current_rank_index + 1]
    return None  # Already at max rank


def check_achievement_unlock(username: str):
    """Check if user has unlocked any new achievements"""
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return []
    
    current_achievements = user.get('achievements', [])
    newly_unlocked = []
    
    # Check Streak Star (4 consecutive weeks)
    if 'streak_star' not in current_achievements:
        consecutive_weeks = user.get('consecutive_weekly_streaks', 0)
        if consecutive_weeks >= ACHIEVEMENTS['streak_star']['requirement']:
            current_achievements.append('streak_star')
            newly_unlocked.append(ACHIEVEMENTS['streak_star'])
    
    # Check Budget Boss (3 consecutive months with 100-point bonus)
    if 'budget_boss' not in current_achievements:
        consecutive_months = user.get('consecutive_monthly_bonuses', 0)
        if consecutive_months >= ACHIEVEMENTS['budget_boss']['requirement']:
            current_achievements.append('budget_boss')
            newly_unlocked.append(ACHIEVEMENTS['budget_boss'])
    
    # Check Loan Legend (5 timely loan repayments)
    if 'loan_legend' not in current_achievements:
        timely_repayments = user.get('timely_loan_repayments', 0)
        if timely_repayments >= ACHIEVEMENTS['loan_legend']['requirement']:
            current_achievements.append('loan_legend')
            newly_unlocked.append(ACHIEVEMENTS['loan_legend'])
    
    # Update achievements in database
    if newly_unlocked:
        a.update_one(
            {'username': username},
            {'$set': {'achievements': current_achievements}}
        )
    
    return newly_unlocked


def award_points(username: str, points: int):
    """Award points to a user"""
    a = db.get_collection("userInfo")
    a.update_one(
        {'username': username},
        {'$inc': {'reward_points': points}}
    )


def award_transaction_points(username: str):
    """Award points for transactions - only first 5 transactions get 10 points"""
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return 0
    
    transaction_count = user.get('transaction_count', 0)
    
    # Increment transaction count
    new_count = transaction_count + 1
    a.update_one(
        {'username': username},
        {'$inc': {'transaction_count': 1}}
    )
    
    # Award 10 points only for first 5 transactions
    if transaction_count < 5:
        award_points(username, 10)
        # Generate bonus_id for this transaction award
        import time
        bonus_id = f"transaction_{new_count}_{int(time.time())}"
        a.update_one(
            {'username': username},
            {'$set': {'last_transaction_bonus_id': bonus_id}}
        )
        return 10, bonus_id
    
    return 0, None


def check_expense_limit_penalty(username: str, category: str, amount: float):
    """Check if expense exceeds limit and return -30 penalty if limit exceeded"""
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return 0
    
    # Get user's limits
    limits = user.get('limit', {})
    if category not in limits:
        return 0
    
    # Get all transactions to calculate current period income and expenses
    b = db.get_collection(username)
    transactions = list(b.find({}))
    
    # Calculate total income for current month
    current_month_start = get_month_start()
    total_income = 0
    category_expenses = 0
    
    for trans in transactions:
        try:
            trans_date = datetime.strptime(trans.get('dateEntered', ''), '%Y-%m-%d').date()
            if trans_date >= current_month_start:
                if trans.get('type') == 'income':
                    total_income += trans.get('amount', 0)
                elif trans.get('type') == 'debit' and trans.get('category') == category:
                    category_expenses += trans.get('amount', 0)
        except:
            continue
    
    # Check if limit exceeded with this new expense
    if total_income > 0:
        limit_percentage = limits[category]
        limit_amount = (limit_percentage / 100) * total_income
        
        if category_expenses > limit_amount:
            # Apply -30 penalty
            award_points(username, -30)
            return -30
    
    return 0


def get_week_start(date_obj=None):
    """Get the Monday of the current week"""
    if date_obj is None:
        date_obj = datetime.now().date()
    days_since_monday = date_obj.weekday()
    monday = date_obj - timedelta(days=days_since_monday)
    return monday


def get_month_start(date_obj=None):
    """Get the first day of the current month"""
    if date_obj is None:
        date_obj = datetime.now().date()
    return date_obj.replace(day=1)


def check_weekly_streak(username: str):
    """Check if user maintained limits for the past week and award points"""
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return False
    
    current_monday = get_week_start()
    last_check = user.get('last_weekly_check')
    
    # Only check once per week
    if last_check:
        try:
            last_check_date = datetime.strptime(last_check, '%Y-%m-%d').date()
            if last_check_date >= current_monday:
                return False
        except:
            pass
    
    # Get transactions for the past week
    previous_monday = current_monday - timedelta(days=7)
    b = db.get_collection(username)
    weekly_transactions = list(b.find({}))
    
    # Filter transactions from previous week
    weekly_expenses = {}
    total_income = 0
    
    for trans in weekly_transactions:
        try:
            trans_date = datetime.strptime(trans.get('dateEntered', ''), '%Y-%m-%d').date()
            if previous_monday <= trans_date < current_monday:
                if trans.get('type') == 'debit':
                    category = trans.get('category', 'Unknown')
                    amount = float(trans.get('amount', 0))
                    weekly_expenses[category] = weekly_expenses.get(category, 0) + amount
                elif trans.get('type') == 'income':
                    total_income += float(trans.get('amount', 0))
        except:
            continue
    
    # Check if any limit was exceeded
    limits = user.get('limit', {})
    limit_exceeded = False
    
    for category, spent in weekly_expenses.items():
        if category in limits and total_income > 0:
            limit_percentage = limits[category]
            limit_amount = (limit_percentage / 100) * total_income
            if spent > limit_amount:
                limit_exceeded = True
                break
    
    # Award points if no limit exceeded
    if not limit_exceeded and (weekly_expenses or total_income > 0):
        award_points(username, 25)
        
        # Increment consecutive weekly streaks for Streak Star achievement
        consecutive_weeks = user.get('consecutive_weekly_streaks', 0) + 1
        a.update_one(
            {'username': username},
            {'$set': {
                'last_weekly_check': str(current_monday),
                'consecutive_weekly_streaks': consecutive_weeks
            }}
        )
        return True
    
    # Reset consecutive weeks if limit exceeded
    a.update_one(
        {'username': username},
        {'$set': {
            'last_weekly_check': str(current_monday),
            'consecutive_weekly_streaks': 0
        }}
    )
    return False


def check_monthly_streak(username: str):
    """Check monthly limit compliance and award points"""
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return 0
    
    current_month_start = get_month_start()
    last_check = user.get('last_monthly_check')
    
    # Only check once per month
    if last_check:
        try:
            last_check_date = datetime.strptime(last_check, '%Y-%m-%d').date()
            if last_check_date >= current_month_start:
                return 0
        except:
            pass
    
    # Get the previous month's date range
    previous_month_end = current_month_start - timedelta(days=1)
    previous_month_start = previous_month_end.replace(day=1)
    
    # Get transactions for the previous month
    b = db.get_collection(username)
    monthly_transactions = list(b.find({}))
    
    monthly_expenses = {}
    total_income = 0
    
    for trans in monthly_transactions:
        try:
            trans_date = datetime.strptime(trans.get('dateEntered', ''), '%Y-%m-%d').date()
            if previous_month_start <= trans_date <= previous_month_end:
                if trans.get('type') == 'debit':
                    category = trans.get('category', 'Unknown')
                    amount = float(trans.get('amount', 0))
                    monthly_expenses[category] = monthly_expenses.get(category, 0) + amount
                elif trans.get('type') == 'income':
                    total_income += float(trans.get('amount', 0))
        except:
            continue
    
    # Check how many limits were exceeded
    limits = user.get('limit', {})
    total_limits = len(limits)
    exceeded_count = 0
    
    if total_income > 0:
        for category, spent in monthly_expenses.items():
            if category in limits:
                limit_percentage = limits[category]
                limit_amount = (limit_percentage / 100) * total_income
                if spent > limit_amount:
                    exceeded_count += 1
    
    # Calculate points: 100 * (totalLimits - n) / totalLimits
    if total_limits > 0:
        points = int(100 * (total_limits - exceeded_count) / total_limits)
        award_points(username, points)
        
        # Track consecutive months with 100-point bonus for Budget Boss achievement
        if points == 100:
            consecutive_months = user.get('consecutive_monthly_bonuses', 0) + 1
        else:
            consecutive_months = 0
        
        a.update_one(
            {'username': username},
            {'$set': {
                'last_monthly_check': str(current_month_start),
                'consecutive_monthly_bonuses': consecutive_months
            }}
        )
        return points
    
    return 0


def authenticate_user(identifier: str, password: str):
    a = db.get_collection("userInfo")
    user = a.find_one({"username": identifier}) or a.find_one({"email": identifier})
    if not user:
        return None
    stored = user.get("password")
    if stored is None:
        return None
    try:
        if bcrypt.checkpw(password.encode('utf-8'), stored.encode('utf-8')):
            user_out = {k: v for k, v in user.items() if k != 'password' and k != '_id'}
            return user_out
    except ValueError:
        return None
    return None

@app.route("/add-user", methods=["POST"])
def add_user():
    try:
        mySchema = {
            "$jsonSchema": {
            "bsonType": "object",
            "required": ["name", "username", "email", "password", "age"],
            "properties": {
                "name": {
                "bsonType": "string",
                "description": "must be a string and is required"
                },
                "username": {
                "bsonType": "string",
                "description": "must be a string and is required"
                },
                "email": {
                "bsonType": "string",
                "pattern": "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
                "description": "must be a valid email and is required"
                },
                "password": {
                "bsonType": "string",
                "minLength": 6,
                "description": "must be a string and is required"
                },
                "age": {
                "bsonType": "int",
                "minimum": 0,
                "maximum": 130,
                "description": "must be an integer between 0 and 130 and is required"
                },
                "user_interest": {
                "bsonType": "object",
                "description": "object containing user interests with numeric values"
                },
                "limit": {
                "bsonType": "object",
                "description": "object containing category spending limits as percentages"
                },
                "reward_points": {
                "bsonType": "int",
                "minimum": 0,
                "description": "total reward points earned by the user"
                },
                "last_weekly_check": {
                "bsonType": "string",
                "description": "date of last weekly streak check (Monday)"
                },
                "last_monthly_check": {
                "bsonType": "string",
                "description": "date of last monthly streak check"
                },
                "transaction_count": {
                "bsonType": "int",
                "minimum": 0,
                "description": "total number of transactions (income/expense/loan) added by user"
                },
                "last_bonus_id": {
                "bsonType": "string",
                "description": "unique ID of last awarded bonus to prevent duplicate celebrations"
                },
                "achievements": {
                "bsonType": "array",
                "description": "list of unlocked achievement IDs"
                },
                "achievement_progress": {
                "bsonType": "object",
                "description": "tracks progress towards achievements"
                },
                "consecutive_monthly_bonuses": {
                "bsonType": "int",
                "minimum": 0,
                "description": "count of consecutive months with 100-point bonus (for Budget Boss)"
                },
                "consecutive_weekly_streaks": {
                "bsonType": "int",
                "minimum": 0,
                "description": "count of consecutive weekly streaks (for Streak Star)"
                },
                "timely_loan_repayments": {
                "bsonType": "int",
                "minimum": 0,
                "description": "count of timely loan repayments (for Loan Legend)"
                }
            }
            }
        }
        a = db.create_collection("userInfo", validator = mySchema)
        a.create_index("username", unique = True)
        a.create_index("name", unique = True)
        a.create_index("age", unique = False)
        a.create_index("email", unique = True)
        a.create_index("password", unique = False)
    except Exception as e:
        a = db.get_collection("userInfo")

    try:
        req = request.get_json()
        raw_pw = req.get('password', '')
        hashed = bcrypt.hashpw(raw_pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user_interest = {topic: 0 for topic in finance_topics}
        
        # Default category limits (in percentages)
        category_limits = {
            "Food & Dining": 10,
            "Transportation": 5,
            "Shopping": 5,
            "Entertainment": 5,
            "Bills & Utilities": 10,
            "Healthcare": 5,
            "Education": 20,
            "Travel": 5,
            "Other": 5
        }
        
        a.insert_one({
            "name": req['name'], 
            "username": req["username"], 
            "email": req["email"], 
            "age": req["age"], 
            "password": hashed, 
            "user_interest": user_interest,
            "limit": category_limits,
            "reward_points": 0,
            "last_weekly_check": "",
            "last_monthly_check": "",
            "transaction_count": 0,
            "last_bonus_id": "",
            "achievements": [],
            "achievement_progress": {
                "streak_star_weeks": 0,
                "budget_boss_months": 0,
                "loan_legend_count": 0
            },
            "consecutive_monthly_bonuses": 0,
            "consecutive_weekly_streaks": 0,
            "timely_loan_repayments": 0
        })
        db.create_collection(req['username'])
        return jsonify({'msg': "user inserted"})

    except DuplicateKeyError:
        return jsonify({"error": "User already exists"})

@app.route("/add-transaction", methods = ["POST"])
def add_transaction():
    req = request.get_json()
    username = req['username']
    a = db.get_collection("userInfo")
    if len(list(a.find({'username':username}))) != 0:
        pw = req['password']
        user = list(a.find({'username':username}))[0]
        if bcrypt.checkpw(pw.encode('utf-8'), user['password'].encode('utf-8')):
            b = db.get_collection(username)
            date = str(datetime.now().date())
            amount = req['amount']
            category = req['category']
            
            # Get transaction count BEFORE any operations
            transaction_count = user.get('transaction_count', 0)
            
            # Insert transaction
            b.insert_one({
                "dateEntered": date,
                "amount": amount,
                "type": "debit",
                "category": category
            })
            
            # Increment transaction count first
            a.update_one(
                {'username': username},
                {'$inc': {'transaction_count': 1}}
            )
            
            # Always check if expense exceeds limit
            penalty = check_expense_limit_penalty(username, category, amount)
            
            points_awarded = 0
            bonus_id = None
            
            if penalty < 0:
                # Apply penalty whenever limit is exceeded
                points_awarded = penalty
                import time
                bonus_id = f"penalty_{transaction_count + 1}_{int(time.time())}"
                a.update_one(
                    {'username': username},
                    {'$set': {'last_transaction_bonus_id': bonus_id}}
                )
            elif transaction_count < 5:
                # Award +10 points only for first 5 transactions
                award_points(username, 10)
                points_awarded = 10
                import time
                bonus_id = f"transaction_{transaction_count + 1}_{int(time.time())}"
                a.update_one(
                    {'username': username},
                    {'$set': {'last_transaction_bonus_id': bonus_id}}
                )
            
            # Check weekly streak
            check_weekly_streak(username)
            return jsonify({'msg': "Transaction added successfully", 'points_awarded': points_awarded})
        else:
            return jsonify({'error': "Password entered is incorrect"})
    else:
        return jsonify({'error': "Username does not exist"})

@app.route("/add-income", methods = ["POST"])
def add_income():
    req = request.get_json()
    username = req['username']
    a = db.get_collection("userInfo")
    if len(list(a.find({'username':username}))) != 0:
        pw = req['password']
        user = list(a.find({'username':username}))[0]
        if bcrypt.checkpw(pw.encode('utf-8'), user['password'].encode('utf-8')):
            b = db.get_collection(username)
            date = str(datetime.now().date())
            
            # Get transaction count BEFORE any operations
            transaction_count = user.get('transaction_count', 0)
            
            b.insert_one({
                "dateEntered": date,
                "amount": req['amount'],
                "type": "income",
                "source": req['source']
            })
            
            # Increment transaction count
            a.update_one(
                {'username': username},
                {'$inc': {'transaction_count': 1}}
            )
            
            # Award points for income (only first 5 transactions)
            points_awarded = 0
            bonus_id = None
            
            if transaction_count < 5:
                award_points(username, 10)
                points_awarded = 10
                import time
                bonus_id = f"transaction_{transaction_count + 1}_{int(time.time())}"
                a.update_one(
                    {'username': username},
                    {'$set': {'last_transaction_bonus_id': bonus_id}}
                )
            
            # Check weekly streak
            check_weekly_streak(username)
            return jsonify({'msg': "Income added successfully", 'points_awarded': points_awarded})
        else:
            return jsonify({'error': "Password entered is incorrect"})
        
@app.route("/add-loanTaken", methods = ["POST"])
def add_loan_taken():
    req = request.get_json()
    username = req['username']
    a = db.get_collection("userInfo")
    if len(list(a.find({'username':username}))) != 0:
        pw = req['password']
        user = list(a.find({'username':username}))[0]
        if bcrypt.checkpw(pw.encode('utf-8'), user['password'].encode('utf-8')):
            b = db.get_collection(username)
            date = str(datetime.now().date())
            
            # Get transaction count BEFORE any operations
            transaction_count = user.get('transaction_count', 0)
            
            b.insert_one({
                "dateEntered": date,
                "amount": req['amount'],
                "type": "loanTaken",
                "lender": req['lender']
            })
            
            # Increment transaction count
            a.update_one(
                {'username': username},
                {'$inc': {'transaction_count': 1}}
            )
            
            # Award points for loan (only first 5 transactions)
            points_awarded = 0
            bonus_id = None
            
            if transaction_count < 5:
                award_points(username, 10)
                points_awarded = 10
                import time
                bonus_id = f"transaction_{transaction_count + 1}_{int(time.time())}"
                a.update_one(
                    {'username': username},
                    {'$set': {'last_transaction_bonus_id': bonus_id}}
                )
            
            return jsonify({'msg': "Loan taken added successfully", 'points_awarded': points_awarded})
        else:
            return jsonify({'error': "Password entered is incorrect"})

@app.route("/add-loanRepayment", methods = ["POST"])
def add_loan_repayment():
    req = request.get_json()
    username = req['username']
    a = db.get_collection("userInfo")
    if len(list(a.find({'username':username}))) != 0:
        pw = req['password']
        user = list(a.find({'username':username}))[0]
        if bcrypt.checkpw(pw.encode('utf-8'), user['password'].encode('utf-8')):
            b = db.get_collection(username)
            date = str(datetime.now().date())
            
            # Get transaction count BEFORE any operations
            transaction_count = user.get('transaction_count', 0)
            
            b.insert_one({
                "dateEntered": date,
                "amount": req['amount'],
                "type": "loanRepayment",
                "lender": req['lender'],
                "is_paid_on_time": req['is_paid_on_time']
            })
            
            # Increment transaction count
            a.update_one(
                {'username': username},
                {'$inc': {'transaction_count': 1}}
            )
            
            # Award points: transaction points (first 5 only) + 50 bonus for timely payment
            points_awarded = 0
            bonus_id = None
            
            if transaction_count < 5:
                award_points(username, 10)
                points_awarded = 10
                import time
                bonus_id = f"transaction_{transaction_count + 1}_{int(time.time())}"
                a.update_one(
                    {'username': username},
                    {'$set': {'last_transaction_bonus_id': bonus_id}}
                )
            
            # Always award 50 points for timely payment
            if req.get('is_paid_on_time', False):
                award_points(username, 50)
                points_awarded += 50
                
                # Track timely repayments for Loan Legend achievement
                a.update_one(
                    {'username': username},
                    {'$inc': {'timely_loan_repayments': 1}}
                )
            
            return jsonify({'msg': "Loan repayment added successfully", 'points_awarded': points_awarded})
        else:
            return jsonify({'error': "Password entered is incorrect"})
        

@app.route("/get-user-data", methods = ["POST"])
def get_user_data():
    req = request.get_json()
    username = req['username']
    a = db.get_collection("userInfo")
    if len(list(a.find({'username':username}))) != 0:
        pw = req['password']
        user = list(a.find({'username':username}))[0]
        if bcrypt.checkpw(pw.encode('utf-8'), user['password'].encode('utf-8')):
            b = db.get_collection(username)
            data = list(b.find({}, {'_id': False}))
            return jsonify(data)

        else:
            return jsonify({'error': "Password entered is incorrect"})


@app.route("/signin", methods=["POST"])
def signin():
    req = request.get_json() or {}
    identifier = req.get('identifier') or req.get('username') or req.get('email')
    password = req.get('password', '')
    if not identifier or not password:
        return jsonify({'error': 'identifier and password are required'}), 400

    user = authenticate_user(identifier, password)
    if user:
        return jsonify({'msg': 'signin successful', 'user': user}), 200
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route("/gemini-suggestions", methods=["POST"])
def gemini_suggestions():
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    
    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    b = db.get_collection(username)
    data = list(b.find({}, {'_id': False}))
    
    if not data:
        return jsonify({'error': 'No transaction data available for analysis'}), 404
    
    try:
        suggestions = get_gemini_suggestions(data)
        
        return jsonify({
            'msg': 'Suggestions generated successfully',
            'praise': suggestions.praise,
            'suggestions': suggestions.suggestions
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to generate suggestions: {str(e)}'}), 500


@app.route("/finance-news", methods=["GET"])
def finance_news():
    query = request.args.get('query', 'finance tips OR personal finance OR money management OR budgeting OR saving money')
    sort_by = request.args.get('sort_by', 'publishedAt')
    page_size = int(request.args.get('page_size', 10))
    page = int(request.args.get('page', 1))
    from_date = request.args.get('from_date', None)
    
    try:
        result = get_finance_tips_articles(
            query=query,
            sort_by=sort_by,
            page_size=page_size,
            page=page,
            from_date=from_date
        )
        
        if result['status'] == 'error':
            return jsonify({'error': result.get('error', 'Failed to fetch articles')}), 500
        
        formatted_articles = format_articles_for_display(result['articles'])
        
        return jsonify({
            'status': 'ok',
            'totalResults': result['totalResults'],
            'articles': formatted_articles,
            'query': result.get('query'),
            'from_date': result.get('from_date')
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch finance news: {str(e)}'}), 500


@app.route("/finance-headlines", methods=["GET"])
def finance_headlines():
    country = request.args.get('country', 'in')
    page_size = int(request.args.get('page_size', 10))
    page = int(request.args.get('page', 1))
    
    try:
        result = get_top_finance_headlines(
            country=country,
            page_size=page_size,
            page=page
        )
        
        if result['status'] == 'error':
            return jsonify({'error': result.get('error', 'Failed to fetch headlines')}), 500
        
        formatted_articles = format_articles_for_display(result['articles'])
        
        return jsonify({
            'status': 'ok',
            'totalResults': result['totalResults'],
            'articles': formatted_articles
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to fetch finance headlines: {str(e)}'}), 500


@app.route("/add-post", methods=["POST"])
def add_post():
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    content = req.get('content', '')
    
    if not username or not password or not content:
        return jsonify({'error': 'username, password, and content are required'}), 400
    
    # Convert \n string literals back to actual newlines
    content = content.replace('\\n', '\n')
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    try:
        keywords = get_keywords(content)
        
        community = db.get_collection("community")
        
        last_post = community.find_one(sort=[("post_id", -1)])
        next_post_id = (last_post.get("post_id", 0) if last_post else 0) + 1
        
        post = {
            "post_id": next_post_id,
            "username": username,
            "dateEntered": str(datetime.now().date()),
            "timeEntered": str(datetime.now().time()),
            "content": content,
            "keywords": keywords
        }
        
        community.insert_one(post)
        
        return jsonify({
            'msg': 'Post added successfully',
            'post_id': next_post_id,
            'keywords': keywords
        }), 201
    
    except Exception as e:
        return jsonify({'error': f'Failed to add post: {str(e)}'}), 500


@app.route("/get-post", methods=["GET"])
def get_post():
    try:
        community = db.get_collection("community")
        post_id = request.args.get('post_id')
        
        if post_id:
            try:
                post_id_int = int(post_id)
                post = community.find_one({"post_id": post_id_int}, {'_id': False})
                
                if not post:
                    return jsonify({'error': 'Post not found'}), 404
                
                return jsonify(post), 200
            
            except ValueError:
                return jsonify({'error': 'Invalid post_id format'}), 400
        else:
            posts = list(community.find({}, {'_id': False}))
            return jsonify(posts), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve posts: {str(e)}'}), 500


@app.route("/get-user-limits", methods=["POST"])
def get_user_limits():
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    
    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    limits = user.get('limit', {})
    return jsonify({'limits': limits}), 200


@app.route("/update-user-limits", methods=["POST"])
def update_user_limits():
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    new_limits = req.get('limits')
    
    if not username or not password or not new_limits:
        return jsonify({'error': 'username, password, and limits are required'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    try:
        a.update_one(
            {'username': username},
            {'$set': {'limit': new_limits}}
        )
        return jsonify({'msg': 'Limits updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to update limits: {str(e)}'}), 500


@app.route("/handle-interaction", methods=["POST"])
def handle_interaction():
    req = request.get_json()
    username = req.get('username')
    post_id = req.get('post_id')
    weight = req.get('weight', 0)
    
    if not username or post_id is None or weight is None:
        return jsonify({'error': 'username, post_id, and weight are required'}), 400
    
    try:
        weight = float(weight)
    except ValueError:
        return jsonify({'error': 'weight must be a number'}), 400
    
    try:
        post_id_int = int(post_id)
    except ValueError:
        return jsonify({'error': 'post_id must be an integer'}), 400
    
    community = db.get_collection("community")
    post = community.find_one({"post_id": post_id_int}, {'_id': False})
    
    if not post:
        return jsonify({'error': 'Post not found'}), 404
    
    post_keywords = post.get('keywords', [])
    
    user_info = db.get_collection("userInfo")
    user = user_info.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user_interest = user.get('user_interest', {})
    
    for topic in post_keywords:
        if topic in user_interest:
            user_interest[topic] += weight
    
    user_info.update_one(
        {'username': username},
        {'$set': {'user_interest': user_interest}}
    )
    
    return jsonify({
        'msg': 'Interaction handled successfully',
        'updated_interests': user_interest
    }), 200


@app.route("/add-category", methods=["POST"])
def add_category():
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    category_name = req.get('category_name', '').strip()
    limit_percentage = req.get('limit_percentage', 5)
    
    if not username or not password or not category_name:
        return jsonify({'error': 'username, password, and category_name are required'}), 400
    
    try:
        limit_percentage = float(limit_percentage)
        if limit_percentage < 0 or limit_percentage > 100:
            return jsonify({'error': 'limit_percentage must be between 0 and 100'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'limit_percentage must be a valid number'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    limits = user.get('limit', {})
    
    if category_name in limits:
        return jsonify({'error': 'Category already exists'}), 400
    
    limits[category_name] = limit_percentage
    
    try:
        a.update_one(
            {'username': username},
            {'$set': {'limit': limits}}
        )
        return jsonify({
            'msg': 'Category added successfully',
            'category': category_name,
            'limit': limit_percentage,
            'all_limits': limits
        }), 201
    except Exception as e:
        return jsonify({'error': f'Failed to add category: {str(e)}'}), 500


@app.route("/delete-category", methods=["POST"])
def delete_category():
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    category_name = req.get('category_name', '').strip()
    
    if not username or not password or not category_name:
        return jsonify({'error': 'username, password, and category_name are required'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    limits = user.get('limit', {})
    
    if category_name not in limits:
        return jsonify({'error': 'Category does not exist'}), 404
    
    del limits[category_name]
    
    try:
        a.update_one(
            {'username': username},
            {'$set': {'limit': limits}}
        )
        return jsonify({
            'msg': 'Category deleted successfully',
            'deleted_category': category_name,
            'all_limits': limits
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to delete category: {str(e)}'}), 500


@app.route("/get-analytics", methods=["POST"])
def get_analytics():
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    time_frame = req.get('time_frame', '1month')  # 1week, 1month, 3months, 6months, 1year
    
    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    # Calculate date range based on time_frame
    from datetime import timedelta
    end_date = datetime.now().date()
    
    time_frame_days = {
        '1week': 7,
        '1month': 30,
        '3months': 90,
        '6months': 180,
        '1year': 365
    }
    
    days = time_frame_days.get(time_frame, 30)
    start_date = end_date - timedelta(days=days)
    
    # Fetch user transactions
    b = db.get_collection(username)
    all_transactions = list(b.find({}, {'_id': False}))
    
    # Filter transactions by date range
    filtered_transactions = []
    for trans in all_transactions:
        try:
            trans_date = datetime.strptime(trans.get('dateEntered', ''), '%Y-%m-%d').date()
            if start_date <= trans_date <= end_date:
                filtered_transactions.append(trans)
        except (ValueError, AttributeError):
            continue
    
    # Calculate income by source
    income_by_source = {}
    total_income = 0
    
    for trans in filtered_transactions:
        if trans.get('type') == 'income':
            source = trans.get('source', 'Unknown')
            amount = float(trans.get('amount', 0))
            
            if source in income_by_source:
                income_by_source[source] += amount
            else:
                income_by_source[source] = amount
            
            total_income += amount
    
    # Calculate expenses by category
    expense_by_category = {}
    total_expense = 0
    
    for trans in filtered_transactions:
        if trans.get('type') == 'debit':
            category = trans.get('category', 'Unknown')
            amount = float(trans.get('amount', 0))
            
            if category in expense_by_category:
                expense_by_category[category] += amount
            else:
                expense_by_category[category] = amount
            
            total_expense += amount
    
    # Calculate loans taken
    loans_taken = {}
    total_loans_taken = 0
    
    for trans in filtered_transactions:
        if trans.get('type') == 'loanTaken':
            lender = trans.get('lender', 'Unknown')
            amount = float(trans.get('amount', 0))
            
            if lender in loans_taken:
                loans_taken[lender] += amount
            else:
                loans_taken[lender] = amount
            
            total_loans_taken += amount
    
    # Calculate loan repayments
    loan_repayments = {}
    total_loan_repayments = 0
    
    for trans in filtered_transactions:
        if trans.get('type') == 'loanRepayment':
            lender = trans.get('lender', 'Unknown')
            amount = float(trans.get('amount', 0))
            
            if lender in loan_repayments:
                loan_repayments[lender] += amount
            else:
                loan_repayments[lender] = amount
            
            total_loan_repayments += amount
    
    # Sort by amount (descending)
    income_by_source = dict(sorted(income_by_source.items(), key=lambda x: x[1], reverse=True))
    expense_by_category = dict(sorted(expense_by_category.items(), key=lambda x: x[1], reverse=True))
    loans_taken = dict(sorted(loans_taken.items(), key=lambda x: x[1], reverse=True))
    loan_repayments = dict(sorted(loan_repayments.items(), key=lambda x: x[1], reverse=True))
    
    return jsonify({
        'time_frame': time_frame,
        'start_date': str(start_date),
        'end_date': str(end_date),
        'income': {
            'by_source': income_by_source,
            'total': round(total_income, 2)
        },
        'expenses': {
            'by_category': expense_by_category,
            'total': round(total_expense, 2)
        },
        'loans': {
            'taken': {
                'by_lender': loans_taken,
                'total': round(total_loans_taken, 2)
            },
            'repayments': {
                'by_lender': loan_repayments,
                'total': round(total_loan_repayments, 2)
            }
        },
        'net_balance': round(total_income - total_expense - total_loan_repayments + total_loans_taken, 2)
    }), 200


@app.route("/get-rewards", methods=["POST"])
def get_rewards():
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    
    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    # Check weekly and monthly streaks (will award points if applicable)
    weekly_awarded = check_weekly_streak(username)
    monthly_points = check_monthly_streak(username)
    
    # Check for newly unlocked achievements
    newly_unlocked = check_achievement_unlock(username)
    
    # Get updated user data
    user = a.find_one({'username': username})
    
    # Calculate if streaks were just awarded (for animations)
    streak_bonuses = []
    bonus_id = None
    
    # Check for streak bonuses
    if weekly_awarded or monthly_points > 0:
        # Generate unique bonus ID based on current checks
        bonus_id = f"streak_{user.get('last_weekly_check', 'none')}_{user.get('last_monthly_check', 'none')}"
        
        if weekly_awarded:
            streak_bonuses.append({
                'type': 'weekly',
                'points': 25,
                'message': '🔥 Weekly Streak Bonus!'
            })
        if monthly_points > 0:
            streak_bonuses.append({
                'type': 'monthly',
                'points': monthly_points,
                'message': f'🏅 Monthly Compliance Bonus!'
            })
    
    # Check for transaction bonus (if a new transaction was just added)
    last_transaction_bonus_id = user.get('last_transaction_bonus_id')
    if last_transaction_bonus_id:
        # Check if this transaction bonus hasn't been shown yet
        last_shown_transaction_bonus = user.get('last_shown_transaction_bonus_id')
        if last_transaction_bonus_id != last_shown_transaction_bonus:
            transaction_count = user.get('transaction_count', 0)
            if transaction_count <= 5:  # Only show for first 5
                bonus_id = last_transaction_bonus_id
                streak_bonuses.append({
                    'type': 'transaction',
                    'points': 10,
                    'message': f'💰 Transaction Bonus! ({transaction_count}/5)'
                })
                # Mark this transaction bonus as shown
                a.update_one(
                    {'username': username},
                    {'$set': {'last_shown_transaction_bonus_id': last_transaction_bonus_id}}
                )
    
    # Check if this is a new bonus (not already shown)
    last_bonus_id = user.get('last_bonus_id')
    is_new_bonus = bonus_id and bonus_id != last_bonus_id
    
    # Update last_bonus_id if we have new bonuses (for streak bonuses only)
    if is_new_bonus and (weekly_awarded or monthly_points > 0):
        a.update_one(
            {'username': username},
            {'$set': {'last_bonus_id': bonus_id}}
        )
    
    # For transaction bonuses, always mark as new if they exist
    if last_transaction_bonus_id and last_transaction_bonus_id != user.get('last_shown_transaction_bonus_id'):
        is_new_bonus = True
    
    return jsonify({
        'reward_points': user.get('reward_points', 0),
        'transaction_count': user.get('transaction_count', 0),
        'last_weekly_check': user.get('last_weekly_check'),
        'last_monthly_check': user.get('last_monthly_check'),
        'streak_bonuses': streak_bonuses,
        'has_new_bonuses': is_new_bonus,
        'bonus_id': bonus_id,
        'newly_unlocked_achievements': newly_unlocked
    }), 200


@app.route("/check-streaks", methods=["POST"])
def check_streaks():
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    
    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    # Manually trigger streak checks
    weekly_awarded = check_weekly_streak(username)
    monthly_points = check_monthly_streak(username)
    
    return jsonify({
        'msg': 'Streak checks completed',
        'weekly_bonus': 25 if weekly_awarded else 0,
        'monthly_bonus': monthly_points,
        'total_bonus': (25 if weekly_awarded else 0) + monthly_points
    }), 200


@app.route("/get-rank-and-achievements", methods=["POST"])
def get_rank_and_achievements():
    """Get user's current rank and achievements with progress"""
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Check for newly unlocked achievements
    newly_unlocked = check_achievement_unlock(username)
    
    # Refresh user data after achievement check
    user = a.find_one({'username': username})
    
    # Get current rank
    points = user.get('reward_points', 0)
    current_rank = get_user_rank(points)
    next_rank = get_next_rank(points)
    
    # Calculate progress to next rank
    progress_percentage = 0
    points_to_next = 0
    if next_rank:
        points_in_current_rank = points - current_rank['min_points']
        total_points_for_rank = next_rank['min_points'] - current_rank['min_points']
        progress_percentage = int((points_in_current_rank / total_points_for_rank) * 100)
        points_to_next = next_rank['min_points'] - points
    
    # Get achievements and their progress
    unlocked_achievements = user.get('achievements', [])
    achievements_data = []
    
    for achievement_id, achievement in ACHIEVEMENTS.items():
        is_unlocked = achievement_id in unlocked_achievements
        progress = 0
        current_value = 0
        
        if achievement_id == 'streak_star':
            current_value = user.get('consecutive_weekly_streaks', 0)
            progress = min(100, int((current_value / achievement['requirement']) * 100))
        elif achievement_id == 'budget_boss':
            current_value = user.get('consecutive_monthly_bonuses', 0)
            progress = min(100, int((current_value / achievement['requirement']) * 100))
        elif achievement_id == 'loan_legend':
            current_value = user.get('timely_loan_repayments', 0)
            progress = min(100, int((current_value / achievement['requirement']) * 100))
        
        achievements_data.append({
            'id': achievement_id,
            'name': achievement['name'],
            'icon': achievement['icon'],
            'description': achievement['description'],
            'unlocked': is_unlocked,
            'progress': progress,
            'current': current_value,
            'required': achievement['requirement']
        })
    
    return jsonify({
        'rank': {
            'name': current_rank['name'],
            'icon': current_rank['icon'],
            'min_points': current_rank['min_points'],
            'max_points': current_rank['max_points'],
            'current_points': points
        },
        'next_rank': {
            'name': next_rank['name'],
            'icon': next_rank['icon'],
            'min_points': next_rank['min_points'],
            'points_to_next': points_to_next,
            'progress_percentage': progress_percentage
        } if next_rank else None,
        'achievements': achievements_data,
        'newly_unlocked': newly_unlocked
    }), 200


# ==================== TRANSLATION API ENDPOINTS ====================

@app.route('/api/translate', methods=['POST'])
def translate():
    """
    Translate text from one language to another
    
    Request Body:
    {
        "text": "Hello world",
        "source": "en",
        "target": "es"
    }
    
    Response:
    {
        "translatedText": "Hola mundo",
        "source": "en",
        "target": "es"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing required field: text'}), 400
        
        text = data.get('text', '')
        source_lang = data.get('source', 'en')
        target_lang = data.get('target', 'en')
        
        # Handle empty text
        if not text or text.strip() == '':
            return jsonify({
                'translatedText': text,
                'source': source_lang,
                'target': target_lang
            }), 200
        
        # Translate the text
        translated = translate_text(text, source_lang, target_lang)
        
        return jsonify({
            'translatedText': translated,
            'source': source_lang,
            'target': target_lang
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/translate/batch', methods=['POST'])
def translate_batch_endpoint():
    """
    Translate multiple texts at once
    
    Request Body:
    {
        "texts": ["Hello", "World"],
        "source": "en",
        "target": "es"
    }
    
    Response:
    {
        "translations": ["Hola", "Mundo"],
        "source": "en",
        "target": "es"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({'error': 'Missing required field: texts'}), 400
        
        texts = data.get('texts', [])
        source_lang = data.get('source', 'en')
        target_lang = data.get('target', 'en')
        
        if not isinstance(texts, list):
            return jsonify({'error': 'texts must be an array'}), 400
        
        # Translate all texts
        translations = translate_batch(texts, source_lang, target_lang)
        
        return jsonify({
            'translations': translations,
            'source': source_lang,
            'target': target_lang
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/translate/languages', methods=['GET'])
def get_languages():
    """
    Get list of supported languages
    
    Response:
    {
        "languages": [
            {"code": "en", "name": "English"},
            {"code": "es", "name": "Spanish (Español)"},
            ...
        ]
    }
    """
    try:
        languages = get_supported_languages()
        return jsonify({'languages': languages}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== FRIEND REQUEST & EXPENSE SPLITTING ENDPOINTS ====================

@app.route("/send-friend-request", methods=["POST"])
def send_friend_request():
    """Send a friend request to another user"""
    req = request.get_json()
    sender_username = req.get('username')
    password = req.get('password')
    recipient_username = req.get('recipient_username')
    
    if not sender_username or not password or not recipient_username:
        return jsonify({'error': 'username, password, and recipient_username are required'}), 400
    
    if sender_username == recipient_username:
        return jsonify({'error': 'Cannot send friend request to yourself'}), 400
    
    a = db.get_collection("userInfo")
    sender = a.find_one({'username': sender_username})
    
    if not sender:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), sender['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    # Check if recipient exists
    recipient = a.find_one({'username': recipient_username})
    if not recipient:
        return jsonify({'error': 'Recipient username does not exist'}), 404
    
    # Check if already friends
    sender_friends = sender.get('friends', [])
    if recipient_username in sender_friends:
        return jsonify({'error': 'Already friends with this user'}), 400
    
    # Check if request already exists
    friend_requests = db.get_collection("friendRequests")
    existing_request = friend_requests.find_one({
        'sender': sender_username,
        'recipient': recipient_username,
        'status': 'pending'
    })
    
    if existing_request:
        return jsonify({'error': 'Friend request already sent'}), 400
    
    # Create friend request
    try:
        friend_requests.insert_one({
            'sender': sender_username,
            'recipient': recipient_username,
            'status': 'pending',
            'dateCreated': str(datetime.now().date()),
            'timeCreated': str(datetime.now().time())
        })
        
        return jsonify({'msg': 'Friend request sent successfully'}), 201
    except Exception as e:
        return jsonify({'error': f'Failed to send friend request: {str(e)}'}), 500


@app.route("/get-friend-requests", methods=["POST"])
def get_friend_requests():
    """Get all pending friend requests for a user"""
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    
    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    friend_requests = db.get_collection("friendRequests")
    
    # Get received requests
    received_requests = list(friend_requests.find({
        'recipient': username,
        'status': 'pending'
    }, {'_id': False}))
    
    # Get sent requests
    sent_requests = list(friend_requests.find({
        'sender': username,
        'status': 'pending'
    }, {'_id': False}))
    
    return jsonify({
        'received': received_requests,
        'sent': sent_requests
    }), 200


@app.route("/respond-friend-request", methods=["POST"])
def respond_friend_request():
    """Approve or decline a friend request"""
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    sender_username = req.get('sender_username')
    action = req.get('action')  # 'approve' or 'decline'
    
    if not username or not password or not sender_username or not action:
        return jsonify({'error': 'username, password, sender_username, and action are required'}), 400
    
    if action not in ['approve', 'decline']:
        return jsonify({'error': 'action must be "approve" or "decline"'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    friend_requests = db.get_collection("friendRequests")
    
    # Find the friend request
    friend_request = friend_requests.find_one({
        'sender': sender_username,
        'recipient': username,
        'status': 'pending'
    })
    
    if not friend_request:
        return jsonify({'error': 'Friend request not found'}), 404
    
    try:
        if action == 'approve':
            # Add each other to friends list
            a.update_one(
                {'username': username},
                {'$addToSet': {'friends': sender_username}}
            )
            a.update_one(
                {'username': sender_username},
                {'$addToSet': {'friends': username}}
            )
            
            # Update request status
            friend_requests.update_one(
                {'sender': sender_username, 'recipient': username, 'status': 'pending'},
                {'$set': {'status': 'approved'}}
            )
            
            return jsonify({'msg': 'Friend request approved'}), 200
        else:
            # Update request status
            friend_requests.update_one(
                {'sender': sender_username, 'recipient': username, 'status': 'pending'},
                {'$set': {'status': 'declined'}}
            )
            
            return jsonify({'msg': 'Friend request declined'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to respond to friend request: {str(e)}'}), 500


@app.route("/get-friends", methods=["POST"])
def get_friends():
    """Get all friends for a user"""
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    
    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    friends = user.get('friends', [])
    
    return jsonify({'friends': friends}), 200


@app.route("/remove-friend", methods=["POST"])
def remove_friend():
    """Remove a friend from user's friend list"""
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    friend_username = req.get('friend_username')
    
    if not username or not password or not friend_username:
        return jsonify({'error': 'username, password, and friend_username are required'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    try:
        # Remove from both users' friend lists
        a.update_one(
            {'username': username},
            {'$pull': {'friends': friend_username}}
        )
        a.update_one(
            {'username': friend_username},
            {'$pull': {'friends': username}}
        )
        
        return jsonify({'msg': 'Friend removed successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to remove friend: {str(e)}'}), 500


@app.route("/create-split-expense", methods=["POST"])
def create_split_expense():
    """Create a new split expense with friends"""
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    amount = req.get('amount')
    description = req.get('description', '')
    split_with = req.get('split_with', [])  # List of friend usernames
    
    if not username or not password or not amount:
        return jsonify({'error': 'username, password, and amount are required'}), 400
    
    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({'error': 'amount must be greater than 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'amount must be a valid number'}), 400
    
    if not split_with or not isinstance(split_with, list):
        return jsonify({'error': 'split_with must be a non-empty array'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    # Verify all users in split_with are friends
    user_friends = user.get('friends', [])
    for friend in split_with:
        if friend not in user_friends:
            return jsonify({'error': f'{friend} is not in your friends list'}), 400
    
    # Calculate split amount per person (including the creator)
    total_people = len(split_with) + 1  # +1 for the creator
    amount_per_person = round(amount / total_people, 2)
    
    # Create split balances
    balances = {}
    for friend in split_with:
        balances[friend] = amount_per_person  # They owe the creator
    
    try:
        split_expenses = db.get_collection("splitExpenses")
        
        # Get next expense ID
        last_expense = split_expenses.find_one(sort=[("expense_id", -1)])
        next_expense_id = (last_expense.get("expense_id", 0) if last_expense else 0) + 1
        
        date = str(datetime.now().date())
        
        # Add split expense to creator's transaction history
        creator_collection = db.get_collection(username)
        creator_collection.insert_one({
            "dateEntered": date,
            "amount": amount_per_person,
            "type": "debit",
            "category": "Split Expense",
            "description": f"Split: {description}" if description else "Split Expense",
            "split_expense_id": next_expense_id
        })
        
        # Add split expense to each friend's transaction history
        for friend in split_with:
            friend_collection = db.get_collection(friend)
            friend_collection.insert_one({
                "dateEntered": date,
                "amount": amount_per_person,
                "type": "debit",
                "category": "Split Expense",
                "description": f"Split: {description}" if description else "Split Expense",
                "split_expense_id": next_expense_id,
                "split_with": username
            })
        
        expense = {
            'expense_id': next_expense_id,
            'created_by': username,
            'amount': amount,
            'description': description,
            'split_with': split_with,
            'total_people': total_people,
            'amount_per_person': amount_per_person,
            'balances': balances,  # {username: amount_owed}
            'settled': False,
            'dateCreated': date,
            'timeCreated': str(datetime.now().time())
        }
        
        split_expenses.insert_one(expense)
        
        return jsonify({
            'msg': 'Split expense created successfully',
            'expense_id': next_expense_id,
            'amount_per_person': amount_per_person
        }), 201
    except Exception as e:
        return jsonify({'error': f'Failed to create split expense: {str(e)}'}), 500


@app.route("/get-split-expenses", methods=["POST"])
def get_split_expenses():
    """Get all split expenses for a user (created by them or split with them)"""
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    
    if not username or not password:
        return jsonify({'error': 'username and password are required'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    split_expenses = db.get_collection("splitExpenses")
    
    # Get expenses created by user
    created_expenses = list(split_expenses.find({'created_by': username}, {'_id': False}))
    
    # Get expenses user is part of
    involved_expenses = list(split_expenses.find({'split_with': username}, {'_id': False}))
    
    # Calculate summary balances
    you_owe = {}  # {friend: total_amount_you_owe}
    owed_to_you = {}  # {friend: total_amount_owed_to_you}
    
    # From expenses you created
    for expense in created_expenses:
        if not expense.get('settled', False):
            for friend, amount in expense.get('balances', {}).items():
                owed_to_you[friend] = owed_to_you.get(friend, 0) + amount
    
    # From expenses you're part of
    for expense in involved_expenses:
        if not expense.get('settled', False):
            creator = expense.get('created_by')
            amount = expense.get('balances', {}).get(username, 0)
            you_owe[creator] = you_owe.get(creator, 0) + amount
    
    return jsonify({
        'created_expenses': created_expenses,
        'involved_expenses': involved_expenses,
        'you_owe': you_owe,
        'owed_to_you': owed_to_you
    }), 200


@app.route("/settle-expense", methods=["POST"])
def settle_expense():
    """Mark an expense as settled"""
    req = request.get_json()
    username = req.get('username')
    password = req.get('password')
    expense_id = req.get('expense_id')
    
    if not username or not password or expense_id is None:
        return jsonify({'error': 'username, password, and expense_id are required'}), 400
    
    try:
        expense_id = int(expense_id)
    except (ValueError, TypeError):
        return jsonify({'error': 'expense_id must be a valid integer'}), 400
    
    a = db.get_collection("userInfo")
    user = a.find_one({'username': username})
    
    if not user:
        return jsonify({'error': 'Username does not exist'}), 404
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'error': 'Password entered is incorrect'}), 401
    
    split_expenses = db.get_collection("splitExpenses")
    expense = split_expenses.find_one({'expense_id': expense_id})
    
    if not expense:
        return jsonify({'error': 'Expense not found'}), 404
    
    # Only the creator can mark as settled
    if expense.get('created_by') != username:
        return jsonify({'error': 'Only the expense creator can settle this expense'}), 403
    
    try:
        split_expenses.update_one(
            {'expense_id': expense_id},
            {'$set': {'settled': True, 'dateSettled': str(datetime.now().date())}}
        )
        
        return jsonify({'msg': 'Expense marked as settled'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to settle expense: {str(e)}'}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)