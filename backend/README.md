# finwise — backend

This README documents the backend found in `d:\Code\Projects\finwise\backend`.
It explains how to install, run, and test the Flask API that uses MongoDB for storage and bcrypt for password hashing.

---

## Table of contents

- Overview
- Requirements
- Setup
- Running the server
- API endpoints (request/response + sample JSON)
- Testing examples (PowerShell + curl)
- Notes on security & migration
- Next steps

---

## Overview

This backend is a small Flask app that stores users and per-user collections in MongoDB. Passwords are hashed with bcrypt when a user is created and verified with bcrypt on signin and other protected operations.

Files of interest:
- `main.py` — Flask application with endpoints and the `authenticate_user` helper
- `mongodb.py` — returns a MongoDB database object using `MongoClient`
- `requirements.txt` — Python dependencies

---

## Requirements

- Python 3.8+
- MongoDB running and accessible (default connection used: `mongodb://localhost:27017`)
- A virtual environment (recommended)

Python packages (listed in `requirements.txt`):
- flask
- pymongo
- bcrypt

---

## Setup

1. Create and activate a virtual environment (optional but recommended):

PowerShell:

```powershell
python -m venv .venv
& .\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
python -m pip install -r .\requirements.txt
```

3. Ensure MongoDB is running locally or update `mongodb.py` to point to your MongoDB URI.

4. Set up NewsAPI key (for finance news features):

   - Get a free API key from [NewsAPI.org](https://newsapi.org/register)
   - Create a `.env` file in the backend directory (copy from `.env.example`):
   
   ```powershell
   Copy-Item .env.example .env
   ```
   
   - Edit `.env` and add your API key:
   
   ```
   NEWSAPI_KEY=your_actual_api_key_here
   ```
   
   - The app will automatically load the API key from the environment variable

---

## Running the server

Start the Flask app (development mode):

```powershell
python .\main.py
```

By default it will run on `http://127.0.0.1:5000`.

---

## API Endpoints

All endpoints accept and return JSON. Examples below assume the server is `http://localhost:5000`.

1) POST /add-user — Create a user

Request JSON (example):

```json
{
  "name": "test-name",
  "username": "testuser",
  "age": 18,
  "email": "lakshyaai@outlook.com",
  "password": "testpassword"
}
```

Success response (201/200-like JSON currently):

```json
{ "msg": "user inserted" }
```

If username/email already exists:

```json
{ "error": "User already exists" }
```

Notes:
- The server will hash the `password` using bcrypt before storing it in MongoDB.
- A new collection with the username is created for per-user transactions.


2) POST /signin — Sign in (new endpoint added)

Request JSON variants (all accepted):

A) using `identifier`:
```json
{ "identifier": "testuser", "password": "testpassword" }
```

B) using `username`:
```json
{ "username": "testuser", "password": "testpassword" }
```

C) using `email`:
```json
{ "email": "lakshyaai@outlook.com", "password": "testpassword" }
```

Success response (200):

```json
{
  "msg": "signin successful",
  "user": {
    "name": "test-name",
    "username": "testuser",
    "email": "lakshyaai@outlook.com",
    "age": 18
  }
}
```

Failure responses:
- Missing fields — HTTP 400
```json
{ "error": "identifier and password are required" }
```
- Wrong credentials — HTTP 401
```json
{ "error": "Invalid credentials" }
```

Notes:
- The endpoint uses the `authenticate_user` helper which checks the bcrypt hash stored in MongoDB.
- The `user` object in the response does not include the stored password or MongoDB `_id`.


3) POST /add-transaction

Request JSON (example):
```json
{
  "username": "testuser",
  "password": "testpassword",
  "amount": 25.5,
  "category": "groceries"
}
```

Success:
```json
{ "msg": "Transaction added successfully" }
```

Errors:
- Wrong password: `{ "error": "Password entered is incorrect" }`
- Username not found: `{ "error": "Username does not exist" }`


4) POST /add-income

Request JSON:
```json
{
  "username": "testuser",
  "password": "testpassword",
  "amount": 1000,
  "source": "salary"
}
```

Success:
```json
{ "msg": "Income added successfully" }
```


5) POST /add-loanTaken

Request JSON:
```json
{
  "username": "testuser",
  "password": "testpassword",
  "amount": 500,
  "lender": "Bob"
}
```

Success:
```json
{ "msg": "Loan taken added successfully" }
```


6) POST /add-loanRepayment

Request JSON:
```json
{
  "username": "testuser",
  "password": "testpassword",
  "amount": 100,
  "lender": "Bob",
  "is_paid_on_time": true
}
```

Success:
```json
{ "msg": "Loan repayment added successfully" }
```


7) POST /get-user-data

Request JSON:
```json
{
  "username": "testuser",
  "password": "testpassword"
}
```

Success: An array of documents from the per-user collection (no `_id` in queries currently requested for the per-user collection results):
```json
[
  { "dateEntered": "2025-11-01", "amount": 25.5, "type": "debit", "category": "groceries" },
  { "dateEntered": "2025-11-01", "amount": 1000, "type": "income", "source": "salary" }
]
```


8) POST /gemini-suggestions — Get AI-powered financial suggestions

Request JSON:
```json
{
  "username": "testuser",
  "password": "testpassword"
}
```

