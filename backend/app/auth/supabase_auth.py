from fastapi import Depends, HTTPException, Request
import httpx
from jose import jwt, JWTError
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"


def current_user(request: Request):
    auth = request.headers.get("Authorization")

    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(401, "Missing token")

    token = auth.split(" ")[1]

    try:
        with httpx.Client() as client:
            jwks = client.get(JWKS_URL).json()

        payload = jwt.decode(
            token,
            jwks,
            algorithms=["ES256"],
            audience="authenticated",
            issuer=f"{SUPABASE_URL}/auth/v1",
        )

        return {"user_id": payload["sub"], "email": payload.get("email")}

    except JWTError as e:
        print("JWT ERROR:", e)
        raise HTTPException(401, "Invalid token")
