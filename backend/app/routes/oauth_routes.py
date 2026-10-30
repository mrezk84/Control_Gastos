"""
Inicio de sesión social (Google, Microsoft) con el flujo de código de autorización.

El frontend pide `GET /auth/{provider}` y redirige al `auth_url` devuelto. El proveedor vuelve a
`/auth/{provider}/callback`, el backend intercambia el código, crea o vincula el usuario y redirige
al frontend con nuestro propio JWT en `/oauth-callback?token=...`.
"""

from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
import logging
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from jose import JWTError, jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models
from ..auth.utils import SECRET_KEY, create_access_token
from ..database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["OAuth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

PROVIDERS = {
    "google": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID", ""),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET", ""),
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "userinfo_url": "https://www.googleapis.com/oauth2/v2/userinfo",
        "scope": "openid email profile",
    },
    "microsoft": {
        "client_id": os.getenv("MICROSOFT_CLIENT_ID", ""),
        "client_secret": os.getenv("MICROSOFT_CLIENT_SECRET", ""),
        "authorize_url": "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        "token_url": "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        "userinfo_url": "https://graph.microsoft.com/oidc/userinfo",
        "scope": "openid email profile",
    },
}


def _redirect_uri(provider: str) -> str:
    # GOOGLE_REDIRECT_URI / MICROSOFT_REDIRECT_URI tienen prioridad si están definidas
    explicit = os.getenv(f"{provider.upper()}_REDIRECT_URI")
    return explicit or f"{BACKEND_URL.rstrip('/')}/auth/{provider}/callback"


def _make_state(provider: str) -> str:
    """State firmado y con vencimiento: evita callbacks forjados (CSRF)."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=10)
    return jwt.encode({"purpose": "oauth_state", "provider": provider, "exp": expire}, SECRET_KEY, algorithm="HS256")


def _check_state(state: str, provider: str) -> None:
    try:
        payload = jwt.decode(state, SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        raise HTTPException(status_code=400, detail="Estado de OAuth inválido o vencido")
    if payload.get("purpose") != "oauth_state" or payload.get("provider") != provider:
        raise HTTPException(status_code=400, detail="Estado de OAuth inválido")


def _get_or_create_oauth_user(db: Session, email: str, provider: str, provider_id: str, avatar_url: str = None):
    """Busca el usuario por correo o crea uno nuevo para el login social."""
    user = db.query(models.User).filter(func.lower(models.User.email) == email.lower()).first()
    if user:
        if not user.provider_id and not user.hashed_password:
            user.auth_provider = provider
            user.provider_id = provider_id
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)
        return user

    base_username = email.split("@")[0]
    username = base_username
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


def _login_url(provider: str) -> dict:
    cfg = PROVIDERS[provider]
    if not cfg["client_id"]:
        raise HTTPException(status_code=501, detail=f"{provider.capitalize()} OAuth no está configurado")
    params = {
        "client_id": cfg["client_id"],
        "redirect_uri": _redirect_uri(provider),
        "response_type": "code",
        "scope": cfg["scope"],
        "state": _make_state(provider),
    }
    return {"auth_url": f"{cfg['authorize_url']}?{urlencode(params)}"}


async def _callback(provider: str, code: str, state: str, db: Session) -> RedirectResponse:
    cfg = PROVIDERS[provider]
    if not cfg["client_id"]:
        raise HTTPException(status_code=501, detail=f"{provider.capitalize()} OAuth no está configurado")
    _check_state(state, provider)

    async with httpx.AsyncClient(timeout=10) as client:
        token_resp = await client.post(
            cfg["token_url"],
            data={
                "code": code,
                "client_id": cfg["client_id"],
                "client_secret": cfg["client_secret"],
                "redirect_uri": _redirect_uri(provider),
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            logger.warning(f"{provider} token exchange failed: {token_resp.text}")
            raise HTTPException(status_code=400, detail="No se pudo completar el inicio de sesión")

        userinfo_resp = await client.get(
            cfg["userinfo_url"],
            headers={"Authorization": f"Bearer {token_resp.json()['access_token']}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="No se pudo obtener el perfil del usuario")
        info = userinfo_resp.json()

    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="El proveedor no devolvió un correo electrónico")
    # Google marca explícitamente si verificó el correo; no vincular cuentas por un correo sin verificar
    if provider == "google" and info.get("verified_email") is False:
        raise HTTPException(status_code=400, detail="El correo de Google no está verificado")

    user = _get_or_create_oauth_user(
        db,
        email=email,
        provider=provider,
        provider_id=str(info.get("id") or info.get("sub")),
        avatar_url=info.get("picture"),
    )
    access_token = create_access_token(data={"sub": user.username})
    return RedirectResponse(url=f"{FRONTEND_URL.rstrip('/')}/oauth-callback?token={access_token}")


@router.get("/google")
def google_login():
    return _login_url("google")


@router.get("/google/callback")
async def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    return await _callback("google", code, state, db)


@router.get("/microsoft")
def microsoft_login():
    return _login_url("microsoft")


@router.get("/microsoft/callback")
async def microsoft_callback(code: str, state: str, db: Session = Depends(get_db)):
    return await _callback("microsoft", code, state, db)
