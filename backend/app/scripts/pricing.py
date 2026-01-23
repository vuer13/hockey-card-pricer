import requests
import base64
import os
from dotenv import load_dotenv
import numpy as np
import re
import time
from functools import lru_cache
import logging

load_dotenv()

logger = logging.getLogger("pricing")
logging.basicConfig(level=logging.INFO)

MIN_SALES = 3
MAX_RETRIES = 3
BACKOFF_SECONDS = 1.5

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
        data=data,
        timeout=(3,8)
    )

    response.raise_for_status()

    return response.json()["access_token"]

def normalize_query(fields):
    """Build noise-free eBay search query from card fields"""
    
    # Year separately
    series = fields.get('card_series', '')
    year_match = re.search(r"\d{4}(-\d{2})?", series)
    year = year_match.group(0) if year_match else ""

    name = fields.get('name', '')
    card_number = fields.get('card_number', '')
    card_type = fields.get('card_type', 'Base')

    special_type = card_type if card_type and card_type != "Base" else ""

    parts = [
        year,
        name,
        card_number,
        special_type
    ]
    
    query = " ".join([p for p in parts if p]).strip()
    
    query = re.sub(r"[^a-zA-Z0-9\-\s]", "", query)
    
    logger.info("Generated query", extra={"query": query})
    return query

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
        "filter": "soldItems:true",
        "sort": "price" # Sort by price (lowest first helps find the 'floor')
    }

    # Browse API
    url = "https://api.ebay.com/buy/browse/v1/item_summary/search"
    
    for attempt in range(MAX_RETRIES):
        response = requests.get(url, headers=headers, params=params, timeout=(3,10))
    
        # Handle API errors
        if response.status_code == 200:        
            data = response.json()
            prices = []
            
            for item in data.get("itemSummaries", []):
                price_obj = item.get("price", {})
                price = price_obj.get("value")
                try:
                    prices.append(float(price))
                except (TypeError, ValueError):
                    continue
                            
            return prices
        
        time.sleep(BACKOFF_SECONDS * (attempt + 1))
        
    return []


def estimate_price(prices):
    """Removes outliers using IQR and returns a robust price estimate using median"""

    # Return none if no prices
    if not prices:
        print("No prices found")
        return None
    
    prices = np.array(prices)
    
    if len(prices) < MIN_SALES:
        return {
            "estimate": round(float(np.median(prices)), 2),
            "low": round(float(np.percentile(prices, 25)), 2),
            "high": round(float(np.percentile(prices, 75)), 2),
            "num_sales": int(len(prices)),
            "iqr": None
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
        "num_sales": int(len(filtered)),
        "iqr": round(float(iqr), 2)
    }

def compute_confidence(stats):
    """Computes a confidence score of sales data"""
    # Low reliability if few sales or wide price spread
    
    if not stats:
        return 0.0
    
    n = stats["num_sales"]
    median = stats["estimate"]
    iqr = stats["iqr"] if stats["iqr"] else 0 # How spread out middle 50% prices are, guard if iqr is None
    
    sample_score = min(1.0, n / 20) # More sales = higher confidence
    spread_ratio = iqr / median if median else 1.0 # How wide prices are relative to median
    spread_score = max(0.0, 1.0 - spread_ratio) # Less spread = higher confidence

    # Weighted: 60% sample size, 40% price spread
    return round(100 * (0.6 * sample_score + 0.4 * spread_score), 2)
    
def price_card(fields):
    """Takes confirmed card fields and returns a market estimate"""
    
    print(fields)
    query = normalize_query(fields)
    
    if not query:
        return {"query": None, "error": "Invalid query"}
    
    print(f"Searching eBay")
    result = cached_pricing(query)
    
    cache_info = cached_pricing.cache_info()
    
    logger.info(
        "pricing_cache",
        extra={
            "hits": cache_info.hits,
            "misses": cache_info.misses,
            "size": cache_info.currsize
        }
    )
    
    if not result:
        return {"query": query, "error": "Pricing empty"}
        
    return result

def pricing_core(prices: list[float]):
    stats = estimate_price(prices)
    
    if not stats:
        return None
    
    confidence = compute_confidence(stats)
    
    return {
        "estimate": stats["estimate"],
        "price_low": stats["low"],
        "price_high": stats["high"],
        "confidence": confidence,
        "sales_count": stats["num_sales"]
    }

# Caching pricing to keep some info so API calls aren't as expensive
@lru_cache(maxsize=256)
def cached_pricing(query: str):
    prices = get_sold_prices(query)
    return pricing_core(tuple(prices))
    
def test():
    test_card = {
        "card_series": "2021-22 Upper Deck Series 2 Hockey",
        "name": "Cole Caufield",
        "card_number": "236",
        "card_type": "Base"
    }
    
    result = price_card(test_card)
    print(result)

if __name__ == "__main__":
    test()