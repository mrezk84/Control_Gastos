from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum, DateTime, Boolean, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    supabase_id = Column(String(36), unique=True, index=True, nullable=True)  # Sin uso desde que se dejó Supabase
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    avatar_url = Column(String(500), nullable=True)
    auth_provider = Column(String(50), default="local")  # local, google, microsoft
    provider_id = Column(String(255), nullable=True)
    country = Column(String(2), nullable=True)       # ISO 3166-1 alfa-2; si falta, UY
    currency = Column(String(3), nullable=True)      # ISO 4217; si falta, UYU
    timezone = Column(String(64), nullable=True)     # IANA; si falta, America/Montevideo
    # Se incrementa al restablecer la contraseña: los tokens de sesión con otra versión dejan de valer
    token_version = Column(Integer, nullable=False, default=0, server_default="0")

    expenses = relationship("Expense", back_populates="owner")


class PasswordResetToken(Base):
    """Enlace de recuperación de un solo uso. Solo se guarda el hash SHA-256 del token."""
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    token_hash = Column(String(64), unique=True, index=True)
    expires_at = Column(DateTime)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class OAuthFlow(Base):
    """Una transacción de acceso social: state de un solo uso + código de canje de un solo uso.

    `challenge` es el SHA-256 del verificador que el navegador que inició el flujo guarda en su
    sessionStorage; solo ese navegador puede canjear el código por una sesión.
    """
    __tablename__ = "oauth_flows"

    id = Column(Integer, primary_key=True, index=True)
    state_hash = Column(String(64), unique=True, index=True)
    provider = Column(String(20))
    challenge = Column(String(64))
    provider_verifier = Column(String(128))  # PKCE con el proveedor (RFC 7636 / RFC 9700)
    expires_at = Column(DateTime)
    state_used_at = Column(DateTime, nullable=True)
    code_hash = Column(String(64), unique=True, index=True, nullable=True)
    code_expires_at = Column(DateTime, nullable=True)
    code_used_at = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    # Vinculación: el correo del proveedor ya tenía una cuenta con contraseña. El código de este flujo NO abre sesión;
    # solo permite vincular `link_subject` a la cuenta `link_user_id` si además se confirma su contraseña.
    link_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    link_subject = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class RateLimitHit(Base):
    """Un intento contado por el limitador; vive en la base para compartirse entre instancias."""
    __tablename__ = "rate_limit_hits"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String(255))
    amount = Column(Float)
    category = Column(String(100))
    date = Column(Date)
    user_id = Column(Integer, ForeignKey("users.id"))
    receipt_url = Column(String(500), nullable=True)
    receipt_confidence = Column(Float, nullable=True)  # Confidence score from OCR
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="expenses")
    receipts = relationship("ReceiptImage", back_populates="expense", cascade="all, delete-orphan")

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    category = Column(String(100))
    amount = Column(Float)
    month = Column(Integer)  # 1-12
    year = Column(Integer)
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ReceiptImage(Base):
    __tablename__ = "receipt_images"

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"))
    file_path = Column(String(500), nullable=True)  # Legado (disco local); los recibos nuevos viven en "content"
    file_name = Column(String(255))
    file_type = Column(String(50))  # 'image' or 'pdf'
    extracted_data = Column(String(2000), nullable=True)  # JSON string of extracted data
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    content = Column(LargeBinary, nullable=True)  # Archivo guardado en la base (el disco de Vercel es efímero)

    expense = relationship("Expense", back_populates="receipts")


class PaymentReminder(Base):
    __tablename__ = "payment_reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    description = Column(String(255))
    amount = Column(Float)
    category = Column(String(100), nullable=True)
    due_date = Column(Date)
    source = Column(String(10), default="manual")      # ocr | qr | manual
    status = Column(String(10), default="pending", index=True)  # pending | paid | dismissed
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=True)
    last_notified_kind = Column(String(20), nullable=True)
    last_notified_on = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    kind = Column(String(20))  # due_soon | due_today | overdue | payment_registered
    title = Column(String(255))
    body = Column(String(500))
    link = Column(String(255), nullable=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    endpoint = Column(String(1000), unique=True)
    p256dh = Column(String(255))
    auth = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
