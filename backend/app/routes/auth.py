"""
Authentication routes module.
Handles user registration, login, password reset, and user info endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
import logging

from ..database import get_db
from .. import schemas, models
from ..auth.utils import hash_password, verify_password, create_access_token, get_current_user, SECRET_KEY
from ..crud import get_user_by_username, create_user
from ..services.email_service import send_password_reset_email
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field, field_validator
import os

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Authentication"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


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
    new_password: str = Field(..., min_length=6, description="New password (min 6 characters)")


@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
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
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Authenticate user and return access token."""
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

        access_token = create_access_token(data={"sub": user.username})
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


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Envía por correo un enlace para restablecer la contraseña.

    La respuesta es siempre la misma exista o no la cuenta: así no se puede
    averiguar qué correos están registrados, y el enlace nunca viaja en la respuesta.
    """
    generic_response = {"message": "Si el correo está registrado, te enviamos un enlace para restablecer la contraseña."}
    try:
        user = db.query(models.User).filter(
            func.lower(models.User.email) == request.email
        ).first()

        if not user or not user.hashed_password:
            # Sin cuenta, o cuenta de Google/Microsoft (no tiene contraseña que restablecer)
            logger.info("Password reset requested for unknown or social-login account")
            return generic_response

        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        reset_token = jwt.encode(
            {"sub": user.username, "purpose": "reset", "exp": expire},
            SECRET_KEY,
            algorithm="HS256"
        )
        reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
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
    db: Session = Depends(get_db)
):
    """Reset user password with a valid reset token."""
    try:
        try:
            payload = jwt.decode(request.token, SECRET_KEY, algorithms=["HS256"])
        except JWTError:
            logger.warning("Invalid or expired reset password token used")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token expirado o inválido"
            )

        username = payload.get("sub")
        if not username or payload.get("purpose") != "reset":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token inválido")

        user = db.query(models.User).filter(models.User.username == username).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        user.hashed_password = hash_password(request.new_password)
        db.commit()

        logger.info(f"Password reset successfully for user: {username}")
        return {"message": "Contraseña actualizada exitosamente"}

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        logger.error(f"Error during password reset: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al restablecer la contraseña. Por favor, intentá de nuevo."
        )
