"""
CRUD operations for database models.

This module provides a centralized layer for database operations,
promoting code reuse and consistency across the application.
"""

from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional, Type, TypeVar, Generic
from fastapi import HTTPException, status

from app import models, schemas

ModelType = TypeVar("ModelType", bound=models.Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=schemas.BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=schemas.BaseModel)


# ============== USER OPERATIONS ==============

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Get user by email address."""
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    """Get user by ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """Get user by username."""
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(db: Session, user: schemas.UserCreate, hashed_password: str) -> models.User:
    """Create a new user."""
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_oauth_user(db: Session, user: schemas.OAuthUser) -> models.User:
    """Create a new user via OAuth."""
    db_user = models.User(
        username=user.email.split('@')[0],  # Use email prefix as username
        email=user.email,
        avatar_url=user.avatar_url,
        auth_provider=user.provider,
        oauth_id=user.provider_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ============== EXPENSE OPERATIONS ==============

def get_expenses(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[models.Expense]:
    """Get expenses with optional filters."""
    query = db.query(models.Expense).filter(models.Expense.user_id == user_id)

    if category:
        query = query.filter(models.Expense.category == category)
    if start_date:
        query = query.filter(models.Expense.date >= start_date)
    if end_date:
        query = query.filter(models.Expense.date <= end_date)

    return query.order_by(models.Expense.date.desc()).offset(skip).limit(limit).all()


def get_expenses_paginated(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> tuple[List[models.Expense], int]:
    """
    Get expenses with optional filters and total count for pagination.

    Returns:
        Tuple of (expenses list, total count)
    """
    query = db.query(models.Expense).filter(models.Expense.user_id == user_id)

    if category:
        query = query.filter(models.Expense.category == category)
    if start_date:
        query = query.filter(models.Expense.date >= start_date)
    if end_date:
        query = query.filter(models.Expense.date <= end_date)

    # Get total count before pagination
    total = query.count()

    # Get paginated results
    expenses = query.order_by(models.Expense.date.desc()).offset(skip).limit(limit).all()

    return expenses, total


def get_expense_by_id(db: Session, expense_id: int, user_id: int) -> Optional[models.Expense]:
    """Get a single expense by ID."""
    return db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == user_id
    ).first()


def create_expense(db: Session, expense: schemas.ExpenseCreate, user_id: int) -> models.Expense:
    """Create a new expense."""
    db_expense = models.Expense(**expense.model_dump(), user_id=user_id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


def update_expense(
    db: Session,
    expense_id: int,
    user_id: int,
    expense_update: schemas.ExpenseUpdate
) -> Optional[models.Expense]:
    """Update an existing expense."""
    db_expense = get_expense_by_id(db, expense_id, user_id)
    if not db_expense:
        return None

    update_data = expense_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_expense, field, value)

    db.commit()
    db.refresh(db_expense)
    return db_expense


def delete_expense(db: Session, expense_id: int, user_id: int) -> bool:
    """Delete an expense. Returns True if deleted, False if not found."""
    db_expense = get_expense_by_id(db, expense_id, user_id)
    if not db_expense:
        return False

    db.delete(db_expense)
    db.commit()
    return True


def get_expense_summary(db: Session, user_id: int) -> schemas.ExpenseSummary:
    """Get expense summary with category breakdown and monthly trends."""
    expenses = get_expenses(db, user_id, limit=10000)  # Get all for summary

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


# ============== BUDGET OPERATIONS ==============

def get_budgets(
    db: Session,
    user_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None
) -> List[models.Budget]:
    """Get budgets with optional filters."""
    query = db.query(models.Budget).filter(models.Budget.user_id == user_id)

    if month is not None:
        query = query.filter(models.Budget.month == month)
    if year is not None:
        query = query.filter(models.Budget.year == year)

    return query.order_by(models.Budget.year.desc(), models.Budget.month.desc()).all()


def get_budget_by_id(db: Session, budget_id: int, user_id: int) -> Optional[models.Budget]:
    """Get a single budget by ID."""
    return db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == user_id
    ).first()


def create_budget(db: Session, budget: schemas.BudgetCreate, user_id: int) -> models.Budget:
    """Create a new budget."""
    # Check for duplicate
    existing = db.query(models.Budget).filter(
        models.Budget.user_id == user_id,
        models.Budget.category == budget.category,
        models.Budget.month == budget.month,
        models.Budget.year == budget.year
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un presupuesto para esta categoría en el período seleccionado"
        )

    db_budget = models.Budget(**budget.model_dump(), user_id=user_id)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget


def update_budget(
    db: Session,
    budget_id: int,
    user_id: int,
    budget_update: schemas.BudgetUpdate
) -> Optional[models.Budget]:
    """Update an existing budget."""
    db_budget = get_budget_by_id(db, budget_id, user_id)
    if not db_budget:
        return None

    update_data = budget_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_budget, field, value)

    db.commit()
    db.refresh(db_budget)
    return db_budget


def delete_budget(db: Session, budget_id: int, user_id: int) -> bool:
    """Delete a budget. Returns True if deleted, False if not found."""
    db_budget = get_budget_by_id(db, budget_id, user_id)
    if not db_budget:
        return False

    db.delete(db_budget)
    db.commit()
    return True


def get_budgets_progress(
    db: Session,
    user_id: int,
    month: int,
    year: int
) -> List[schemas.BudgetProgress]:
    """
    Get budget progress with spent amounts using a single optimized query.
    This fixes the N+1 query problem.
    """
    # Single query with JOIN to get spent amounts
    results = db.query(
        models.Budget.id.label('budget_id'),
        models.Budget.category,
        models.Budget.amount.label('budget_amount'),
        func.coalesce(func.sum(models.Expense.amount), 0).label('spent_amount')
    ).outerjoin(
        models.Expense,
        (models.Expense.user_id == models.Budget.user_id) &
        (models.Expense.category == models.Budget.category) &
        (extract('month', models.Expense.date) == month) &
        (extract('year', models.Expense.date) == year)
    ).filter(
        models.Budget.user_id == user_id,
        models.Budget.month == month,
        models.Budget.year == year
    ).group_by(
        models.Budget.id,
        models.Budget.category,
        models.Budget.amount
    ).all()

    progress_list = []
    for row in results:
        spent = float(row.spent_amount)
        remaining = row.budget_amount - spent
        percentage = (spent / row.budget_amount * 100) if row.budget_amount > 0 else 0

        progress_list.append(schemas.BudgetProgress(
            budget_id=row.budget_id,
            category=row.category,
            budget_amount=row.budget_amount,
            spent_amount=round(spent, 2),
            remaining_amount=round(remaining, 2),
            percentage=round(percentage, 1),
            month=month,
            year=year
        ))

    return progress_list
