from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date
from typing import Optional, List

# --- Validators ---

def validate_amount_max(value: Optional[float], max_value: float = 10000000) -> Optional[float]:
    """
    Reusable validator for amount fields.

    Args:
        value: The amount to validate
        max_value: Maximum allowed value

    Returns:
        The validated value or raises ValueError
    """
    if value is not None and value > max_value:
        raise ValueError(f'Monto excesivo, máximo {max_value:,}')
    return value

def validate_budget_amount(value: Optional[float]) -> Optional[float]:
    """Validator for budget amounts (higher limit)."""
    return validate_amount_max(value, max_value=100000000)

# --- Auth Schemas ---

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50, description="Nombre de usuario entre 3 y 50 caracteres")
    email: EmailStr
    password: str = Field(min_length=6, max_length=100, description="Contraseña mínimo 6 caracteres")

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
    description: str = Field(min_length=1, max_length=500, description="Descripción del gasto (1-500 caracteres)")
    amount: float = Field(gt=0, description="Monto debe ser positivo")
    category: str = Field(min_length=1, max_length=100, description="Categoría del gasto")
    date: date

    @field_validator('amount')
    @classmethod
    def amount_must_be_reasonable(cls, v):
        return validate_amount_max(v)

class ExpenseUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    date: Optional[date] = None

    @field_validator('amount')
    @classmethod
    def amount_must_be_reasonable(cls, v):
        return validate_amount_max(v)

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

# --- Budget Schemas ---

class BudgetCreate(BaseModel):
    category: str = Field(min_length=1, max_length=100, description="Categoría del presupuesto")
    amount: float = Field(gt=0, description="Monto del presupuesto debe ser positivo")
    month: int = Field(ge=1, le=12, description="Mes del año (1-12)")
    year: int = Field(ge=2000, le=2100, description="Año (2000-2100)")
    is_recurring: bool = False

    @field_validator('amount')
    @classmethod
    def amount_must_be_reasonable(cls, v):
        return validate_budget_amount(v)

class BudgetUpdate(BaseModel):
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0)
    month: Optional[int] = Field(None, ge=1, le=12)
    year: Optional[int] = Field(None, ge=2000, le=2100)
    is_recurring: Optional[bool] = None

    @field_validator('amount')
    @classmethod
    def amount_must_be_reasonable(cls, v):
        return validate_budget_amount(v)

class Budget(BaseModel):
    id: int
    user_id: int
    category: str
    amount: float
    month: int
    year: int
    is_recurring: bool

    class Config:
        from_attributes = True

class BudgetProgress(BaseModel):
    budget_id: int
    category: str
    budget_amount: float
    spent_amount: float
    remaining_amount: float
    percentage: float
    month: int
    year: int

class BudgetList(BaseModel):
    budgets: List[BudgetProgress]