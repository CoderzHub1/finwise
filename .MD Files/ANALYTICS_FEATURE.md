# Analytics Tracker Feature - Documentation

## Overview
The Analytics Tracker provides comprehensive financial insights by analyzing income sources, expense categories, and loan activities across different time periods. Users can view detailed breakdowns with visual representations and percentage calculations.

## Features

### 1. **Multi-Timeframe Analysis**
Select from 5 different time periods:
- **1 Week** - Last 7 days
- **1 Month** - Last 30 days
- **3 Months** - Last 90 days
- **6 Months** - Last 180 days
- **1 Year** - Last 365 days

### 2. **Income Analysis**
- **By Source**: Shows all income sources (salary, freelance, investment, etc.)
- **Visual Progress Bars**: Color-coded green bars showing contribution percentage
- **Total Income**: Sum of all income for the selected period
- **Percentage Breakdown**: Each source shows its percentage of total income

### 3. **Expense Analysis**
- **By Category**: Groups expenses by categories (Food, Transportation, etc.)
- **Visual Progress Bars**: Color-coded red bars showing spending distribution
- **Total Expenses**: Sum of all expenses for the selected period
- **Percentage Breakdown**: Each category shows its percentage of total expenses

### 4. **Loan Tracking**
- **Loans Taken**: Shows borrowed amounts by lender
- **Loan Repayments**: Tracks repayment amounts by lender
- **Visual Breakdown**: Color-coded bars for both sections
- **Total Calculations**: Separate totals for loans taken and repayments

### 5. **Summary Dashboard**
Three key metrics displayed prominently:
- **Total Income** (Green card)
- **Total Expenses** (Red card)
- **Net Balance** (Blue card, color changes based on positive/negative)

### 6. **Interactive Tabs**
Switch between three analysis views:
- Income Sources
- Expense Categories
- Loans

## Backend API

