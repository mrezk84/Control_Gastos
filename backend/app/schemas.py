from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, List

# --- Auth Schemas ---

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class User(BaseModel):
    id: int
    username: str
    email: str
    avatar_url: Optional[str] = None
    auth_provider: str = "local"

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    id: Optional[int] = None

# --- OAuth Schemas ---

class OAuthCallback(BaseModel):
    code: str
    state: Optional[str] = None

class OAuthUser(BaseModel):
    email: str
    name: str
    avatar_url: Optional[str] = None
    provider: str
    provider_id: str

# --- Expense Schemas ---

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str
    date: date
    receipt_url: Optional[str] = None

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[date] = None
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
    file_path: str
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