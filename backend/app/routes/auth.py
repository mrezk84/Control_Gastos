"""
Authentication routes module.
Handles user registration, login, password reset, and user info endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
import logging

from ..database import get_db
from .. import schemas, models, rate_limiter
from ..auth.utils import (
    hash_password, verify_password, issue_session_token, get_current_user,
    MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH,
)
from ..crud import get_user_by_username, create_user
from ..services.email_service import send_password_reset_email
from ..frontend_url import primary_frontend_url
import hashlib
import secrets
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, field_validator

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Authentication"])



# Request/Response Schemas
class ForgotPasswordRequest(BaseModel):
    """Request schema for password reset."""
    email: str = Field(..., description="Email address for the account")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        if not v or "@" not in v:
            raise ValueError("Invalid email address")
        return v.strip().lower()


class ResetPasswordRequest(BaseModel):
    """Request schema for password reset confirmation."""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(
        ..., min_length=MIN_PASSWORD_LENGTH, max_length=MAX_PASSWORD_LENGTH,
        description=f"New password (min {MIN_PASSWORD_LENGTH} characters)",
    )


RESET_TOKEN_MINUTES = 15
# Límites de intentos (ver rate_limiter.py). Cuenta: por nombre de usuario/correo que se prueba; IP: por origen.
LOGIN_ACCOUNT_LIMIT = (5, 15 * 60)
LOGIN_IP_LIMIT = (30, 15 * 60)
REGISTER_IP_LIMIT = (10, 60 * 60)
FORGOT_IP_LIMIT = (5, 60 * 60)
FORGOT_EMAIL_LIMIT = (3, 60 * 60)
RESET_IP_LIMIT = (10, 60 * 60)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    """Register a new user."""
    rate_limiter.hit(db, "register:ip", rate_limiter.client_ip(request), *REGISTER_IP_LIMIT)
    try:
        user.email = user.email.strip().lower()
        if get_user_by_username(db, user.username):
            logger.warning(f"Registration attempt with existing username: {user.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está registrado"
            )

        if db.query(models.User).filter(func.lower(models.User.email) == user.email).first():
            logger.warning(f"Registration attempt with existing email: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado"
            )

        hashed = hash_password(user.password)
        db_user = create_user(db, user, hashed)

        logger.info(f"New user registered: {user.username}")
        return db_user

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error during user registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al registrar usuario. Por favor, intentá de nuevo."
        )


@router.post("/token", response_model=schemas.Token)
def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Authenticate user and return access token."""
    # Cada intento se cuenta ANTES de comprobar la contraseña (una ráfaga paralela no se cuela);
    # un inicio de sesión correcto borra el contador de la cuenta.
    account = form_data.username.strip().lower()
    rate_limiter.hit_many(db, [
        ("login:account", account, *LOGIN_ACCOUNT_LIMIT),
        ("login:ip", rate_limiter.client_ip(request), *LOGIN_IP_LIMIT),
    ])
    invalid_credentials = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Nombre de usuario o contraseña incorrectos",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # El campo "username" del formulario OAuth2 acepta nombre de usuario o correo
        user = db.query(models.User).filter(
            or_(
                models.User.username == form_data.username,
                func.lower(models.User.email) == form_data.username.strip().lower(),
            )
        ).first()

        if not user:
            logger.warning(f"Login attempt with non-existent user: {form_data.username}")
            raise invalid_credentials

        if not user.hashed_password:
            logger.warning(f"Login attempt for OAuth user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Esta cuenta usa inicio de sesión social. Usá Google o Microsoft para ingresar.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(form_data.password, user.hashed_password):
            logger.warning(f"Failed login attempt for user: {form_data.username}")
            raise invalid_credentials

        rate_limiter.clear(db, "login:account", account)
        access_token = issue_session_token(user)
        logger.info(f"User logged in: {user.username}")
        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al iniciar sesión. Por favor, intentá de nuevo."
        )


@router.get("/me", response_model=schemas.User)
def get_current_user_info(
    current_user: models.User = Depends(get_current_user)
):
    """Get current authenticated user information."""
    return current_user


