from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255), nullable=True)  # Nullable for OAuth users
    avatar_url = Column(String(500), nullable=True)
    auth_provider = Column(String(50), default="local")  # local, google, microsoft, apple
    provider_id = Column(String(255), nullable=True)

    expenses = relationship("Expense", back_populates="owner")

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
    file_path = Column(String(500))
    file_name = Column(String(255))
    file_type = Column(String(50))  # 'image' or 'pdf'
    extracted_data = Column(String(2000), nullable=True)  # JSON string of extracted data
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    expense = relationship("Expense", back_populates="receipts")