from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from ..database import get_db
from .. import schemas, models
from ..auth.utils import get_current_user
from datetime import date, timedelta

router = APIRouter(tags=["Expenses"])

@router.post("/", response_model=schemas.Expense)
def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_expense = models.Expense(**expense.model_dump(), user_id=current_user.id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.get("/", response_model=list[schemas.Expense])
def get_expenses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expenses = db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()
    return expenses

@router.put("/{expense_id}", response_model=schemas.Expense)
def update_expense(
    expense_id: int,
    expense_update: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    
    update_data = expense_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_expense, field, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    db.delete(db_expense)
    db.commit()

@router.get("/summary", response_model=schemas.ExpenseSummary)
def get_expense_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expenses = db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()
    
    if not expenses:
        return schemas.ExpenseSummary(
            total_expenses=0,
            average_expense=0,
            top_category=None,
            expense_count=0,
            categories=[],
            monthly_trends=[]
        )
    
    total = sum(e.amount for e in expenses)
    avg = total / len(expenses)
    
    # Category breakdown
    cat_data = {}
    for e in expenses:
        if e.category not in cat_data:
            cat_data[e.category] = {"total": 0, "count": 0}
        cat_data[e.category]["total"] += e.amount
        cat_data[e.category]["count"] += 1
    
    categories = [
        schemas.CategorySummary(category=cat, total=data["total"], count=data["count"])
        for cat, data in sorted(cat_data.items(), key=lambda x: x[1]["total"], reverse=True)
    ]
    top_category = categories[0].category if categories else None
    
    # Monthly trends (last 12 months)
    monthly_data = {}
    for e in expenses:
        month_key = e.date.strftime("%Y-%m")
        monthly_data[month_key] = monthly_data.get(month_key, 0) + e.amount
    
    monthly_trends = [
        schemas.MonthlyTrend(month=month, total=total)
        for month, total in sorted(monthly_data.items())
    ][-12:]
    
    return schemas.ExpenseSummary(
        total_expenses=total,
        average_expense=round(avg, 2),
        top_category=top_category,
        expense_count=len(expenses),
        categories=categories,
        monthly_trends=monthly_trends,
    )