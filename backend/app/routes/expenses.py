from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, models, crud
from ..auth.utils import get_current_user
from datetime import date
from typing import Optional
from dateutil import parser as date_parser
import csv
import io
from openpyxl import Workbook

router = APIRouter(tags=["Expenses"])


@router.post("/", response_model=schemas.Expense)
def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.create_expense(db, expense, current_user.id)

@router.get("/", response_model=list[schemas.Expense])
def get_expenses(
    startDate: Optional[date] = Query(None),
    endDate: Optional[date] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.get_expenses(
        db, current_user.id,
        start_date=startDate, end_date=endDate, category=category,
    )

@router.put("/{expense_id}", response_model=schemas.Expense)
def update_expense(
    expense_id: int,
    expense_update: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_expense = crud.update_expense(db, expense_id, current_user.id, expense_update)
    if not db_expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    return db_expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not crud.delete_expense(db, expense_id, current_user.id):
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

@router.get("/summary", response_model=schemas.ExpenseSummary)
def get_expense_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expenses = crud.get_expenses(db, current_user.id)

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


_EXPORT_HEADERS = ["Fecha", "Descripción", "Categoría", "Monto"]


@router.get("/export/csv")
def export_expenses_csv(
    startDate: Optional[date] = Query(None),
    endDate: Optional[date] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expenses = crud.get_expenses(
        db, current_user.id,
        start_date=startDate, end_date=endDate, category=category,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(_EXPORT_HEADERS)
    for e in expenses:
        writer.writerow([e.date.isoformat(), e.description, e.category, e.amount])

    # BOM so Excel opens UTF-8 (accents) correctly.
    content = "﻿" + output.getvalue()
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=gastos.csv"},
    )


@router.get("/export/excel")
def export_expenses_excel(
    startDate: Optional[date] = Query(None),
    endDate: Optional[date] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    expenses = crud.get_expenses(
        db, current_user.id,
        start_date=startDate, end_date=endDate, category=category,
    )

    wb = Workbook()
    ws = wb.active
    ws.title = "Gastos"
    ws.append(_EXPORT_HEADERS)
    for e in expenses:
        ws.append([e.date.isoformat(), e.description, e.category, e.amount])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return Response(
        content=buffer.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=gastos.xlsx"},
    )


@router.post("/import/csv")
async def import_expenses_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Import expenses from a CSV file.

    Accepts the columns produced by the CSV export (Fecha, Descripción,
    Categoría, Monto) and is tolerant of common English/lowercase variants.
    """
    raw = await file.read()
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))

    def pick(row, *keys):
        for key in keys:
            for actual in row:
                if actual and actual.strip().lower() == key.lower():
                    return row[actual]
        return None

    imported = 0
    total_rows = 0
    errors = []

    for i, row in enumerate(reader, start=2):  # line 1 is the header
        total_rows += 1
        try:
            raw_date = pick(row, "Fecha", "Date", "fecha")
            description = pick(row, "Descripción", "Descripcion", "Description", "descripcion")
            category = pick(row, "Categoría", "Categoria", "Category", "categoria")
            raw_amount = pick(row, "Monto", "Amount", "monto")

            if not raw_amount or not description:
                raise ValueError("Faltan campos obligatorios (descripción o monto)")

            parsed_date = date_parser.parse(raw_date).date() if raw_date else date.today()
            amount = float(str(raw_amount).replace(",", "."))

            db.add(models.Expense(
                description=str(description).strip(),
                amount=amount,
                category=str(category).strip() if category else "Otros",
                date=parsed_date,
                user_id=current_user.id,
            ))
            imported += 1
        except Exception as ex:
            errors.append(f"Fila {i}: {ex}")

    if imported:
        db.commit()

    return {
        "imported": imported,
        "total_rows": total_rows,
        "error_count": len(errors),
        "errors": errors,
    }