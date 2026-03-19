"""
Budget routes for the expense tracker API.

Provides endpoints for managing budgets and tracking progress.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date

from ..database import get_db
from .. import schemas, models
from ..auth.utils import get_current_user
from .. import crud

router = APIRouter(tags=["Budgets"])


@router.post("/", response_model=schemas.Budget, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget: schemas.BudgetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new budget for a specific category and period."""
    return crud.create_budget(db, budget, current_user.id)


@router.get("/", response_model=list[schemas.Budget])
def get_budgets(
    month: int = None,
    year: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all budgets, optionally filtered by month and year."""
    return crud.get_budgets(db, current_user.id, month, year)


@router.get("/{budget_id}", response_model=schemas.Budget)
def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific budget by ID."""
    budget = crud.get_budget_by_id(db, budget_id, current_user.id)
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presupuesto no encontrado"
        )
    return budget


@router.put("/{budget_id}", response_model=schemas.Budget)
def update_budget(
    budget_id: int,
    budget_update: schemas.BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an existing budget."""
    budget = crud.update_budget(db, budget_id, current_user.id, budget_update)
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presupuesto no encontrado"
        )
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a budget."""
    deleted = crud.delete_budget(db, budget_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presupuesto no encontrado"
        )


@router.get("/progress/current", response_model=schemas.BudgetList)
def get_budgets_progress(
    month: int = None,
    year: int = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get budget progress including spent amounts and remaining budget.

    Uses optimized query to avoid N+1 problem.
    """
    # Default to current month/year if not provided
    if month is None:
        month = date.today().month
    if year is None:
        year = date.today().year

    budgets = crud.get_budgets_progress(db, current_user.id, month, year)

    return schemas.BudgetList(budgets=budgets)
