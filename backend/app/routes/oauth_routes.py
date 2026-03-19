from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, models
from ..auth.utils import create_access_token, hash_password
from ..config import get_settings
import httpx
import os
import secrets

router = APIRouter(tags=["OAuth"])

# --- OAuth Config Helper ---

def _get_oauth_config():
    """Get OAuth configuration dynamically to ensure env vars are loaded."""
    settings = get_settings()
    return {
        "google": {
            "client_id": settings.google_client_id or "",
            "client_secret": settings.google_client_secret or "",
            "redirect_uri": settings.google_redirect_uri,
        },
        "microsoft": {
            "client_id": settings.microsoft_client_id or "",
            "client_secret": settings.microsoft_client_secret or "",
            "redirect_uri": settings.microsoft_redirect_uri,
        },
        "apple": {
            "client_id": settings.apple_client_id or "",
            "team_id": settings.apple_team_id or "",
            "key_id": settings.apple_key_id or "",
            "key_file": settings.apple_key_file or "",
            "redirect_uri": settings.apple_redirect_uri,
        },
        "frontend_url": settings.frontend_url,
    }


def _get_or_create_oauth_user(db: Session, email: str, name: str, provider: str, provider_id: str, avatar_url: str = None):
    """Find existing user by email or create a new one for OAuth login."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        # Update provider info if needed
        if not user.provider_id:
            user.auth_provider = provider
            user.provider_id = provider_id
        # Always update avatar_url if provided and different
        if avatar_url and user.avatar_url != avatar_url:
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
    config = _get_oauth_config()
    google = config["google"]

    if not google["client_id"]:
        raise HTTPException(status_code=501, detail="Google OAuth not configured")

    params = {
        "client_id": google["client_id"],
        "redirect_uri": google["redirect_uri"],
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
        "state": secrets.token_urlsafe(16),
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + "&".join(f"{k}={v}" for k, v in params.items())
    return {"auth_url": url}


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback."""
    config = _get_oauth_config()
    google = config["google"]

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": google["client_id"],
                "client_secret": google["client_secret"],
                "redirect_uri": google["redirect_uri"],
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
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
    return RedirectResponse(url=f"{config['frontend_url']}/oauth-callback?token={access_token}")


# ===================== MICROSOFT =====================

@router.get("/microsoft")
def microsoft_login():
    """Redirect to Microsoft OAuth consent screen."""
    config = _get_oauth_config()
    microsoft = config["microsoft"]

    if not microsoft["client_id"]:
        raise HTTPException(status_code=501, detail="Microsoft OAuth not configured")

    params = {
        "client_id": microsoft["client_id"],
        "redirect_uri": microsoft["redirect_uri"],
        "response_type": "code",
        "scope": "openid email profile User.Read",
        "state": secrets.token_urlsafe(16),
    }
    url = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?" + "&".join(f"{k}={v}" for k, v in params.items())
    return {"auth_url": url}


@router.get("/microsoft/callback")
async def microsoft_callback(code: str, db: Session = Depends(get_db)):
    """Handle Microsoft OAuth callback."""
    config = _get_oauth_config()
    microsoft = config["microsoft"]

    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            data={
                "code": code,
                "client_id": microsoft["client_id"],
                "client_secret": microsoft["client_secret"],
                "redirect_uri": microsoft["redirect_uri"],
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
    return RedirectResponse(url=f"{config['frontend_url']}/oauth-callback?token={access_token}")


# ===================== APPLE =====================

@router.get("/apple")
def apple_login():
    """Redirect to Apple Sign In consent screen."""
    config = _get_oauth_config()
    apple = config["apple"]

    if not apple["client_id"]:
        raise HTTPException(status_code=501, detail="Apple Sign In not configured")

    params = {
        "client_id": apple["client_id"],
        "redirect_uri": apple["redirect_uri"],
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
    config = _get_oauth_config()
    apple = config["apple"]

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
                "client_id": apple["client_id"],
                "client_secret": _generate_apple_client_secret(apple),
                "redirect_uri": apple["redirect_uri"],
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
    return RedirectResponse(url=f"{config['frontend_url']}/oauth-callback?token={access_token}", status_code=303)


def _generate_apple_client_secret(apple_config):
    """Generate a JWT client secret for Apple Sign In using ES256.
    Requires apple_config with key_file pointing to the .p8 private key file."""
    import time
    import jwt as pyjwt

    key_file = apple_config.get("key_file")
    if not key_file or not os.path.exists(key_file):
        raise HTTPException(status_code=501, detail="Apple Sign In key file not configured")

    with open(key_file, "r") as f:
        private_key = f.read()

    now = int(time.time())
    payload = {
        "iss": apple_config.get("team_id"),
        "iat": now,
        "exp": now + 86400 * 180,  # 6 months
        "aud": "https://appleid.apple.com",
        "sub": apple_config.get("client_id"),
    }
    headers = {
        "kid": apple_config.get("key_id"),
        "alg": "ES256",
    }
    return pyjwt.encode(payload, private_key, algorithm="ES256", headers=headers)
