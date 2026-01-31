from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
import os

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
ALGORITHM='HS256'

def current_user(request: Request):
    """Returns current user based on Supabase JWT token in Authorization header"""
    
    # Get authetnication bearer token
    auth = request.headers.get("Authorization")
    
    # If not valid header, raise exception
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = auth.split(" ")[1]

    try:
        # Decode JWT and verify
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=[ALGORITHM])
        return {
            "user_id": payload["sub"],
            "email": payload.get("email")
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")