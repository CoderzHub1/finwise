# 🎮 FinWise Rewards Game System

## Overview

The FinWise Rewards Game is a gamification feature designed to encourage users to:
1. Track their finances consistently
2. Stay within budget limits
3. Pay loans on time
4. Build healthy financial habits

## Point System Rules

### 1. Transaction Points (+10 points each)
Users earn **10 points** for every financial entry they add:
- Adding an income entry
- Adding an expense/transaction
- Recording a loan taken
- Recording a loan repayment

**Implementation:** Points are automatically awarded when these endpoints are called:
- `/add-income`
- `/add-transaction`
- `/add-loanTaken`
- `/add-loanRepayment`

### 2. Timely Loan Repayment Bonus (+50 points)
When a loan repayment is marked as `is_paid_on_time: true`, users receive:
- 10 base points (for adding the repayment)
- 50 bonus points (for paying on time)
- **Total: 60 points**

**Implementation:** Checked in `/add-loanRepayment` endpoint.

### 3. Weekly Limit Streak (+25 points)
Users earn **25 points** if they successfully stay within ALL their budget limits for an entire week (Monday to Sunday).

**Rules:**
- Week starts on Monday
- Checks spending from previous Monday to Sunday
- User must not exceed any category spending limit
- Automatically checked when adding new transactions or when calling `/get-rewards`
- Only awards once per week

**Implementation:** 
- Function: `check_weekly_streak(username)`
- Compares category expenses against income-based limits
- Updates `last_weekly_check` to prevent duplicate awards

### 4. Monthly Compliance Bonus (Up to +100 points)
At the end of each month, users earn points based on how many category limits they maintained:

**Formula:**
```
Points = 100 × (Total Limits - Exceeded Limits) ÷ Total Limits
```

**Examples:**
- 0/9 limits exceeded = 100 points
- 1/9 limits exceeded = 89 points
- 3/9 limits exceeded = 67 points
- 9/9 limits exceeded = 0 points

**Implementation:**
- Function: `check_monthly_streak(username)`
- Analyzes previous month's transactions
- Updates `last_monthly_check` to prevent duplicate awards

## Database Schema

### User Info Collection Updates
```python
{
    "name": string,
    "username": string,
    "email": string,
    "age": int,
    "password": string (hashed),
    "user_interest": object,
    "limit": object,
    "reward_points": int (default: 0),           # NEW
    "last_weekly_check": string (date) or null,  # NEW
    "last_monthly_check": string (date) or null  # NEW
}
```

## API Endpoints

### 1. GET /get-rewards (POST)
Fetches user's current reward points and streak information.

**Request:**
```json
{
    "username": "user123",
    "password": "userpassword"
}
```

**Response:**
```json
{
    "reward_points": 250,
    "last_weekly_check": "2025-11-04",
    "last_monthly_check": "2025-11-01",
    "weekly_bonus_awarded": true,
    "monthly_bonus_awarded": 89
}
```

### 2. POST /check-streaks
Manually triggers weekly and monthly streak checks.

**Request:**
```json
{
    "username": "user123",
    "password": "userpassword"
}
```

**Response:**
```json
{
    "msg": "Streak checks completed",
    "weekly_bonus": 25,
    "monthly_bonus": 89,
    "total_bonus": 114
}
```

### Updated Transaction Endpoints
All transaction endpoints now return `points_awarded` in their response:

**Example Response:**
```json
{
    "msg": "Transaction added successfully",
    "points_awarded": 10
}
```

## Frontend Pages

### 1. Rewards Page (`/rewards`)
**Features:**
- Displays total reward points with animated counter
- Shows weekly and monthly streak status
- Lists all ways to earn points
- "Check & Claim Streaks" button
- Link to game rules page

**File:** `frontend/pages/rewards.js`

### 2. Game Rules Page (`/game-rules`)
**Features:**
- Comprehensive explanation of all rules
- Visual examples and formulas
- Winning strategies section
- Call-to-action buttons
- Modern, sleek design with animations

**File:** `frontend/pages/game-rules.js`

### 3. Navigation
The Navbar now includes a "Rewards" link for easy access.

## Helper Functions

### `award_points(username: str, points: int)`
Awards points to a user by incrementing their `reward_points` field.

### `get_week_start(date_obj=None)`
Returns the Monday of the current (or specified) week.

### `get_month_start(date_obj=None)`
Returns the first day of the current (or specified) month.

### `check_weekly_streak(username: str)`
Checks if the user maintained all limits for the previous week and awards 25 points if successful.

### `check_monthly_streak(username: str)`
Calculates monthly compliance score and awards points based on the formula.

## Automatic Point Tracking

Points and streak bonuses are **completely automatic**! They are checked and awarded when users:
1. Add any financial transaction (income, expense, loan)
2. Load the dashboard (RewardsWidget fetches and checks streaks)
3. Visit the rewards page
4. The system automatically displays celebration animations when bonuses are awarded

**No manual action required** - users just use the app and get rewarded!

## User Experience Flow

1. **User signs up** → Starts with 0 points
2. **User adds income** → +10 points
3. **User adds expense** → +10 points (weekly check triggered automatically)
4. **Week passes without limit overflow** → +25 points awarded automatically on dashboard load
5. **Month ends** → Monthly bonus calculated and awarded automatically on dashboard load
6. **User pays loan on time** → +60 points
7. **Dashboard loads with streak bonus** → Celebration animation displays the rewards!

## Design Philosophy

The rewards system is designed to:
- **Encourage consistency:** Regular tracking earns consistent points
- **Promote discipline:** Staying within limits earns bonus points
- **Reward responsibility:** Timely payments earn significant bonuses
- **Build habits:** Weekly and monthly streaks create ongoing engagement

## Styling & UI

- **Color Scheme:** Purple gradient (#667eea to #764ba2) with gold accents
- **Animations:** Smooth transitions, pulse effects, and hover states
- **Responsive:** Mobile-friendly design with adapted layouts
- **Icons:** Emojis used for visual appeal and quick recognition
- **Typography:** Clear hierarchy with bold points displays

## Testing Recommendations

1. Test point awards for all transaction types
2. Verify weekly streak calculation across week boundaries
3. Test monthly bonus with various limit compliance scenarios
4. Ensure duplicate prevention (same week/month not awarded twice)
5. Test UI responsiveness on mobile devices
6. Verify authentication for all reward endpoints

## Future Enhancements (Optional)

- Leaderboard system
- Achievement badges
- Point redemption system
- Streak multipliers
- Social sharing of achievements
- Push notifications for streak milestones
