from google import genai
from pydantic import BaseModel
from datetime import datetime, timedelta

finance_topics = [
        "Corporate finance and capital structure",
        "Investment analysis and portfolio management",
        "Personal finance and financial literacy",
        "Public finance and government expenditure",
        "Banking and financial intermediation",
        "Financial markets and institutions",
        "Risk management and insurance",
        "Derivatives and options",
        "Treasury management",
        "Cash flow management",
        "Credit risk assessment and management",
        "Mutual funds and investment funds",
        "Mergers and acquisitions",
        "Financial technology (Fintech)",
        "Blockchain and cryptocurrencies",
        "Financial regulation and compliance",
        "Valuation of securities and companies",
        "Behavioral finance",
        "ESG and sustainable finance",
        "International finance and foreign exchange",
        "Financial econometrics and modeling",
        "Budgeting and financial planning",
        "Working capital management",
        "Taxation and tax planning",
        "Real estate finance",
        "Microfinance and financial inclusion",
        "Wealth management",
        "Financial statement analysis and reporting",
        "Dividend policy and payout strategies",
        "Green bonds and impact investing"
    ]

api_key = "AIzaSyClEm8RcB3p1wi3ExLwx6i_FJWw1guI8v8"

client = genai.Client(api_key=api_key)

class FinancialSuggestion(BaseModel):
    praise: str
    suggestions: str

def get_gemini_suggestions(user_data):
    """
    Generate financial suggestions based on user transaction data.
    
    Args:
        user_data: List of transaction records from MongoDB
    
    Returns:
        dict with 'praise' and 'suggestions' keys
    """
    # Calculate date one month ago
    one_month_ago = datetime.now() - timedelta(days=30)
    
    # Format the transaction data for the prompt
    recent_transactions = []
    all_transactions = []
    
    for transaction in user_data:
        date_str = transaction.get('dateEntered', '')
        try:
            trans_date = datetime.strptime(date_str, '%Y-%m-%d')
            if trans_date >= one_month_ago:
                recent_transactions.append(transaction)
        except:
            pass
        all_transactions.append(transaction)
    
    # Create a summary of the data
    prompt = f"""You are a financial expert looking at the transactional records of a person. 
    
Here are their recent transactions (last 30 days):
{recent_transactions}

Here are all their transactions for context:
{all_transactions}

Please analyze these records and provide:
1. Praise for their good financial habits
2. Positive constructive suggestions on what they could improve

Focus more on the recent transactions (from the last month). Be encouraging and positive in your tone.
Keep your response between 150-200 words total."""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": FinancialSuggestion,
        },
    )
    
    return response.parsed

def get_keywords(post):
    """
    Generate financial keywords for content filtering.
    
    Args:
        post: Post content (string)
    
    Returns:
        List of keywords selected from predefined finance topics
    """
    
    # Predefined financial topics
    
    prompt = f"""Analyze this financial community post and identify which of the following financial topics are most relevant to it.

Post content:
{post}

Available financial topics (choose ONLY from these):
{', '.join(finance_topics)}

Select 3-7 topics from the list above that best match the content of this post. Return ONLY topics from the provided list that are relevant. If the post covers multiple areas, include all relevant topics."""

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": list[str],
        },
    )
    
    return response.parsed