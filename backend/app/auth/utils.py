"""
Authentication utilities module.
Handles password hashing, JWT token creation, and user authentication.
"""

from datetime import datetime, timedelta, timezone
import jwt
from jwt import PyJWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
import os
from dotenv import load_dotenv
import logging

from ..database import get_db

# Configure logging
logger = logging.getLogger(__name__)

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    logger.error("SECRET_KEY environment variable is not set")
    raise ValueError("SECRET_KEY must be set in environment variables")

if len(SECRET_KEY) < 32:
    logger.warning("SECRET_KEY tiene menos de 32 caracteres; usa uno aleatorio más largo (openssl rand -hex 32)")

ALGORITHM = "HS256"
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRATION", str(60 * 24)))

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.

    Args:
        plain_password: The plain text password to verify
        hashed_password: The hashed password to compare against

    Returns:
        bool: True if passwords match, False otherwise
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return False


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: The plain text password to hash

    Returns:
        str: The hashed password

    Raises:
        ValueError: If password is empty or too short
    """
    if not password or len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"La contraseña debe tener al menos {MIN_PASSWORD_LENGTH} caracteres")

    try:
        return pwd_context.hash(password)
    except Exception as e:
        logger.error(f"Error hashing password: {e}")
        raise


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: The payload data to encode in the token
        expires_delta: Optional custom expiration time delta

    Returns:
        str: The encoded JWT token

    Raises:
        ValueError: If token creation fails
    """
    try:
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + (
            expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        logger.debug(f"Created access token for user: {data.get('sub', 'unknown')}")
        return encoded_jwt
    except Exception as e:
        logger.error(f"Error creating access token: {e}")
        raise ValueError("Failed to create access token")


def issue_session_token(user) -> str:
    """Token de sesión de `user`, con su versión de sesión (`tv`) para poder revocarlo en bloque."""
    return create_access_token(data={"sub": user.username, "tv": user.token_version or 0})


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Get the current authenticated user from JWT token.

    Args:
        token: The JWT token from the request
        db: Database session (injected by FastAPI)

    Returns:
        User: The authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    from ..models import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except PyJWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise credentials_exception

    username: Optional[str] = payload.get("sub")
    if username is None:
        logger.warning("Token payload missing 'sub' field")
        raise credentials_exception

    # Los tokens con "purpose" (p. ej. recuperación de contraseña) no sirven como sesión
    if payload.get("purpose"):
        logger.warning("Token with purpose used as access token")
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        logger.warning(f"User not found: {username}")
        raise credentials_exception

    # Restablecer la contraseña sube token_version: las sesiones anteriores quedan revocadas
    if int(payload.get("tv", 0)) != (user.token_version or 0):
        logger.warning(f"Revoked session token used for user: {username}")
        raise credentials_exception

    return user
