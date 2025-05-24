from pydantic import BaseModel
from datetime import date
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class User(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    id: Optional[int] = None

class ExpenseCreate(BaseModel):
    description: str
    amount: float
    category: str
    date: date

class Expense(BaseModel):
    id: int
    description: str
    amount: float
    category: str
    date: date
    user_id: int

    class Config:
        from_attributes = True