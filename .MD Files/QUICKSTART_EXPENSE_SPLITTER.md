# 🚀 Quick Start - Expense Splitter Feature

## Prerequisites
- Flask backend running on `http://localhost:5000`
- Next.js frontend running on `http://localhost:3000`
- MongoDB database connected

## 🎬 Getting Started in 5 Minutes

### Step 1: Create Test Users
Use the existing signup page or API to create two test accounts:

**User 1:**
- Username: `alice`
- Password: `password123`
- Name: Alice Johnson
- Email: alice@test.com
- Age: 25

**User 2:**
- Username: `bob`
- Password: `password123`
- Name: Bob Smith
- Email: bob@test.com
- Age: 26

### Step 2: Add Friend
1. Login as `alice`
2. Click **"Split Expenses"** in navbar
3. In **Friends** tab, enter `bob` in the "Add Friend" field
4. Click **"Send Request"**

### Step 3: Approve Request
1. Logout and login as `bob`
2. Go to **Split Expenses** → **Friends** tab
3. See **"Splitting Requests (1)"** section
4. Click **"✓ Approve"** for Alice's request

### Step 4: Create Split Expense
1. Login as `alice`
2. Go to **Split Expenses** → **Split Expenses** tab
3. Click **"+ Create Split Expense"**
4. Fill in:
   - Amount: `1200`
   - Description: `Lunch at cafe`
   - Check ☑ `bob`
5. See preview: "Each person pays: $600"
6. Click **"Create Expense"**

### Step 5: View Balances
**Alice's View:**
- Balance Summary shows: "Owed to You: bob $600"
- Created expense shows Bob owes $600

**Bob's View:**
- Balance Summary shows: "You Owe: alice $600"
- Involved expense shows he owes Alice $600

### Step 6: Settle Expense
1. Login as `alice` (expense creator)
2. In **Expenses You Created** section
3. Click **"Mark as Settled"** on the expense
4. Expense now shows "✓ Settled" and is grayed out
5. Balance summary updates (removes this expense)

## 🎯 Feature Highlights

### Friends Tab
```
┌─────────────────────────────────────┐
│ Add Friend                          │
│ [Enter username] [Send Request]     │
├─────────────────────────────────────┤
│ Splitting Requests (1)              │
│ alice          [✓ Approve] [✗ Decline] │
├─────────────────────────────────────┤
│ My Friends (1)                      │
│ 👤 alice                   [Remove] │
└─────────────────────────────────────┘
```

### Split Expenses Tab
```
┌─────────────────────────────────────┐
│ 💰 Balance Summary                  │
│ ┌──────────┬──────────┐             │
│ │ You Owe  │ Owed to  │             │
│ │ alice    │ You      │             │
│ │ $600     │ bob $500 │             │
│ └──────────┴──────────┘             │
├─────────────────────────────────────┤
│ [+ Create Split Expense]            │
├─────────────────────────────────────┤
│ Expenses You Created (2)            │
│ • Lunch - $1200 [Mark as Settled]   │
├─────────────────────────────────────┤
│ Expenses You're Part Of (1)         │
│ • Dinner - $900 (You owe $300)      │
└─────────────────────────────────────┘
```

## 📱 Use Cases

### Case 1: Group Dinner
**Scenario:** 3 friends go to dinner, Alice pays $3000

**Steps:**
1. Alice creates expense: $3000, split with Bob & Charlie
2. System calculates: $1000 each
3. Bob & Charlie each owe Alice $1000
4. After payment, Alice settles the expense

### Case 2: Roommate Expenses
**Scenario:** Roommates sharing monthly bills

**Steps:**
1. All roommates add each other as friends
2. One person creates expense for each bill
3. Everyone sees their portion
4. Pay and settle each expense

### Case 3: Trip Expenses
**Scenario:** Friends on vacation tracking expenses

**Steps:**
1. Different people pay for different things
2. Each creates an expense for what they paid
3. At end of trip, check balance summary
4. See who owes whom in total
5. Settle up all at once

## 🐛 Common Issues & Solutions

### Issue: "Friend request already sent"
**Solution:** Check "Sent Requests" section - request is pending

### Issue: "Cannot split with non-friends"
**Solution:** Ensure friend request is approved first

### Issue: "Only the expense creator can settle"
**Solution:** Login as the person who created the expense

### Issue: Balance not updating
**Solution:** Refresh the page or switch tabs to reload data

## 🎨 Visual Guide

### Status Indicators
- 🟢 **Green amounts** = Money owed TO you (you'll receive)
- 🔴 **Red/Pink amounts** = Money you OWE (you'll pay)
- ⚫ **Gray expenses** = Settled (completed)
- 🟡 **Orange badge** = Pending request

### Color Meanings
- **Purple buttons** = Primary actions (create, send)
- **Green buttons** = Positive actions (approve, settle)
- **Red buttons** = Negative actions (decline, remove)

## 📊 API Testing

Test the backend directly:

```bash
cd backend
python test_expense_splitter.py
```

This will test all 9 endpoints in sequence.

## 🔐 Security Notes

- All operations require authentication (username + password)
- Users can only:
  - See their own friends and expenses
  - Create expenses with their friends only
  - Settle expenses they created
- Passwords are hashed using bcrypt

## 💡 Tips

1. **Add multiple friends** before creating expenses
2. **Use descriptions** to remember what expense was for
3. **Check balance summary** regularly to see totals
4. **Settle expenses promptly** after payment to keep clean records
5. **Remove friends** if you no longer need to split with them

## 🎉 You're All Set!

The Expense Splitter is now fully functional. Start by:
1. Adding friends
2. Creating your first split expense
3. Watching the balances update automatically

Happy splitting! 💰✨
