from pydantic import BaseModel, EmailStr
from datetime import date
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

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[date] = None

class Expense(BaseModel):
    id: int
    description: str
    amount: float
    category: str
    date: date
    user_id: int

    class Config:
        from_attributes = True

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