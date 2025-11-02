# FinWise - Quick Start Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Start MongoDB
Ensure MongoDB is running on your machine:
```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or start manually
mongod
```

### Step 2: Start Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Backend will run on: http://localhost:5000

### Step 3: Start Frontend
Open a new terminal:
```bash
cd frontend
yarn install
yarn dev
```
Frontend will run on: http://localhost:3000

---

## 📱 Using the Application

1. **Open** http://localhost:3000 in your browser
2. **Sign Up** - Create a new account
3. **Login** - Sign in with your credentials
4. **Dashboard** - Start tracking your finances!

---

## 🎮 Gamification Features

### Animated Pie Chart
The pie chart represents your financial health as a game:

- **Yellow/Orange Pie** = Your remaining money
- **Gray Portion** = Money spent
- **Pac-Man Mouth** = Opens and closes continuously

### Animations
1. **Adding Income** 🎉
   - Green balls appear and fly toward the center
   - Pac-Man "eats" the balls
   - Pie chart fills up/completes

2. **Adding Expenses** 💸
   - Pie chart gets "eaten away"
   - Visual representation of spending

3. **Real-time Updates** 📊
   - Smooth transitions
   - Live statistics update
   - Transaction history refreshes

---

## 💡 Features Overview

### 1. Income Tracking 💰
- Add income from various sources
- Track salary, freelance, investments, etc.
- Visual feedback with animations

### 2. Expense Tracking 💸
- Categorized expense tracking
- 9 predefined categories
- Instant pie chart update

### 3. Loans & Credit 🏦
- Record loans taken
- Track repayments
- Monitor on-time/late payments
- Separate tracking for borrowing vs. repaying

### 4. Transaction History 📊
- Filter by type (All, Income, Expenses, Loans)
- Date-sorted display
- Color-coded entries
- Detailed transaction info

---

## 🎨 UI Highlights

- **Modern gradient backgrounds**
- **Smooth animations** with Framer Motion
- **Responsive design** - works on mobile
- **Interactive charts** - Canvas-based rendering
- **Clean forms** - Easy data entry
- **Real-time feedback** - Instant success/error messages

---

## 🔒 Security Features

- ✅ Bcrypt password hashing
- ✅ Session management
- ✅ Protected routes
- ✅ Secure authentication
- ✅ CORS enabled for API calls

---

## 🛠️ Tech Stack

**Backend:**
- Flask (Python web framework)
- MongoDB (Database)
- Bcrypt (Password security)
- Flask-CORS (API access)

**Frontend:**
- Next.js (React framework)
- Axios (API calls)
- Framer Motion (Animations)
- Canvas API (Chart rendering)
- CSS Modules (Styling)

---

## 📝 API Reference

All endpoints require `username` and `password` in the request body for authenticated requests.

### Authentication
```javascript
// Sign Up
POST /add-user
Body: { name, username, email, age, password }

// Sign In
POST /signin
Body: { identifier, password } // identifier = username or email
```

### Transactions
```javascript
// Add Income
POST /add-income
Body: { username, password, amount, source }

// Add Expense
POST /add-transaction
Body: { username, password, amount, category }

// Add Loan Taken
POST /add-loanTaken
Body: { username, password, amount, lender }

// Add Loan Repayment
POST /add-loanRepayment
Body: { username, password, amount, lender, is_paid_on_time }

// Get All Transactions
POST /get-user-data
Body: { username, password }
```

---

## 🎯 Testing the Application

### Test Scenario 1: New User Flow
1. Sign up with test credentials
2. Add first income ($1000)
3. Watch the pie chart fill up completely
4. Add expense ($300)
5. Watch the pie chart get "eaten"
6. Check transaction history

### Test Scenario 2: Loan Management
1. Record a loan taken ($5000)
2. See income increase
3. Add repayment ($500)
4. Mark as paid on time
5. View in transaction history

### Test Scenario 3: Animation Testing
1. Add multiple incomes quickly
2. Watch ball-eating animations
3. Add expenses
4. Observe pie chart reduction
5. Check smooth transitions

---

## 🐛 Common Issues & Solutions

**Issue:** "Cannot connect to MongoDB"
**Solution:** Start MongoDB service: `net start MongoDB` or `mongod`

**Issue:** "Port 5000 already in use"
**Solution:** Change port in `backend/main.py`: `app.run(debug=True, port=5001)`

**Issue:** "CORS error in browser"
**Solution:** Ensure flask-cors is installed: `pip install flask-cors`

**Issue:** "Module not found" in frontend
**Solution:** Run `yarn install` in frontend directory

**Issue:** Animation not smooth
**Solution:** Use a modern browser (Chrome, Firefox, Edge)

---

## 📈 Future Enhancements (Ideas)

- 🎯 Set budget goals
- 📊 Advanced analytics and charts
- 🔔 Payment reminders
- 💾 Export data to CSV/PDF
- 📱 Progressive Web App (PWA)
- 🌙 Dark mode
- 🌍 Multi-currency support
- 👥 Family/group accounts

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review SETUP.md
3. Check console logs for errors
4. Verify MongoDB is running
5. Ensure both servers are active

---

**Happy Financial Tracking! 🎉💰**
