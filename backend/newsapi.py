import os
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()
NEWSAPI_KEY = os.environ.get("NEWSAPI_KEY")
NEWSAPI_BASE_URL = "https://newsapi.org/v2"


def get_finance_tips_articles(
    query: str = "finance tips OR personal finance OR money management OR budgeting OR saving money",
    language: str = "en",
    sort_by: str = "publishedAt",
    page_size: int = 10,
    page: int = 1,
    from_date: Optional[str] = None
) -> Dict:
    """
    Fetch articles related to finance tips from NewsAPI.
    
    Args:
        query: Search query for finance-related topics
        language: Language code (default: 'en')
        sort_by: Sort order - 'relevancy', 'popularity', or 'publishedAt'
        page_size: Number of articles to return (max 100)
        page: Page number for pagination
        from_date: Fetch articles from this date (YYYY-MM-DD format). If None, defaults to last 7 days.
    
    Returns:
        Dictionary containing:
        - status: 'ok' or 'error'
        - totalResults: Total number of results
        - articles: List of article objects
        - error: Error message if status is 'error'
    
    Article object structure:
        - source: {id, name}
        - author: Article author
        - title: Article title
        - description: Article description
        - url: Article URL
        - urlToImage: Image URL
        - publishedAt: Publication date
        - content: Article content snippet
    """
    
    # Default to last 7 days if no from_date provided
    if from_date is None:
        from_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
    
    # Use the /everything endpoint for more comprehensive results
    endpoint = f"{NEWSAPI_BASE_URL}/everything"
    
    params = {
        "q": query,
        "language": language,
        "sortBy": sort_by,
        "pageSize": min(page_size, 100),  # Max 100 per request
        "page": page,
        "from": from_date,
        "apiKey": NEWSAPI_KEY
    }
    
    try:
        response = requests.get(endpoint, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Check if the API returned an error
        if data.get("status") == "error":
            return {
                "status": "error",
                "error": data.get("message", "Unknown error from NewsAPI"),
                "articles": []
            }
        
        return {
            "status": "ok",
            "totalResults": data.get("totalResults", 0),
            "articles": data.get("articles", []),
            "query": query,
            "from_date": from_date
        }
        
    except requests.exceptions.RequestException as e:
        return {
            "status": "error",
            "error": f"Request failed: {str(e)}",
            "articles": []
        }
    except Exception as e:
        return {
            "status": "error",
            "error": f"Unexpected error: {str(e)}",
            "articles": []
        }


def get_top_finance_headlines(
    country: str = "us",
    category: str = "business",
    page_size: int = 10,
    page: int = 1
) -> Dict:
    """
    Fetch top finance/business headlines from a specific country.
    
    Args:
        country: 2-letter country code (e.g., 'us', 'gb', 'in')
        category: Category - 'business', 'general', 'technology', etc.
        page_size: Number of articles to return (max 100)
        page: Page number for pagination
    
    Returns:
        Dictionary containing status, totalResults, and articles list
    """
    
    endpoint = f"{NEWSAPI_BASE_URL}/top-headlines"
    
    params = {
        "country": country,
        "category": category,
        "pageSize": min(page_size, 100),
        "page": page,
        "apiKey": NEWSAPI_KEY
    }
    
    try:
        response = requests.get(endpoint, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get("status") == "error":
            return {
                "status": "error",
                "error": data.get("message", "Unknown error from NewsAPI"),
                "articles": []
            }
        
        return {
            "status": "ok",
            "totalResults": data.get("totalResults", 0),
            "articles": data.get("articles", [])
        }
        
    except requests.exceptions.RequestException as e:
        return {
            "status": "error",
            "error": f"Request failed: {str(e)}",
            "articles": []
        }
    except Exception as e:
        return {
            "status": "error",
            "error": f"Unexpected error: {str(e)}",
            "articles": []
        }


def format_articles_for_display(articles: List[Dict]) -> List[Dict]:
    """
    Format articles for cleaner display, removing null values and selecting key fields.
    
    Args:
        articles: List of article dictionaries from NewsAPI
    
    Returns:
        List of formatted article dictionaries with essential fields
    """
    formatted = []
    
    for article in articles:
        formatted_article = {
            "title": article.get("title", "No title"),
            "description": article.get("description", "No description available"),
            "url": article.get("url", ""),
            "urlToImage": article.get("urlToImage"),
            "publishedAt": article.get("publishedAt", ""),
            "source": article.get("source", {}).get("name", "Unknown source"),
            "author": article.get("author")
        }
        # Remove None values
        formatted_article = {k: v for k, v in formatted_article.items() if v is not None}
        formatted.append(formatted_article)
    
    return formatted
