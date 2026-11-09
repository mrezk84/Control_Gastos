"""
Inicio de sesión social (Google, Microsoft) con el flujo de código de autorización.

Flujo (cada paso se consume una sola vez y queda atado al navegador que lo inició):

1. El frontend genera un verificador aleatorio, lo guarda en su sessionStorage y pide
   `GET /auth/{provider}?challenge=<SHA-256 del verificador>`. El backend guarda una transacción
   (`OAuthFlow`) con un `state` aleatorio de un solo uso y un PKCE propio con el proveedor.
2. El proveedor vuelve a `/auth/{provider}/callback`. El backend consume el state, intercambia el
   código, identifica a la persona por (proveedor, sujeto estable) y redirige al frontend con un
   código de canje de un solo uso y 60 s de vida: `/oauth-callback?code=...`. Nunca viaja el JWT por la URL.
3. El frontend canjea el código con `POST /auth/oauth/exchange {code, verifier}`; solo el navegador
   que conoce el verificador obtiene la sesión. Un enlace con el código de otra persona no sirve.

Un correo ya registrado NO se vincula automáticamente a una identidad social: se rechaza con un aviso.
"""

import base64
import hashlib
import hmac
import logging
import os
import re
import secrets
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, rate_limiter
from ..auth.utils import issue_session_token
from ..database import get_db
from ..frontend_url import primary_frontend_url, with_scheme

logger = logging.getLogger(__name__)

router = APIRouter(tags=["OAuth"])

def backend_url() -> str:
    """URL pública del backend, con esquema y sin barra final (se lee al usarla: así una corrección en Vercel basta)."""
    return with_scheme(os.getenv("BACKEND_URL") or "http://localhost:8000")

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
    return with_scheme(explicit) if explicit else f"{backend_url()}/auth/{provider}/callback"


STATE_MINUTES = 10
CODE_SECONDS = 60
EXCHANGE_IP_LIMIT = (30, 10 * 60)
START_IP_LIMIT = (30, 10 * 60)
_CHALLENGE_RE = re.compile(r"^[A-Za-z0-9_-]{43}$")  # base64url sin relleno de un SHA-256


def _sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _b64url_sha256(value: str) -> str:
    return base64.urlsafe_b64encode(hashlib.sha256(value.encode()).digest()).rstrip(b"=").decode()


def _start_flow(db: Session, provider: str, challenge: str) -> tuple[str, str]:
    """Crea la transacción y devuelve (state, challenge PKCE para el proveedor)."""
    state = secrets.token_urlsafe(32)
    provider_verifier = secrets.token_urlsafe(64)  # 86 caracteres: dentro de 43..128 (RFC 7636)
    db.add(models.OAuthFlow(
        state_hash=_sha256_hex(state),
        provider=provider,
        challenge=challenge,
        provider_verifier=provider_verifier,
        expires_at=datetime.utcnow() + timedelta(minutes=STATE_MINUTES),
    ))
    db.commit()
    return state, _b64url_sha256(provider_verifier)


def _consume_state(db: Session, state: str, provider: str) -> Optional[models.OAuthFlow]:
    """Devuelve la transacción si el state es válido y la marca usada (un solo uso, atómico); si no, None."""
    flow = db.query(models.OAuthFlow).filter(models.OAuthFlow.state_hash == _sha256_hex(state)).first()
    now = datetime.utcnow()
    if not flow or flow.provider != provider or flow.state_used_at is not None or flow.expires_at < now:
        return None
    claimed = db.query(models.OAuthFlow).filter(
        models.OAuthFlow.id == flow.id, models.OAuthFlow.state_used_at.is_(None)
    ).update({"state_used_at": now}, synchronize_session=False)
    db.commit()
    return flow if claimed == 1 else None


class EmailInUse(Exception):
    """Ya existe una cuenta con ese correo que no pertenece a esta identidad social."""


def _get_or_create_oauth_user(db: Session, email: str, provider: str, provider_id: str, avatar_url: str = None):
    """Identifica a la persona por (proveedor, sujeto estable). El correo NUNCA basta para entrar a una cuenta.

    - Si la identidad ya existe, se usa esa cuenta.
    - Si no existe pero el correo ya está registrado, se lanza `EmailInUse` (sin fusionar cuentas):
      quien registró antes ese correo con una contraseña no puede heredar el acceso social de otra persona.
      Única excepción: una cuenta sin contraseña y sin identidad social (huérfana) puede reclamarse.
    - Si no, se crea una cuenta nueva.
    """
    user = db.query(models.User).filter(
        models.User.auth_provider == provider, models.User.provider_id == provider_id
    ).first()
    if user:
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
            db.commit()
            db.refresh(user)
        return user

    existing = db.query(models.User).filter(func.lower(models.User.email) == email.lower()).first()
    if existing:
        if existing.hashed_password or existing.provider_id:
            raise EmailInUse()
        existing.auth_provider = provider
        existing.provider_id = provider_id
        if avatar_url and not existing.avatar_url:
            existing.avatar_url = avatar_url
        db.commit()
        db.refresh(existing)
        return existing

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


