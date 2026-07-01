"""
Authentication utilities module.
Handles password hashing, JWT token creation, and user authentication.
"""

from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional
import os
from dotenv import load_dotenv
import logging

# Configure logging
logger = logging.getLogger(__name__)

load_dotenv()

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    logger.error("SECRET_KEY environment variable is not set")
    raise ValueError("SECRET_KEY must be set in environment variables")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRATION", "30"))

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
    if not password or len(password) < 6:
        raise ValueError("Password must be at least 6 characters long")

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


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(lambda: None)  # Will be overridden in actual usage
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
    from ..schemas import TokenData
    from ..database import get_db

    # Use proper dependency injection
    db = next(get_db())

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            logger.warning("Token payload missing 'sub' field")
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError as e:
        logger.warning(f"JWT decode error: {e}")
        raise credentials_exception

    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        logger.warning(f"User not found: {username}")
        raise credentials_exception

    logger.debug(f"Successfully authenticated user: {username}")
    return user


def authenticate_user(db: Session, username: str, password: str) -> Optional[object]:
    """
    Authenticate a user with username and password.

    Args:
        db: Database session
        username: The username to authenticate
        password: The plain text password to verify

    Returns:
        User object if authentication successful, None otherwise
    """
    try:
        from ..models import User

        user = db.query(User).filter(User.username == username).first()

        if not user:
            logger.warning(f"Authentication failed: User '{username}' not found")
            return None

        if not user.hashed_password:
            logger.warning(f"Authentication failed: User '{username}' has no password set (OAuth account)")
            return None

        if not verify_password(password, user.hashed_password):
            logger.warning(f"Authentication failed: Invalid password for user '{username}'")
            return None

        logger.info(f"User '{username}' authenticated successfully")
        return user

    except Exception as e:
        logger.error(f"Error during authentication for user '{username}': {e}")
        return None