Success response (200):
```json
{
  "msg": "Suggestions generated successfully",
  "praise": "Great job managing your finances!",
  "suggestions": ["Consider creating an emergency fund", "Try to reduce dining out expenses"]
}
```

Errors:
- Wrong password: HTTP 401 `{ "error": "Password entered is incorrect" }`
- No transaction data: HTTP 404 `{ "error": "No transaction data available for analysis" }`


9) GET /finance-news — Get finance tips and news articles

Query parameters (all optional):
- `query` — Custom search query (default: "finance tips OR personal finance OR money management OR budgeting OR saving money")
- `sort_by` — Sort order: 'relevancy', 'popularity', or 'publishedAt' (default: publishedAt)
- `page_size` — Number of articles, max 100 (default: 10)
- `page` — Page number for pagination (default: 1)
- `from_date` — Fetch articles from date in YYYY-MM-DD format (default: last 7 days)

Example request:
```
GET http://localhost:5000/finance-news?page_size=5&sort_by=relevancy
```

Success response (200):
```json
{
  "status": "ok",
  "totalResults": 1234,
  "articles": [
    {
      "title": "10 Tips for Better Money Management",
      "description": "Learn how to manage your finances effectively...",
      "url": "https://example.com/article",
      "urlToImage": "https://example.com/image.jpg",
      "publishedAt": "2025-10-30T12:00:00Z",
      "source": "Financial Times",
      "author": "John Doe"
    }
  ],
  "query": "finance tips OR personal finance...",
  "from_date": "2025-10-25"
}
```

Errors:
- API error: HTTP 500 `{ "error": "Failed to fetch articles" }`


10) GET /finance-headlines — Get top finance/business headlines

Query parameters (all optional):
- `country` — 2-letter country code (default: 'us'). Examples: 'us', 'gb', 'in', 'ca'
- `page_size` — Number of articles, max 100 (default: 10)
- `page` — Page number for pagination (default: 1)

Example request:
```
GET http://localhost:5000/finance-headlines?country=us&page_size=5
```

Success response (200):
```json
{
  "status": "ok",
  "totalResults": 50,
  "articles": [
    {
      "title": "Stock Market Reaches New High",
      "description": "The stock market continued its upward trend...",
      "url": "https://example.com/headline",
      "urlToImage": "https://example.com/image.jpg",
      "publishedAt": "2025-11-01T08:00:00Z",
      "source": "Bloomberg",
      "author": "Jane Smith"
    }
  ]
}
```

---

## Testing examples

PowerShell `Invoke-RestMethod` examples (replace `localhost:5000` if different):

Create user:

```powershell
$body = @{
  name = 'test-name'
  username = 'testuser'
  age = 18
  email = 'lakshyaai@outlook.com'
  password = 'testpassword'
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://localhost:5000/add-user -Body $body -ContentType 'application/json'
```

Signin (identifier):

```powershell
$body = @{ identifier = 'testuser'; password = 'testpassword' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:5000/signin -Body $body -ContentType 'application/json'
```

Add transaction:

```powershell
$body = @{
  username = 'testuser'
  password = 'testpassword'
  amount = 25.5
  category = 'groceries'
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:5000/add-transaction -Body $body -ContentType 'application/json'
```

Curl examples (Linux/macOS or Windows with curl):

Create user:

```bash
curl -X POST http://localhost:5000/add-user \
  -H "Content-Type: application/json" \
  -d '{"name":"test-name","username":"testuser","age":18,"email":"lakshyaai@outlook.com","password":"testpassword"}'
```

Signin:

```bash
curl -X POST http://localhost:5000/signin \
  -H "Content-Type: application/json" \
  -d '{"identifier":"testuser","password":"testpassword"}'
```

---

## Notes on security & migration

- Password hashing: bcrypt is used to hash passwords on create and `bcrypt.checkpw` to verify.
- Existing users stored with plaintext passwords (if any) will fail authentication — you must migrate them.

Migration options:
1. Force password reset for existing users: mark accounts and require users to set new passwords.
2. If you can temporarily accept plaintext checking, you can detect whether the stored password appears to be a bcrypt hash (bcrypt hashes start with `$2b$` or `$2a$`) and if not, compare plaintext, and if it matches, re-hash the password with bcrypt and store the new hash. This approach is risky — use only over HTTPS and with logging.

Always run behind HTTPS in production.

---

## Next steps (suggested)

- Return a JSON Web Token (JWT) from `/signin` instead of sending user info; add token verification middleware for protected endpoints.
- Add unit tests for `authenticate_user` and the endpoints (pytest + test database fixture).
- Add environment variable support for MongoDB URI and Flask config (e.g., via `python-dotenv` or `os.environ`).
- Improve errors and HTTP status codes across endpoints (current responses are JSON but vary in status code usage).

---

## Quick troubleshooting

- If you get `ModuleNotFoundError: No module named 'pymongo'` or `bcrypt`, run:

```powershell
python -m pip install -r .\requirements.txt
```

- If MongoDB is not running, start it or update `mongodb.py` to point to your hosted MongoDB instance.

---

If you want, I can:
- Add JWT-based signin and example usage.
- Create a small test script that programmatically creates the example user you gave and runs the signin payloads and asserts responses.
- Add a lightweight API client collection for Postman or a small test harness using `requests`.

Pick one and I'll implement it next.
