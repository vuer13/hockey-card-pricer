import requests
import base64
import os
from dotenv import load_dotenv
import numpy as np

load_dotenv()

def get_ebay_token():
    """Authenticates with eBay and returns an OAuth access token to browse their API"""

    client_id = os.getenv("EBAY_CLIENT_ID")
    client_secret = os.getenv("EBAY_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise ValueError("Missing EBAY_CLIENT_ID or EBAY_CLIENT_SECRET in .env")

    # Encode client_id:client_secret in base64
    auth = base64.b64encode(
        f"{client_id}:{client_secret}".encode()
    ).decode()

    # Request headers
    headers = {
        "Authorization": f"Basic {auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }

    # OAuth request body
    data = {
        "grant_type": "client_credentials",
        "scope": "https://api.ebay.com/oauth/api_scope"
    }

    # Request access token
    response = requests.post(
        "https://api.ebay.com/identity/v1/oauth2/token",
        headers=headers,
        data=data
    )

    response.raise_for_status()

    return response.json()["access_token"]

def get_sold_prices(query, limit=25):
    """eBay sold listings search active; Returns a list of sale prices"""
    
    token = get_ebay_token()
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US" 
    }

    params = {
        "q": query,
        "limit": limit,
        "sort": "price" # Sort by price (lowest first helps find the 'floor')
    }

    # Browse API
    url = "https://api.ebay.com/buy/browse/v1/item_summary/search"
    
    response = requests.get(url, headers=headers, params=params)
    
    # Handle API errors
    if response.status_code != 200:
        print(f"API Error: {response.status_code} - {response.text}")
        return []

    data = response.json()
    prices = []

    if "itemSummaries" in data:
        for item in data["itemSummaries"]:
            # Extract price value
            price_obj = item.get("price", {})
            price = price_obj.get("value")
            if price:
                prices.append(float(price))
                            
    return prices


def estimate_price(prices):
    """Removes outliers using IQR and returns a robust price estimate using median"""

    # Return none if no prices
    if not prices:
        print("No prices found")
        return None
    
    prices = np.array(prices)
    
    if len(prices) < 3:
        return {
            "estimate": round(float(np.median(filtered)), 2),
            "low": round(float(np.percentile(filtered, 25)), 2),
            "high": round(float(np.percentile(filtered, 75)), 2),
            "num_sales": int(len(filtered))
        }

    # Compute interquartile range (IQR)
    q1, q3 = np.percentile(prices, [25, 75])
    iqr = q3 - q1

    # Remove outliers using IQR formula
    filtered = prices[
        (prices >= q1 - 1.5 * iqr) &
        (prices <= q3 + 1.5 * iqr)
    ]
    
    if len(filtered) == 0:
        return None

    # Pricing summary
    return {
        "estimate": round(float(np.median(filtered)), 2),
        "low": round(float(np.percentile(filtered, 25)), 2),
        "high": round(float(np.percentile(filtered, 75)), 2),
        "num_sales": int(len(filtered))
    }

def price_card(fields):
    """Takes confirmed card fields and returns a market estimate"""

    terms = [
        fields.get('card_series'),
        fields.get('name'),
        fields.get('card_number'),
        f"Card {fields.get('card_type')}" if fields.get('card_type') else ""
    ]
    
    query = " ".join([t for t in terms if t]).strip()
    print(f"Searching eBay")
    
    prices = get_sold_prices(query)
    
    if not prices:
        return {"query": query, "error": "No sales data found"}
        
    pricing = estimate_price(prices)

    return {
        "query": query,
        "pricing": pricing
    }
    
def test():
    test_card = {
        "card_series": "2018-19",
        "name": "Ryan Suter Trilogy Hockey",
        "card_number": "24"
    }
    
    result = price_card(test_card)
    print(result)