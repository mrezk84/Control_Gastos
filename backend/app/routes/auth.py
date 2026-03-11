from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, models
from ..auth.utils import hash_password, verify_password, create_access_token, get_current_user
from pydantic import BaseModel
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
import os

router = APIRouter(tags=["Authentication"])

SECRET_KEY = os.getenv("SECRET_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

@router.post("/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Verificar si el usuario ya existe
    existing_user = db.query(models.User).filter(
        (models.User.email == user.email) | (models.User.username == user.username)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario o correo ya está registrado"
        )
    # Crear nuevo usuario
    hashed = hash_password(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed,
        auth_provider="local"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not user.hashed_password or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nombre de usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    return current_user


# --- Password Reset ---

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No se encontró una cuenta con ese email")
    if not user.hashed_password:
        raise HTTPException(
            status_code=400,
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
    # In production, you would send this URL via email
    return {"message": "Enlace de recuperación generado", "reset_url": reset_url}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=["HS256"])
        username = payload.get("sub")
        purpose = payload.get("purpose")
        if not username or purpose != "reset":
            raise HTTPException(status_code=400, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=400, detail="Token expirado o inválido")

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.hashed_password = hash_password(request.new_password)
    db.commit()
    return {"message": "Contraseña actualizada exitosamente"}