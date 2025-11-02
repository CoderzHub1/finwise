# Quick Start: NewsAPI Integration

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your API Key
Visit: https://newsapi.org/register
- Sign up (free)
- Copy your API key

### Step 2: Configure
```powershell
cd backend
Copy-Item .env.example .env
# Open .env and replace with your key:
# NEWSAPI_KEY=paste_your_key_here
```

### Step 3: Install & Run
```powershell
python -m pip install requests
python main.py
```

## 🎯 Test It Now

Open your browser or use PowerShell:

### Browser Test
```
http://localhost:5000/finance-news?page_size=3
http://localhost:5000/finance-headlines?page_size=3
```

### PowerShell Test
```powershell
# Get 5 finance tips articles
Invoke-RestMethod "http://localhost:5000/finance-news?page_size=5" | ConvertTo-Json

# Get 5 top headlines
Invoke-RestMethod "http://localhost:5000/finance-headlines?page_size=5" | ConvertTo-Json
```

## 📋 Quick Reference

### Endpoint 1: Finance News
```
GET /finance-news
Parameters:
  ?query=budgeting        (optional)
  ?sort_by=relevancy      (optional: relevancy/popularity/publishedAt)
  ?page_size=10           (optional: 1-100)
  ?from_date=2025-10-01   (optional: YYYY-MM-DD)
```

### Endpoint 2: Headlines
```
GET /finance-headlines
Parameters:
  ?country=us             (optional: us/gb/in/ca/au)
  ?page_size=10           (optional: 1-100)
```

## ✅ What You Get

Each article includes:
- Title
- Description
- URL (link to full article)
- Image URL
- Publication date
- Source name
- Author

## 🔧 Troubleshooting

**Error: Invalid API key**
- Check your .env file has the correct NEWSAPI_KEY
- Make sure no spaces around the = sign

**Error: No articles returned**
- Free tier = 100 requests/day
- Try a different search query
- Check date range isn't too old

**Error: Module not found**
```powershell
python -m pip install requests flask flask-cors
```

## 🎨 Integration Ideas

For your frontend:
1. Create a "Finance Tips" page
2. Fetch from `/finance-news`
3. Display articles as cards
4. Add "Read More" buttons linking to article URLs
5. Show article images and publication dates
6. Add pagination for more results

Example React/Next.js fetch:
```javascript
const res = await fetch('/api/finance-news?page_size=6');
const data = await res.json();
// Map data.articles to your UI components
```

## 📚 Full Documentation

See `NEWSAPI_IMPLEMENTATION.md` for complete details.
See `README.md` for all API endpoints.
