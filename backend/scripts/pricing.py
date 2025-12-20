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

def get_sold_prices(query, token, limit=25):
    """eBay sold listings search; Returns a list of sale prices"""

    # Authorization headers
    headers = {
        "Authorization": f"Bearer {token}",
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US"
    }

    params = {
        "q": query,             # search string
        "filter": "soldItems",  # only SOLD listings
        "limit": limit
    }

    response = requests.get(
        "https://api.ebay.com/buy/browse/v1/item_summary/search",
        headers=headers,
        params=params
    )

    response.raise_for_status()
    data = response.json()

    prices = []

    # Extract prices from response
    for item in data.get("itemSummaries", []):
        price = item.get("price", {}).get("value")
        if price:
            prices.append(float(price))

    return prices


def estimate_price(prices):
    """Removes outliers using IQR and returns a robust price estimate using median"""

    # Return none if no prices
    if not prices:
        return None

    prices = np.array(prices)

    # Compute interquartile range (IQR)
    q1, q3 = np.percentile(prices, [25, 75])
    iqr = q3 - q1

    # Remove outliers using IQR formula
    filtered = prices[
        (prices >= q1 - 1.5 * iqr) &
        (prices <= q3 + 1.5 * iqr)
    ]

    # Pricing summary
    return {
        "estimate": round(float(np.median(filtered)), 2),
        "low": round(float(np.percentile(filtered, 25)), 2),
        "high": round(float(np.percentile(filtered, 75)), 2),
        "num_sales": int(len(filtered))
    }

def price_card(fields):
    """Takes confirmed card fields and returns a market estimate"""

    token = get_ebay_token()

    # Build search query
    query = f"{fields['name']}, {fields['card_series']}, Card Number:{fields['card_number']}"

    # Pricing
    prices = get_sold_prices(query, token)
    pricing = estimate_price(prices)

    return {
        "query": query,
        "pricing": pricing
    }