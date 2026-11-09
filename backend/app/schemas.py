from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
import datetime as dt  # alias: un campo llamado "date" sombrea el tipo "date" dentro de la clase
from typing import Optional, List

# --- Auth Schemas ---

class UserCreate(BaseModel):
    username: str = Field(..., max_length=150)
    email: str = Field(..., max_length=255)
    password: str = Field(..., max_length=128)  # el mínimo lo valida hash_password (400 con mensaje)

class User(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: Optional[str] = None
    auth_provider: Optional[str] = "local"
    country: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    country: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Expense Schemas ---

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str
    date: date
    receipt_url: Optional[str] = None
    from_scan: bool = False  # gasto creado desde un escaneo: genera la notificación "Pago registrado"

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[dt.date] = None
    receipt_url: Optional[str] = None

class Expense(BaseModel):
    id: int
    description: str
    amount: float
    category: str
    date: date
    user_id: int
    receipt_url: Optional[str] = None
    receipt_confidence: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Budget Schemas ---

class BudgetCreate(BaseModel):
    category: str
    amount: float
    month: int
    year: int
    is_recurring: bool = False

class BudgetUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = None
    month: Optional[int] = None
    year: Optional[int] = None
    is_recurring: Optional[bool] = None

class Budget(BaseModel):
    id: int
    user_id: int
    category: str
    amount: float
    month: int
    year: int
    is_recurring: bool = False

    class Config:
        from_attributes = True

class BudgetProgress(BaseModel):
    budget_id: int
    category: str
    budget_amount: float
    spent_amount: float
    remaining_amount: float
    percentage: float

class BudgetList(BaseModel):
    budgets: List[BudgetProgress]

# --- Receipt Schemas ---

class ReceiptImageCreate(BaseModel):
    expense_id: int
    file_name: str
    file_type: str

class ReceiptImage(BaseModel):
    id: int
    expense_id: int
    file_path: Optional[str] = None
    file_name: str
    file_type: str
    extracted_data: Optional[str] = None
    uploaded_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReceiptScanResult(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None
    confidence: Optional[float] = None

class OCRExtractedData(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    merchant: Optional[str] = None
    raw_text: Optional[str] = None

class QRScanRequest(BaseModel):
    text: str

# --- Reminder / Notification Schemas ---

class ReminderCreate(BaseModel):
    description: str
    amount: float
    category: Optional[str] = None
    due_date: dt.date
    source: str = "manual"  # ocr | qr | manual

class ReminderUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    due_date: Optional[dt.date] = None
    status: Optional[str] = None  # pending | dismissed

class Reminder(BaseModel):
    id: int
    description: str
    amount: float
    category: Optional[str] = None
    due_date: dt.date
    source: str
    status: str
    expense_id: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Notification(BaseModel):
    id: int
    kind: str
    title: str
    body: str
    link: Optional[str] = None
    read_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationList(BaseModel):
    unread_count: int
    notifications: List[Notification]

# --- Dashboard Schemas ---

class CategorySummary(BaseModel):
    category: str
    total: float
    count: int

class MonthlyTrend(BaseModel):
    month: str
    total: float

class ExpenseSummary(BaseModel):
    total_expenses: float
    average_expense: float
    top_category: Optional[str] = None
    expense_count: int
    categories: List[CategorySummary]
    monthly_trends: List[MonthlyTrend]