def _login_url(db: Session, provider: str, challenge: str) -> dict:
    cfg = PROVIDERS[provider]
    if not cfg["client_id"]:
        raise HTTPException(status_code=501, detail=f"{provider.capitalize()} OAuth no está configurado")
    if not _CHALLENGE_RE.match(challenge):
        raise HTTPException(status_code=422, detail="challenge inválido")
    state, code_challenge = _start_flow(db, provider, challenge)
    params = {
        "client_id": cfg["client_id"],
        "redirect_uri": _redirect_uri(provider),
        "response_type": "code",
        "scope": cfg["scope"],
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    return {"auth_url": f"{cfg['authorize_url']}?{urlencode(params)}"}


def _back_to_frontend(error: str) -> RedirectResponse:
    return RedirectResponse(url=f"{primary_frontend_url()}/oauth-callback?{urlencode({'error': error})}")


async def _callback(
    provider: str, code: Optional[str], state: str, error: Optional[str], db: Session
) -> RedirectResponse:
    cfg = PROVIDERS[provider]
    if not cfg["client_id"]:
        raise HTTPException(status_code=501, detail=f"{provider.capitalize()} OAuth no está configurado")
    flow = _consume_state(db, state, provider)
    if flow is None:
        return _back_to_frontend("sesion_expirada")
    if error or not code:  # la persona canceló o el proveedor rechazó la solicitud
        return _back_to_frontend("cancelado")

    async with httpx.AsyncClient(timeout=10) as client:
        token_resp = await client.post(
            cfg["token_url"],
            data={
                "code": code,
                "client_id": cfg["client_id"],
                "client_secret": cfg["client_secret"],
                "redirect_uri": _redirect_uri(provider),
                "grant_type": "authorization_code",
                "code_verifier": flow.provider_verifier,
            },
        )
        if token_resp.status_code != 200:
            logger.warning(f"{provider} token exchange failed: {token_resp.text}")
            return _back_to_frontend("proveedor")

        userinfo_resp = await client.get(
            cfg["userinfo_url"],
            headers={"Authorization": f"Bearer {token_resp.json()['access_token']}"},
        )
        if userinfo_resp.status_code != 200:
            return _back_to_frontend("proveedor")
        info = userinfo_resp.json()

    email = info.get("email")
    subject = info.get("id") or info.get("sub")
    if not email or not subject:
        return _back_to_frontend("sin_correo")
    # Google informa si verificó el correo; sin verificar no se acepta
    if provider == "google" and info.get("verified_email") is not True:
        return _back_to_frontend("correo_no_verificado")

    try:
        user = _get_or_create_oauth_user(
            db,
            email=email,
            provider=provider,
            provider_id=str(subject),
            avatar_url=info.get("picture"),
        )
    except EmailInUse:
        logger.warning(f"{provider} login rejected: email already registered to another account")
        return _back_to_frontend("correo_en_uso")

    # Código de canje de un solo uso: solo lo puede cambiar por sesión el navegador que inició el flujo
    exchange_code = secrets.token_urlsafe(32)
    flow.code_hash = _sha256_hex(exchange_code)
    flow.code_expires_at = datetime.utcnow() + timedelta(seconds=CODE_SECONDS)
    flow.user_id = user.id
    db.commit()
    return RedirectResponse(url=f"{primary_frontend_url()}/oauth-callback?{urlencode({'code': exchange_code})}")


class ExchangeRequest(BaseModel):
    code: str
    verifier: str


@router.post("/oauth/exchange")
def oauth_exchange(payload: ExchangeRequest, request: Request, db: Session = Depends(get_db)):
    """Canjea el código de un solo uso por la sesión; exige el verificador del navegador que inició el flujo."""
    rate_limiter.hit(db, "oauth_exchange:ip", rate_limiter.client_ip(request), *EXCHANGE_IP_LIMIT)
    invalid = HTTPException(status_code=400, detail="Código inválido o vencido")
    if len(payload.code) > 200 or len(payload.verifier) > 200:
        raise invalid

    now = datetime.utcnow()
    flow = db.query(models.OAuthFlow).filter(models.OAuthFlow.code_hash == _sha256_hex(payload.code)).first()
    if not flow or flow.code_used_at is not None or not flow.code_expires_at or flow.code_expires_at < now:
        raise invalid

    # Se quema en cualquier caso: un intento fallido (verificador ajeno) también invalida el código
    claimed = db.query(models.OAuthFlow).filter(
        models.OAuthFlow.id == flow.id, models.OAuthFlow.code_used_at.is_(None)
    ).update({"code_used_at": now}, synchronize_session=False)
    db.commit()
    if claimed != 1:
        raise invalid
    if not hmac.compare_digest(_b64url_sha256(payload.verifier), flow.challenge or ""):
        logger.warning("OAuth exchange with a verifier that does not match the flow")
        raise invalid

    user = db.query(models.User).filter(models.User.id == flow.user_id).first()
    if not user:
        raise invalid
    return {"access_token": issue_session_token(user), "token_type": "bearer"}


@router.get("/google")
def google_login(request: Request, challenge: str = Query(...), db: Session = Depends(get_db)):
    rate_limiter.hit(db, "oauth_start:ip", rate_limiter.client_ip(request), *START_IP_LIMIT)
    return _login_url(db, "google", challenge)


@router.get("/google/callback")
async def google_callback(
    state: str, code: Optional[str] = None, error: Optional[str] = None, db: Session = Depends(get_db)
):
    return await _callback("google", code, state, error, db)


@router.get("/microsoft")
def microsoft_login(request: Request, challenge: str = Query(...), db: Session = Depends(get_db)):
    rate_limiter.hit(db, "oauth_start:ip", rate_limiter.client_ip(request), *START_IP_LIMIT)
    return _login_url(db, "microsoft", challenge)


@router.get("/microsoft/callback")
async def microsoft_callback(
    state: str, code: Optional[str] = None, error: Optional[str] = None, db: Session = Depends(get_db)
):
    return await _callback("microsoft", code, state, error, db)