@router.put("/me", response_model=schemas.User)
def update_profile(
    payload: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Actualiza país (ISO 3166), moneda (ISO 4217) y zona horaria (IANA) de la persona."""
    from zoneinfo import ZoneInfo
    data = payload.model_dump(exclude_unset=True)
    if data.get("country") is not None:
        c = data["country"].strip().upper()
        if not (len(c) == 2 and c.isalpha()):
            raise HTTPException(status_code=422, detail="País inválido (código de 2 letras)")
        data["country"] = c
    if data.get("currency") is not None:
        c = data["currency"].strip().upper()
        if not (len(c) == 3 and c.isalpha()):
            raise HTTPException(status_code=422, detail="Moneda inválida (código de 3 letras)")
        data["currency"] = c
    if data.get("timezone") is not None:
        try:
            ZoneInfo(data["timezone"])
        except Exception:
            raise HTTPException(status_code=422, detail="Zona horaria inválida")
    for key, value in data.items():
        setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """
    Envía por correo un enlace para restablecer la contraseña.

    La respuesta es siempre la misma exista o no la cuenta: así no se puede
    averiguar qué correos están registrados, y el enlace nunca viaja en la respuesta.
    """
    generic_response = {"message": "Si el correo está registrado, te enviamos un enlace para restablecer la contraseña."}
    # Los límites cuentan igual exista o no la cuenta, así la respuesta no revela nada
    rate_limiter.hit_many(db, [
        ("forgot:ip", rate_limiter.client_ip(http_request), *FORGOT_IP_LIMIT),
        ("forgot:email", request.email, *FORGOT_EMAIL_LIMIT),
    ])
    try:
        user = db.query(models.User).filter(
            func.lower(models.User.email) == request.email
        ).first()

        if not user or not user.hashed_password:
            # Sin cuenta, o cuenta de Google/Microsoft (no tiene contraseña que restablecer)
            logger.info("Password reset requested for unknown or social-login account")
            return generic_response

        now = datetime.utcnow()
        # Un solo enlace vigente por persona: pedir otro invalida los anteriores
        db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.user_id == user.id,
            models.PasswordResetToken.used_at.is_(None),
        ).update({"used_at": now}, synchronize_session=False)
        reset_token = secrets.token_urlsafe(32)
        db.add(models.PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(reset_token),
            expires_at=now + timedelta(minutes=RESET_TOKEN_MINUTES),
        ))
        db.commit()
        reset_url = f"{primary_frontend_url()}/reset-password?token={reset_token}"
        send_password_reset_email(user.email, reset_url)
        logger.info(f"Password reset initiated for user: {user.username}")
        return generic_response

    except Exception as e:
        logger.error(f"Error during password reset request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al procesar la solicitud. Por favor, intentá de nuevo."
        )


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """Restablece la contraseña con un enlace de un solo uso y cierra todas las sesiones abiertas."""
    rate_limiter.hit(db, "reset:ip", rate_limiter.client_ip(http_request), *RESET_IP_LIMIT)
    invalid = HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token expirado o inválido")
    try:
        now = datetime.utcnow()
        record = db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.token_hash == _hash_token(request.token)
        ).first()
        if not record or record.used_at is not None or record.expires_at < now:
            logger.warning("Invalid, expired or already used reset password token")
            raise invalid

        # Consumo atómico: si dos peticiones llegan a la vez, solo una cambia una fila
        claimed = db.query(models.PasswordResetToken).filter(
            models.PasswordResetToken.id == record.id,
            models.PasswordResetToken.used_at.is_(None),
        ).update({"used_at": now}, synchronize_session=False)
        if claimed != 1:
            db.rollback()
            raise invalid

        user = db.query(models.User).filter(models.User.id == record.user_id).first()
        if not user:
            db.rollback()
            raise invalid

        user.hashed_password = hash_password(request.new_password)
        user.token_version = (user.token_version or 0) + 1  # revoca las sesiones anteriores
        db.commit()

        logger.info(f"Password reset successfully for user: {user.username}")
        return {"message": "Contraseña actualizada exitosamente"}

    except HTTPException:
        raise
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        logger.error(f"Error during password reset: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al restablecer la contraseña. Por favor, intentá de nuevo."
        )
