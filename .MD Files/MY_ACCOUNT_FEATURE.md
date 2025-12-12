# My Account Feature - Documentation

## Overview
The My Account page allows users to manage their spending categories and limits. Users can view, edit, add, and delete spending categories with customizable percentage limits.

## Features

### 1. View Spending Limits
- Display all spending categories with their percentage limits
- Visual progress bars showing the limit allocation
- Color-coded bars (green/orange/red based on percentage)
- Total allocation calculation with warnings if over 100%

### 2. Edit Limits
- Toggle edit mode to modify existing category limits
- Real-time input validation (0-100%)
- Visual feedback during editing
- Save/Cancel functionality

### 3. Add New Categories
- Create custom spending categories
- Set initial limit percentage
- Duplicate category prevention
- Form validation

### 4. Delete Categories
- Remove unwanted categories
- Confirmation dialog before deletion
- Updates all limits automatically

### 5. Smart Insights
- Total allocation tracking
- Warning when exceeds 100%
- Shows unallocated percentage
- Helpful tips and information

## Backend API Endpoints

### 1. Get User Limits
**Endpoint:** `POST /get-user-limits`

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "limits": {
    "Food & Dining": 10,
    "Transportation": 5,
    "Shopping": 5,
    ...
  }
}
```

### 2. Update User Limits
**Endpoint:** `POST /update-user-limits`

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "limits": {
    "Food & Dining": 12,
    "Transportation": 6,
    ...
  }
}
```

**Response (200):**
```json
{
  "msg": "Limits updated successfully"
}
```

### 3. Add Category
**Endpoint:** `POST /add-category`

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "category_name": "Investments",
  "limit_percentage": 15
}
```

**Response (201):**
```json
{
  "msg": "Category added successfully",
  "category": "Investments",
  "limit": 15,
  "all_limits": { ... }
}
```

**Error (400):**
```json
{
  "error": "Category already exists"
}
```

### 4. Delete Category
**Endpoint:** `POST /delete-category`

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "category_name": "Investments"
}
```

**Response (200):**
```json
{
  "msg": "Category deleted successfully",
  "deleted_category": "Investments",
  "all_limits": { ... }
}
```

**Error (404):**
```json
{
  "error": "Category does not exist"
}
```

## Frontend Components

### Page: `pages/myAccount.js`
Main page component with the following state management:
- `limits`: Current user limits from database
- `editMode`: Toggle between view and edit mode
- `editedLimits`: Temporary storage for edited values
- `newCategoryName` & `newCategoryLimit`: Form state for adding categories
- `message`: Success/error message display
- `showAddCategory`: Toggle add category form

### Styles: `styles/MyAccount.module.css`
Comprehensive styling including:
- Responsive design (mobile-friendly)
- Smooth animations and transitions
- Color-coded visual feedback
- Loading states
- Error/success messages

## Integration

### Navigation
The My Account page has been added to the main navigation bar:
- File: `components/Navbar.js`
- Added "My Account" link
- Accessible from all authenticated pages

### Default Categories
When a new user signs up, default categories are created:
```javascript
{
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
```

## Testing

Run the test suite to verify backend endpoints:
```bash
cd backend
python test_account_endpoints.py
```

**Prerequisites:**
- Backend server running on `localhost:5000`
- Valid test user credentials in the database
- Update the test file with actual username/password

## Usage Flow

1. **User navigates to My Account page**
   - Click "My Account" in navigation bar
   - Page loads current limits from database

2. **View current limits**
   - See all categories with visual bars
   - Check total allocation percentage
   - Get warnings if over 100%

3. **Edit existing limits**
   - Click "Edit Limits" button
   - Modify values using number inputs
   - Click "Save Changes" or "Cancel"

4. **Add new category**
   - In edit mode, click "+ Add Category"
   - Enter category name and limit
   - Click "Add" button
   - Category appears in the list

5. **Delete category**
   - In edit mode, click "✕" button on category
   - Confirm deletion in dialog
   - Category removed from list

## Security Considerations

- All endpoints require username and password authentication
- Passwords are validated using bcrypt
- No direct database ID exposure
- Input validation on both frontend and backend
- XSS prevention through React's built-in sanitization

## Future Enhancements

Potential improvements:
1. Category icons/emojis
2. Spending history per category
3. Budget recommendations based on spending patterns
4. Category templates (predefined sets)
5. Import/export category configurations
6. Monthly vs. yearly limit toggles
7. Sub-categories support
8. Spending trends visualization per category

## Troubleshooting

### Issue: Cannot load limits
**Solution:** Verify backend is running and user is authenticated

### Issue: Total exceeds 100%
**Solution:** This is a warning, not an error. Adjust limits to sum to ≤100%

### Issue: Cannot add duplicate category
**Solution:** This is intentional. Delete the existing category first or use a different name

### Issue: Changes not saving
**Solution:** Check console for errors. Verify password is correct and backend is accessible
