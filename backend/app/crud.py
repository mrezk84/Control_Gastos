"""
CRUD operations module.
Handles database operations for users and expenses.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date
import logging

from app import models, schemas

logger = logging.getLogger(__name__)


def create_user(db: Session, user: schemas.UserCreate, hashed_password: str) -> Optional[models.User]:
    """
    Create a new user in the database.

    Args:
        db: Database session
        user: User creation schema
        hashed_password: The hashed password for the user

    Returns:
        User: The created user object

    Raises:
        Exception: If database operation fails
    """
    try:
        db_user = models.User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"Created new user: {user.username}")
        return db_user
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating user '{user.username}': {e}")
        raise


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """
    Get a user by username.

    Args:
        db: Database session
        username: The username to search for

    Returns:
        User object if found, None otherwise
    """
    try:
        return db.query(models.User).filter(models.User.username == username).first()
    except Exception as e:
        logger.error(f"Error fetching user '{username}': {e}")
        return None


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """
    Get a user by email.

    Args:
        db: Database session
        email: The email to search for

    Returns:
        User object if found, None otherwise
    """
    try:
        return db.query(models.User).filter(models.User.email == email).first()
    except Exception as e:
        logger.error(f"Error fetching user by email '{email}': {e}")
        return None


def create_expense(
    db: Session,
    expense: schemas.ExpenseCreate,
    user_id: int
) -> Optional[models.Expense]:
    """
    Create a new expense for a user.

    Args:
        db: Database session
        expense: Expense creation schema
        user_id: The ID of the user creating the expense

    Returns:
        Expense: The created expense object

    Raises:
        Exception: If database operation fails
    """
    try:
        db_expense = models.Expense(**expense.model_dump(), user_id=user_id)
        db.add(db_expense)
        db.commit()
        db.refresh(db_expense)
        logger.info(f"Created expense for user_id {user_id}: {expense.amount}")
        return db_expense
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating expense for user_id {user_id}: {e}")
        raise


def get_expenses(
    db: Session,
    user_id: int,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    limit: Optional[int] = None,
) -> List[models.Expense]:
    """
    Get expenses for a user, newest first, with optional date/category filters.

    Args:
        db: Database session
        user_id: The ID of the user
        start_date: Only expenses on/after this date
        end_date: Only expenses on/before this date
        category: Only expenses in this category
        limit: Optional limit on number of results

    Returns:
        List of Expense objects ordered by date descending
    """
    try:
        query = db.query(models.Expense).filter(models.Expense.user_id == user_id)
        if start_date:
            query = query.filter(models.Expense.date >= start_date)
        if end_date:
            query = query.filter(models.Expense.date <= end_date)
        if category:
            query = query.filter(models.Expense.category == category)
        query = query.order_by(models.Expense.date.desc())
        if limit:
            query = query.limit(limit)
        expenses = query.all()
        logger.debug(f"Fetched {len(expenses)} expenses for user_id {user_id}")
        return expenses
    except Exception as e:
        logger.error(f"Error fetching expenses for user_id {user_id}: {e}")
        return []


def get_expense_by_id(db: Session, expense_id: int, user_id: int) -> Optional[models.Expense]:
    """
    Get a specific expense by ID for a user.

    Args:
        db: Database session
        expense_id: The ID of the expense
        user_id: The ID of the user (for authorization)

    Returns:
        Expense object if found and belongs to user, None otherwise
    """
    try:
        return db.query(models.Expense).filter(
            models.Expense.id == expense_id,
            models.Expense.user_id == user_id
        ).first()
    except Exception as e:
        logger.error(f"Error fetching expense {expense_id} for user_id {user_id}: {e}")
        return None


def update_expense(
    db: Session,
    expense_id: int,
    user_id: int,
    expense_update: schemas.ExpenseUpdate
) -> Optional[models.Expense]:
    """
    Update an existing expense (partial: only provided fields are changed).

    Args:
        db: Database session
        expense_id: The ID of the expense to update
        user_id: The ID of the user (for authorization)
        expense_update: The fields to update

    Returns:
        Updated Expense object if found, None otherwise

    Raises:
        Exception: If database operation fails
    """
    try:
        db_expense = get_expense_by_id(db, expense_id, user_id)
        if not db_expense:
            return None

        for key, value in expense_update.model_dump(exclude_unset=True).items():
            setattr(db_expense, key, value)

        db.commit()
        db.refresh(db_expense)
        logger.info(f"Updated expense {expense_id} for user_id {user_id}")
        return db_expense
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating expense {expense_id} for user_id {user_id}: {e}")
        raise


def delete_expense(db: Session, expense_id: int, user_id: int) -> bool:
    """
    Delete an expense.

    Args:
        db: Database session
        expense_id: The ID of the expense to delete
        user_id: The ID of the user (for authorization)

    Returns:
        bool: True if deleted, False if not found
    """
    try:
        db_expense = get_expense_by_id(db, expense_id, user_id)
        if not db_expense:
            return False

        db.delete(db_expense)
        db.commit()
        logger.info(f"Deleted expense {expense_id} for user_id {user_id}")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting expense {expense_id} for user_id {user_id}: {e}")
        return False


# --- Budget CRUD ---

def create_budget(db: Session, budget: schemas.BudgetCreate, user_id: int) -> models.Budget:
    """Create a new budget for a user."""
    try:
        db_budget = models.Budget(**budget.model_dump(), user_id=user_id)
        db.add(db_budget)
        db.commit()
        db.refresh(db_budget)
        logger.info(f"Created budget for user_id {user_id}: {budget.category}")
        return db_budget
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating budget for user_id {user_id}: {e}")
        raise


def get_budgets(
    db: Session,
    user_id: int,
    month: Optional[int] = None,
    year: Optional[int] = None,
) -> List[models.Budget]:
    """Get all budgets for a user, optionally filtered by month/year."""
    query = db.query(models.Budget).filter(models.Budget.user_id == user_id)
    if month is not None:
        query = query.filter(models.Budget.month == month)
    if year is not None:
        query = query.filter(models.Budget.year == year)
    return query.all()


def get_budget_by_id(db: Session, budget_id: int, user_id: int) -> Optional[models.Budget]:
    """Get a specific budget by ID for a user."""
    return db.query(models.Budget).filter(
        models.Budget.id == budget_id,
        models.Budget.user_id == user_id,
    ).first()


def update_budget(
    db: Session,
    budget_id: int,
    user_id: int,
    budget_update: schemas.BudgetUpdate,
) -> Optional[models.Budget]:
    """Update an existing budget."""
    try:
        db_budget = get_budget_by_id(db, budget_id, user_id)
        if not db_budget:
            return None
        for key, value in budget_update.model_dump(exclude_unset=True).items():
            setattr(db_budget, key, value)
        db.commit()
        db.refresh(db_budget)
        logger.info(f"Updated budget {budget_id} for user_id {user_id}")
        return db_budget
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating budget {budget_id} for user_id {user_id}: {e}")
        raise


def delete_budget(db: Session, budget_id: int, user_id: int) -> bool:
    """Delete a budget."""
    try:
        db_budget = get_budget_by_id(db, budget_id, user_id)
        if not db_budget:
            return False
        db.delete(db_budget)
        db.commit()
        logger.info(f"Deleted budget {budget_id} for user_id {user_id}")
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting budget {budget_id} for user_id {user_id}: {e}")
        return False


def get_budgets_progress(
    db: Session,
    user_id: int,
    month: int,
    year: int,
) -> List[schemas.BudgetProgress]:
    """
    Get budgets with spent/remaining/percentage for a given month/year.

    Uses a single aggregate query over expenses to avoid N+1.
    """
    budgets = db.query(models.Budget).filter(
        models.Budget.user_id == user_id,
        models.Budget.month == month,
        models.Budget.year == year,
    ).all()

    # Aggregate spending by category for the period in one query.
    spent_rows = db.query(
        models.Expense.category,
        func.coalesce(func.sum(models.Expense.amount), 0),
    ).filter(
        models.Expense.user_id == user_id,
        extract("month", models.Expense.date) == month,
        extract("year", models.Expense.date) == year,
    ).group_by(models.Expense.category).all()

    spent_map = {category: float(total) for category, total in spent_rows}

    progress = []
    for b in budgets:
        spent = spent_map.get(b.category, 0.0)
        remaining = b.amount - spent
        percentage = (spent / b.amount * 100) if b.amount > 0 else 0.0
        progress.append(schemas.BudgetProgress(
            budget_id=b.id,
            category=b.category,
            budget_amount=b.amount,
            spent_amount=spent,
            remaining_amount=remaining,
            percentage=percentage,
        ))
    return progress
