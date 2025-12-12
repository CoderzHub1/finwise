# Expense Splitter Feature - Implementation Guide

## Overview
The Expense Splitter feature allows users to add friends and split expenses with them. This document explains how the feature works and how to use it.

## Features Implemented

### 1. Friend Management System

#### Backend Endpoints (Flask)

**Send Friend Request**
- **Endpoint**: `POST /send-friend-request`
- **Body**: `{ username, password, recipient_username }`
- **Description**: Sends a friend request to another user
- **Validations**: 
  - Cannot send request to yourself
  - Cannot send duplicate requests
  - Checks if already friends

**Get Friend Requests**
- **Endpoint**: `POST /get-friend-requests`
- **Body**: `{ username, password }`
- **Returns**: Both received and sent friend requests
- **Description**: Retrieves all pending friend requests

**Respond to Friend Request**
- **Endpoint**: `POST /respond-friend-request`
- **Body**: `{ username, password, sender_username, action }`
- **Actions**: `approve` or `decline`
- **Description**: Approve or decline a friend request
- **On Approve**: Both users are added to each other's friends list

**Get Friends**
- **Endpoint**: `POST /get-friends`
- **Body**: `{ username, password }`
- **Returns**: List of all friends
- **Description**: Retrieves user's friends list

**Remove Friend**
- **Endpoint**: `POST /remove-friend`
- **Body**: `{ username, password, friend_username }`
- **Description**: Removes a friend from both users' lists

### 2. Expense Splitting System

#### Backend Endpoints (Flask)

**Create Split Expense**
- **Endpoint**: `POST /create-split-expense`
- **Body**: `{ username, password, amount, description, split_with[] }`
- **Description**: Creates a new expense split among friends
- **Calculation**: Amount is divided equally among all participants (creator + selected friends)
- **Example**: $1000 split among 4 people = $250 per person

**Get Split Expenses**
- **Endpoint**: `POST /get-split-expenses`
- **Body**: `{ username, password }`
- **Returns**:
  - `created_expenses`: Expenses created by user
  - `involved_expenses`: Expenses user is part of
  - `you_owe`: Summary of amounts user owes
  - `owed_to_you`: Summary of amounts owed to user
- **Description**: Retrieves all split expenses and balance summary

**Settle Expense**
- **Endpoint**: `POST /settle-expense`
- **Body**: `{ username, password, expense_id }`
- **Description**: Marks an expense as settled
- **Permission**: Only the expense creator can settle

### 3. Database Collections

**userInfo Collection - New Fields**
```javascript
{
  friends: ["username1", "username2"],  // Array of friend usernames
  // ... existing fields
}
```

**friendRequests Collection**
```javascript
{
  sender: "username1",
  recipient: "username2",
  status: "pending|approved|declined",
  dateCreated: "2025-11-02",
  timeCreated: "10:30:00"
}
```

**splitExpenses Collection**
```javascript
{
  expense_id: 1,
  created_by: "username1",
  amount: 1000.0,
  description: "Dinner at restaurant",
  split_with: ["username2", "username3"],
  total_people: 3,
  amount_per_person: 333.33,
  balances: {
    "username2": 333.33,
    "username3": 333.33
  },
  settled: false,
  dateCreated: "2025-11-02",
  timeCreated: "20:30:00",
  dateSettled: "2025-11-03"  // Only if settled
}
```

## Frontend Implementation

### Split Expenses Page (`/split-expenses`)

The page has two main tabs:

#### **Friends Tab**
- **Add Friend**: Search and send friend requests by username
- **Splitting Requests**: View and respond to incoming friend requests (approve/decline)
- **Sent Requests**: View pending friend requests you've sent
- **Friends List**: View all friends with option to remove

#### **Expenses Tab**
- **Balance Summary**: 
  - Shows total amounts you owe to each friend
  - Shows total amounts each friend owes you
  - Color-coded for easy understanding (red for owe, green for owed)
- **Create Split Expense**:
  - Enter amount and description
  - Select friends to split with
  - Preview showing per-person amount
  - Creates expense equally split among all participants
- **Expenses You Created**:
  - View all expenses you've created
  - See who owes you money
  - Mark expenses as settled
- **Expenses You're Part Of**:
  - View expenses others created that include you
  - See how much you owe
  - Settled expenses are grayed out

### User Experience Flow

1. **Adding Friends**:
   ```
   User A → Sends request to User B
   User B → Sees "Splitting Request" from User A
   User B → Approves request
   Both users → Now friends and can split expenses
   ```

2. **Creating Split Expense**:
   ```
   User A → Creates expense of $1000
   User A → Selects User B and User C to split
   System → Calculates $333.33 per person (3 total)
   User B & C → See they owe $333.33 to User A
   User A → Sees $666.66 owed (from 2 friends)
   ```

3. **Settling Expense**:
   ```
   Friends pay back User A
   User A → Marks expense as settled
   Expense → Removed from active balances
   ```

## Styling

- **Color Scheme**: Purple gradient matching FinWise theme
- **Responsive Design**: Works on mobile and desktop
- **Animations**: Smooth transitions and hover effects
- **Visual Feedback**: 
  - Green for positive actions (approve, owed to you)
  - Red for negative actions (decline, you owe)
  - Gray for settled/completed items

## Testing the Feature

1. **Test Friend Requests**:
   - Create two test accounts
   - Send friend request from one to another
   - Accept request
   - Verify both appear in each other's friends list

2. **Test Expense Splitting**:
   - Create an expense with multiple friends
   - Verify calculations are correct
   - Check balance summary updates
   - Mark as settled and verify it updates

3. **Edge Cases Handled**:
   - Cannot send friend request to yourself
   - Cannot send duplicate requests
   - Cannot split with non-friends
   - Only creator can settle expenses
   - Proper error messages for all scenarios

## Future Enhancements

Possible future additions:
- Partial settlements (settle with individual friends)
- Unequal splits (custom amounts per person)
- Expense categories
- Payment reminders
- Transaction history/receipts
- Export to CSV
- Push notifications for new requests
- Split by percentage instead of equal parts
- Multi-currency support

## API Error Handling

All endpoints return appropriate error messages:
- `400`: Bad request (missing fields, invalid data)
- `401`: Authentication failed
- `403`: Forbidden (insufficient permissions)
- `404`: Resource not found
- `500`: Server error

## Security

- All endpoints require authentication (username + password)
- Password verification using bcrypt
- Users can only access their own data
- Only expense creators can settle expenses
- Friend relationships are bidirectional and atomic
