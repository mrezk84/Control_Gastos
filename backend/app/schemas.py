from pydantic import BaseModel
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    
    class Config:
        from_attributes = True  # Cambiado de orm_mode a from_attributes

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class ExpenseBase(BaseModel):
    description: str
    amount: float
    category: str
    date: datetime

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    user_id: int
    
    class Config:
        from_attributes = True  # Cambiado de orm_mode a from_attributes