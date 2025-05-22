from pydantic import BaseModel
from datetime import datetime

class ExpenseBase(BaseModel):
    description: str
    amount: float
    category: str
    date: datetime

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    
    class Config:
        orm_mode = True