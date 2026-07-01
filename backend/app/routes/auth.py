"""
Authentication routes module.
Handles user registration, login, password reset, and user info endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
import logging

from ..database import get_db
from .. import schemas, models
from ..auth.utils import hash_password, verify_password, create_access_token, get_current_user
from ..crud import get_user_by_username, get_user_by_email, create_user
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, Field, validator
import os

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Authentication"])

SECRET_KEY = os.getenv("SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


# Request/Response Schemas
class ForgotPasswordRequest(BaseModel):
    """Request schema for password reset."""
    email: str = Field(..., description="Email address for the account")

    @validator('email')
    def validate_email(cls, v):
        if not v or '@' not in v:
            raise ValueError('Invalid email address')
        return v


class ResetPasswordRequest(BaseModel):
    """Request schema for password reset confirmation."""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=6, description="New password (min 6 characters)")

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v


@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    Args:
        user: User creation data
        db: Database session

    Returns:
        User: The created user

    Raises:
        HTTPException: If user already exists or creation fails
    """
    try:
        # Check if user already exists
        existing_user = get_user_by_username(db, user.username)
        if existing_user:
            logger.warning(f"Registration attempt with existing username: {user.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está registrado"
            )

        existing_email = get_user_by_email(db, user.email)
        if existing_email:
            logger.warning(f"Registration attempt with existing email: {user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El correo electrónico ya está registrado"
            )

        # Create new user
        hashed = hash_password(user.password)
        db_user = create_user(db, user, hashed)

        logger.info(f"New user registered: {user.username}")
        return db_user

    except HTTPException:
        raise
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
    """
    Authenticate user and return access token.

    Args:
        form_data: OAuth2 password form with username and password
        db: Database session

    Returns:
        Token: Access token and token type

    Raises:
        HTTPException: If authentication fails
    """
    try:
        user = db.query(models.User).filter(
            models.User.username == form_data.username
        ).first()

        if not user:
            logger.warning(f"Login attempt with non-existent user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nombre de usuario o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.hashed_password:
            logger.warning(f"Login attempt for OAuth user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Esta cuenta usa inicio de sesión social. Usá Google, Microsoft o Apple para ingresar.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not verify_password(form_data.password, user.hashed_password):
            logger.warning(f"Failed login attempt for user: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nombre de usuario o contraseña incorrectos",
                headers={"WWW-Authenticate": "Bearer"},
            )

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
    """
    Get current authenticated user information.

    Args:
        current_user: The authenticated user (injected by dependency)

    Returns:
        User: Current user information
    """
    return current_user


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Initiate password reset process.

    Args:
        request: Forgot password request with email
        db: Database session

    Returns:
        dict: Message with reset URL (for development/testing)

    Raises:
        HTTPException: If user not found or account uses OAuth
    """
    try:
        user = db.query(models.User).filter(
            models.User.email == request.email
        ).first()

        if not user:
            logger.warning(f"Password reset requested for non-existent email: {request.email}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró una cuenta con ese email"
            )

        if not user.hashed_password:
            logger.warning(f"Password reset requested for OAuth user: {user.username}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esta cuenta usa inicio de sesión social. Usá Google, Microsoft o Apple para ingresar."
            )

        # Generate password reset token (15 min expiry)
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        reset_token = jwt.encode(
            {"sub": user.username, "purpose": "reset", "exp": expire},
            SECRET_KEY,
            algorithm="HS256"
        )
        reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"

        # In production, send this URL via email
        logger.info(f"Password reset initiated for user: {user.username}")

        return {
            "message": "Enlace de recuperación generado",
            "reset_url": reset_url  # Only for development - remove in production
        }

    except HTTPException:
        raise
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
    """
    Reset user password with valid token.

    Args:
        request: Reset password request with token and new password
        db: Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException: If token is invalid/expired or user not found
    """
    try:
        # Decode and verify token
        try:
            payload = jwt.decode(request.token, SECRET_KEY, algorithms=["HS256"])
            username = payload.get("sub")
            purpose = payload.get("purpose")

            if not username or purpose != "reset":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Token inválido"
                )
        except JWTError:
            logger.warning("Invalid or expired reset password token used")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token expirado o inválido"
            )

        # Find user
        user = db.query(models.User).filter(
            models.User.username == username
        ).first()

        if not user:
            logger.warning(f"Password reset for non-existent user: {username}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado"
            )

        # Update password
        user.hashed_password = hash_password(request.new_password)
        db.commit()

        logger.info(f"Password reset successfully for user: {username}")
        return {"message": "Contraseña actualizada exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error during password reset: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al restablecer la contraseña. Por favor, intentá de nuevo."
        )
