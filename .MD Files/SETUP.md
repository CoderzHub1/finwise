# FinWise - Setup Instructions

A gamified financial tracking application built with Flask (Backend) and Next.js (Frontend).

## Features

✅ **Income Tracking** - Track all your income sources
✅ **Expense Tracking** - Categorize and monitor expenses
✅ **Loans & Credit Tracking** - Manage loans taken and repayments
✅ **Gamified Interface** - Animated Pac-Man style pie chart that:
  - Fills up when income is added
  - Gets eaten when expenses are added
  - Shows Pac-Man eating balls animation when new income arrives

## Prerequisites

- Python 3.7+
- Node.js 14+
- MongoDB (running on localhost:27017)
- Yarn package manager

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Ensure MongoDB is running on localhost:27017

4. Start the Flask server:
```bash
python main.py
```

The backend will run on `http://localhost:5000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies with yarn:
```bash
yarn install
```

3. Start the development server:
```bash
yarn dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Sign Up**: Create a new account at `/signup`
2. **Login**: Sign in with your credentials at `/login`
3. **Dashboard**: Access your financial dashboard at `/dashboard`

### Dashboard Features

- **Gamified Pie Chart**: Visual representation of your financial health
  - Yellow/orange pie chart shows remaining balance percentage
  - When you add income, watch the Pac-Man eat green balls
  - When you add expenses, the pie chart gets "eaten"
  
- **Income Form**: Add income with source information
- **Expense Form**: Track expenses with categories
- **Loan Form**: Manage loans (taken/repayment) with lender details
- **Transaction History**: Filter and view all transactions

## API Endpoints

### User Management
- `POST /add-user` - Register new user
- `POST /signin` - User authentication

### Transactions
- `POST /add-income` - Add income entry
- `POST /add-transaction` - Add expense entry
- `POST /add-loanTaken` - Record loan taken
- `POST /add-loanRepayment` - Record loan repayment
- `POST /get-user-data` - Fetch all user transactions

## Technologies Used

### Backend
- Flask - Web framework
- Flask-CORS - Cross-origin resource sharing
- PyMongo - MongoDB driver
- bcrypt - Password hashing

### Frontend
- Next.js - React framework
- Axios - HTTP client
- Framer Motion - Animations
- HTML5 Canvas - Chart rendering
- CSS Modules - Styling

## Project Structure

```
finwise/
├── backend/
│   ├── main.py           # Flask application
│   ├── mongodb.py        # Database connection
│   └── requirements.txt  # Python dependencies
│
└── frontend/
    ├── components/       # React components
    │   ├── GamifiedPieChart.js
    │   ├── IncomeForm.js
    │   ├── ExpenseForm.js
    │   ├── LoanForm.js
    │   └── TransactionHistory.js
    ├── context/
    │   └── AuthContext.js # Authentication context
    ├── pages/
    │   ├── index.js      # Home page
    │   ├── login.js      # Login page
    │   ├── signup.js     # Signup page
    │   └── dashboard.js  # Main dashboard
    └── styles/           # CSS modules
```

## Notes

- Make sure MongoDB is running before starting the backend
- The backend must be running on port 5000 for the frontend to connect
- User passwords are securely hashed with bcrypt
- All transactions are stored per user in separate MongoDB collections

## Troubleshooting

**MongoDB Connection Error**: Ensure MongoDB is installed and running on `mongodb://localhost:27017`

**CORS Error**: Make sure flask-cors is installed and the backend is running

**Port Already in Use**: Change the port in main.py or next.config.mjs

---

Enjoy tracking your finances with style! 🎮💰
