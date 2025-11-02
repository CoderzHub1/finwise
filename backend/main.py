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


def award_points(username: str, points: int):
    """Award points to a user"""
    a = db.get_collection("userInfo")
    a.update_one(
        {'username': username},
        {'$inc': {'reward_points': points}}
    )


def award_transaction_points(username: str):
    """Award points for transactions - only first 20 transactions get 10 points"""
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
    
    # Award 10 points only for first 20 transactions
    if transaction_count < 20:
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
        a.update_one(
            {'username': username},
            {'$set': {'last_weekly_check': str(current_monday)}}
        )
        return True
    
    # Update last check date even if limit exceeded
    a.update_one(
        {'username': username},
        {'$set': {'last_weekly_check': str(current_monday)}}
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
        a.update_one(
            {'username': username},
            {'$set': {'last_monthly_check': str(current_month_start)}}
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
            "last_weekly_check": None,
            "last_monthly_check": None,
            "transaction_count": 0,
            "last_bonus_id": None
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
            b.insert_one({
                "dateEntered": date,
                "amount": req['amount'],
                "type": "debit",
                "category": req['category']
            })
            # Award points for transaction (only first 20 transactions)
            points_awarded, bonus_id = award_transaction_points(username)
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
            b.insert_one({
                "dateEntered": date,
                "amount": req['amount'],
                "type": "income",
                "source": req['source']
            })
            # Award points for income (only first 20 transactions)
            points_awarded, bonus_id = award_transaction_points(username)
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
            b.insert_one({
                "dateEntered": date,
                "amount": req['amount'],
                "type": "loanTaken",
                "lender": req['lender']
            })
            # Award points for loan (only first 20 transactions)
            points_awarded, bonus_id = award_transaction_points(username)
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
            b.insert_one({
                "dateEntered": date,
                "amount": req['amount'],
                "type": "loanRepayment",
                "lender": req['lender'],
                "is_paid_on_time": req['is_paid_on_time']
            })
            # Award points: transaction points (first 20 only) + 50 bonus for timely payment
            points_awarded, bonus_id = award_transaction_points(username)
            if req.get('is_paid_on_time', False):
                award_points(username, 50)
                points_awarded += 50
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
            if transaction_count <= 20:  # Only show for first 20
                bonus_id = last_transaction_bonus_id
                streak_bonuses.append({
                    'type': 'transaction',
                    'points': 10,
                    'message': f'💰 Transaction Bonus! ({transaction_count}/20)'
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
        'bonus_id': bonus_id
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)