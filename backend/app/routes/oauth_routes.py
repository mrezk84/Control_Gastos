from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, models
from ..auth.utils import create_access_token, hash_password
import httpx
import os
import secrets

router = APIRouter(tags=["OAuth"])

# --- OAuth Config ---

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback")

MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID", "")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET", "")
MICROSOFT_REDIRECT_URI = os.getenv("MICROSOFT_REDIRECT_URI", "http://localhost:8000/auth/microsoft/callback")

APPLE_CLIENT_ID = os.getenv("APPLE_CLIENT_ID", "")
APPLE_TEAM_ID = os.getenv("APPLE_TEAM_ID", "")
APPLE_KEY_ID = os.getenv("APPLE_KEY_ID", "")
APPLE_REDIRECT_URI = os.getenv("APPLE_REDIRECT_URI", "http://localhost:8000/auth/apple/callback")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _get_or_create_oauth_user(db: Session, email: str, name: str, provider: str, provider_id: str, avatar_url: str = None):
    """Find existing user by email or create a new one for OAuth login."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        # Update provider info if needed
        if not user.provider_id:
            user.auth_provider = provider
            user.provider_id = provider_id
            if avatar_url:
                user.avatar_url = avatar_url
            db.commit()
            db.refresh(user)
        return user
    # Create new user
    username = email.split("@")[0]
    # Ensure unique username
    base_username = username
    counter = 1
    while db.query(models.User).filter(models.User.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1
    
    new_user = models.User(
        username=username,
        email=email,
        hashed_password=None,
        auth_provider=provider,
        provider_id=provider_id,
        avatar_url=avatar_url,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ===================== GOOGLE =====================

@router.get("/google")
def google_login():
    """Redirect to Google OAuth consent screen."""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": secrets.token_urlsafe(16),
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + "&".join(f"{k}={v}" for k, v in params.items())
    return {"auth_url": url}


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback."""
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to exchange code for token: {token_resp.text}")
        token_data = token_resp.json()

        # Get user info
        userinfo_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        userinfo = userinfo_resp.json()

    user = _get_or_create_oauth_user(
        db,
        email=userinfo["email"],
        name=userinfo.get("name", ""),
        provider="google",
        provider_id=userinfo["id"],
        avatar_url=userinfo.get("picture"),
    )
    access_token = create_access_token(data={"sub": user.username})
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{FRONTEND_URL}/oauth-callback?token={access_token}")


# ===================== MICROSOFT =====================

@router.get("/microsoft")
def microsoft_login():
    """Redirect to Microsoft OAuth consent screen."""
    if not MICROSOFT_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Microsoft OAuth not configured")
    params = {
        "client_id": MICROSOFT_CLIENT_ID,
        "redirect_uri": MICROSOFT_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile User.Read",
        "state": secrets.token_urlsafe(16),
    }
    url = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" + "&".join(f"{k}={v}" for k, v in params.items())
    return {"auth_url": url}


@router.get("/microsoft/callback")
async def microsoft_callback(code: str, db: Session = Depends(get_db)):
    """Handle Microsoft OAuth callback."""
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            data={
                "code": code,
                "client_id": MICROSOFT_CLIENT_ID,
                "client_secret": MICROSOFT_CLIENT_SECRET,
                "redirect_uri": MICROSOFT_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        token_data = token_resp.json()

        userinfo_resp = await client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        userinfo = userinfo_resp.json()

    email = userinfo.get("mail") or userinfo.get("userPrincipalName", "")
    user = _get_or_create_oauth_user(
        db,
        email=email,
        name=userinfo.get("displayName", ""),
        provider="microsoft",
        provider_id=userinfo["id"],
    )
    access_token = create_access_token(data={"sub": user.username})
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{FRONTEND_URL}/oauth-callback?token={access_token}")


# ===================== APPLE =====================

@router.get("/apple")
def apple_login():
    """Redirect to Apple Sign In consent screen."""
    if not APPLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Apple Sign In not configured")
    params = {
        "client_id": APPLE_CLIENT_ID,
        "redirect_uri": APPLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "name email",
        "response_mode": "form_post",
        "state": secrets.token_urlsafe(16),
    }
    url = "https://appleid.apple.com/auth/authorize?" + "&".join(f"{k}={v}" for k, v in params.items())
    return {"auth_url": url}


@router.post("/apple/callback")
async def apple_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Apple Sign In callback (Apple uses POST with form_post)."""
    form = await request.form()
    code = form.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="No authorization code received")

    # Exchange code for token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://appleid.apple.com/auth/token",
            data={
                "code": code,
                "client_id": APPLE_CLIENT_ID,
                "client_secret": _generate_apple_client_secret(),
                "redirect_uri": APPLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        token_data = token_resp.json()

    # Decode the id_token to get user info
    import jwt as pyjwt
    id_token = token_data.get("id_token", "")
    try:
        claims = pyjwt.decode(id_token, options={"verify_signature": False})
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to decode Apple ID token")

    email = claims.get("email", "")
    apple_sub = claims.get("sub", "")

    # Apple only sends name on first authorization via form data
    user_data = form.get("user")
    name = ""
    if user_data:
        import json
        try:
            user_json = json.loads(user_data)
            name_data = user_json.get("name", {})
            name = f"{name_data.get('firstName', '')} {name_data.get('lastName', '')}".strip()
        except (json.JSONDecodeError, AttributeError):
            pass

    user = _get_or_create_oauth_user(
        db,
        email=email,
        name=name,
        provider="apple",
        provider_id=apple_sub,
    )
    access_token = create_access_token(data={"sub": user.username})
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{FRONTEND_URL}/oauth-callback?token={access_token}", status_code=303)


def _generate_apple_client_secret():
    """Generate a JWT client secret for Apple Sign In using ES256.
    Requires APPLE_KEY_FILE env var pointing to the .p8 private key file."""
    import time
    import jwt as pyjwt

    key_file = os.getenv("APPLE_KEY_FILE", "")
    if not key_file or not os.path.exists(key_file):
        raise HTTPException(status_code=501, detail="Apple Sign In key file not configured")

    with open(key_file, "r") as f:
        private_key = f.read()

    now = int(time.time())
    payload = {
        "iss": APPLE_TEAM_ID,
        "iat": now,
        "exp": now + 86400 * 180,  # 6 months
        "aud": "https://appleid.apple.com",
        "sub": APPLE_CLIENT_ID,
    }
    headers = {
        "kid": APPLE_KEY_ID,
        "alg": "ES256",
    }
    return pyjwt.encode(payload, private_key, algorithm="ES256", headers=headers)