### Endpoint: `POST /get-analytics`

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "time_frame": "1month"  // Options: 1week, 1month, 3months, 6months, 1year
}
```

**Response (200):**
```json
{
  "time_frame": "1month",
  "start_date": "2025-10-02",
  "end_date": "2025-11-02",
  "income": {
    "by_source": {
      "Salary": 5000.00,
      "Freelance": 1200.00,
      "Investment": 300.00
    },
    "total": 6500.00
  },
  "expenses": {
    "by_category": {
      "Food & Dining": 800.00,
      "Transportation": 300.00,
      "Shopping": 450.00,
      "Bills & Utilities": 600.00
    },
    "total": 2150.00
  },
  "loans": {
    "taken": {
      "by_lender": {
        "Bank": 5000.00,
        "Friend": 500.00
      },
      "total": 5500.00
    },
    "repayments": {
      "by_lender": {
        "Bank": 500.00,
        "Friend": 200.00
      },
      "total": 700.00
    }
  },
  "net_balance": 4350.00
}
```

**Error Responses:**
- `400`: Missing username or password
- `401`: Invalid password
- `404`: User not found

## Frontend Components

### Component: `components/AnalyticsTracker.js`

**State Management:**
- `timeFrame`: Current selected time period
- `analyticsData`: Fetched analytics data from backend
- `loading`: Loading state for data fetching
- `error`: Error message display
- `activeTab`: Currently active tab (income/expenses/loans)

**Key Functions:**
- `fetchAnalytics()`: Fetches data from backend based on selected time frame
- `calculatePercentage(amount, total)`: Calculates percentage with 1 decimal
- `formatCurrency(amount)`: Formats numbers as USD currency
- `renderIncomeBreakdown()`: Renders income analysis view
- `renderExpenseBreakdown()`: Renders expense analysis view
- `renderLoansBreakdown()`: Renders loan analysis view

### Styles: `styles/Analytics.module.css`

**Key Features:**
- Responsive grid layout for summary cards
- Smooth animations and transitions
- Color-coded progress bars
- Mobile-friendly design
- Tab-based navigation
- Loading states with spinner

## Integration

### Dashboard Integration
The Analytics Tracker is embedded in the main dashboard:
- File: `pages/dashboard.js`
- Added as a new section below transaction history
- Automatically refreshes when time frame changes
- Uses authenticated user context

### Dynamic Categories
The expense breakdown automatically pulls categories from user's limit settings, ensuring consistency with the My Account page.

## Usage Flow

1. **Access Analytics**
   - Navigate to Dashboard
   - Scroll to Analytics section

2. **Select Time Frame**
   - Use dropdown to select period
   - Data automatically refreshes
   - Date range displayed below selector

3. **View Summary Cards**
   - Quick overview of totals
   - Net balance calculation
   - Color-coded indicators

4. **Explore Detailed Breakdowns**
   - Click tabs to switch views
   - Hover over items for better visibility
   - Visual bars show proportions

5. **Analyze Data**
   - Compare income sources
   - Identify top expense categories
   - Track loan activities
   - Monitor spending patterns

## Calculations

### Net Balance Formula
```
Net Balance = Total Income - Total Expenses - Total Loan Repayments + Total Loans Taken
```

### Percentage Calculation
```
Percentage = (Item Amount / Category Total) × 100
```

### Date Filtering
- All transactions filtered by `dateEntered` field
- Inclusive range: start_date ≤ transaction_date ≤ end_date
- Invalid dates are skipped silently

## Visual Design

### Color Scheme
- **Income**: Green gradient (#10b981 to #059669)
- **Expenses**: Red gradient (#ef4444 to #dc2626)
- **Loans Taken**: Orange gradient (#f59e0b to #d97706)
- **Loan Repayments**: Purple gradient (#8b5cf6 to #7c3aed)

### Progress Bars
- Width represents percentage of total
- Smooth animation on data load
- Rounded corners with shadow
- Hover effects for interactivity

## Performance Considerations

- Data fetching optimized with useEffect dependency array
- Loading states prevent multiple concurrent requests
- Animations use CSS transitions (GPU-accelerated)
- Responsive design reduces layout shifts

## Testing

### Backend Tests
Run the comprehensive test suite:
```bash
cd backend
python test_analytics.py
```

**Test Coverage:**
- All time frame options (5 tests)
- Invalid credentials (401 error)
- Missing parameters (400 error)
- Data accuracy verification
- Empty data handling

**Prerequisites:**
- Backend running on `localhost:5000`
- Valid test user with transaction data
- Update credentials in test file

### Manual Testing Checklist
- [ ] Time frame selector changes data
- [ ] All tabs display correctly
- [ ] Empty states show appropriate messages
- [ ] Currency formatting is correct
- [ ] Percentages add up to 100%
- [ ] Net balance calculation is accurate
- [ ] Loading states display properly
- [ ] Error messages are clear
- [ ] Mobile responsive on small screens
- [ ] Animations are smooth

## Security

- All endpoints require authentication
- Password validation using bcrypt
- User data isolation (per-user collections)
- No sensitive data exposure in errors
- Input validation on time_frame parameter

## Future Enhancements

1. **Advanced Features**
   - Custom date range picker
   - Export data to CSV/PDF
   - Comparison mode (period vs period)
   - Budget vs actual analysis

2. **Visualizations**
   - Pie charts for distribution
   - Line graphs for trends over time
   - Stacked bar charts for multi-category view
   - Heatmap for daily spending patterns

3. **Insights**
   - AI-powered spending recommendations
   - Anomaly detection (unusual expenses)
   - Spending predictions
   - Goal tracking integration

4. **Social Features**
   - Compare with anonymous averages
   - Share achievements
   - Financial challenges

## Troubleshooting

### Issue: No data showing
**Solution:** 
- Verify transactions exist in selected time period
- Check date format in database (YYYY-MM-DD)
- Confirm user authentication

### Issue: Incorrect totals
**Solution:**
- Verify transaction types are correct (income/debit/loanTaken/loanRepayment)
- Check for data type issues (amounts as strings vs numbers)
- Review date filtering logic

### Issue: Slow loading
**Solution:**
- Check database connection speed
- Consider adding indexes on dateEntered field
- Optimize transaction count in database

### Issue: Categories not showing
**Solution:**
- Ensure user has category limits set
- Verify transactions have valid category/source fields
- Check for typos in category names

## API Rate Limiting
Currently no rate limiting implemented. Consider adding for production:
- Max requests per minute per user
- Caching for frequently accessed time frames
- Debouncing on time frame selector

## Browser Compatibility
Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility
- Semantic HTML structure
- Color contrast meets WCAG 2.1 AA standards
- Keyboard navigation support
- Screen reader friendly labels
- Focus indicators on interactive elements
