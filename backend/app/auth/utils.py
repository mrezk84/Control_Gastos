"""
Authentication utilities module.

Authentication is delegated to Supabase Auth (email/password, Google, Microsoft...).
The frontend sends the Supabase access token as a Bearer token; here we verify it
and map the Supabase user to a row in our local `users` table.
"""

import logging
import os
import re
import time
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from ..database import get_db

logger = logging.getLogger(__name__)

load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
# Legacy HS256 secret (Project Settings > API > JWT Secret). Optional for projects
# using the new asymmetric signing keys, which are verified through JWKS instead.
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
SUPABASE_JWT_AUDIENCE = "authenticated"

if not SUPABASE_URL:
    logger.warning("SUPABASE_URL is not set: authenticated endpoints will reject every request")

bearer_scheme = HTTPBearer(auto_error=False)

_JWKS_TTL_SECONDS = 3600
_jwks_cache = {"keys": None, "fetched_at": 0.0}


def _get_jwks(force_refresh: bool = False) -> list:
    """Fetch (and cache) the project's public signing keys."""
    now = time.time()
    if (
        not force_refresh
        and _jwks_cache["keys"] is not None
        and now - _jwks_cache["fetched_at"] < _JWKS_TTL_SECONDS
    ):
        return _jwks_cache["keys"]

    resp = httpx.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json", timeout=5)
    resp.raise_for_status()
    _jwks_cache["keys"] = resp.json().get("keys", [])
    _jwks_cache["fetched_at"] = now
    return _jwks_cache["keys"]


def decode_supabase_token(token: str) -> dict:
    """
    Verify a Supabase access token and return its claims.

    Raises:
        JWTError: If the token is invalid, expired or cannot be verified
    """
    header = jwt.get_unverified_header(token)
    alg = header.get("alg")
    issuer = f"{SUPABASE_URL}/auth/v1"

    if alg == "HS256":
        if not SUPABASE_JWT_SECRET:
            raise JWTError("SUPABASE_JWT_SECRET is required to verify HS256 tokens")
        key = SUPABASE_JWT_SECRET
    else:
        kid = header.get("kid")
        try:
            keys = _get_jwks()
            key = next((k for k in keys if k.get("kid") == kid), None)
            if key is None:
                # Keys may have been rotated: refresh once.
                key = next((k for k in _get_jwks(force_refresh=True) if k.get("kid") == kid), None)
        except httpx.HTTPError as e:
            raise JWTError(f"Could not fetch Supabase JWKS: {e}")
        if key is None:
            raise JWTError("Signing key not found in Supabase JWKS")

    return jwt.decode(
        token,
        key,
        algorithms=[alg],
        audience=SUPABASE_JWT_AUDIENCE,
        issuer=issuer,
    )


def _unique_username(db: Session, base: str) -> str:
    from ..models import User

    base = re.sub(r"[^a-zA-Z0-9_.-]", "", base or "")[:140] or "usuario"
    username = base
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base}{counter}"
        counter += 1
    return username


def get_or_create_user_from_claims(db: Session, claims: dict):
    """
    Find the local user linked to a Supabase user, linking by email or
    creating it on first login.
    """
    from ..models import User

    supabase_id = claims["sub"]
    email = (claims.get("email") or "").lower()
    metadata = claims.get("user_metadata") or {}
    app_metadata = claims.get("app_metadata") or {}
    provider = app_metadata.get("provider") or "email"
    avatar_url = metadata.get("avatar_url") or metadata.get("picture")

    user = db.query(User).filter(User.supabase_id == supabase_id).first()
    if user:
        return user

    # Existing account (e.g. migrated from the old database): link it by email.
    if email:
        user = db.query(User).filter(User.email.ilike(email)).first()
    if user:
        user.supabase_id = supabase_id
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
    else:
        user = User(
            username=_unique_username(
                db,
                metadata.get("username") or (email.split("@")[0] if email else supabase_id[:8]),
            ),
            email=email,
            supabase_id=supabase_id,
            auth_provider=provider,
            avatar_url=avatar_url,
        )
        db.add(user)

    db.commit()
    db.refresh(user)
    logger.info(f"Linked Supabase user {supabase_id} to local user '{user.username}'")
    return user


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """
    Get the current authenticated user from the Supabase access token.

    Raises:
        HTTPException: If token is missing or invalid
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None or not SUPABASE_URL:
        raise credentials_exception

    try:
        claims = decode_supabase_token(credentials.credentials)
    except JWTError as e:
        logger.warning(f"Supabase token rejected: {e}")
        raise credentials_exception

    if not claims.get("sub"):
        raise credentials_exception

    return get_or_create_user_from_claims(db, claims)
