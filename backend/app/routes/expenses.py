"""
Expense routes for the expense tracker API.

Provides endpoints for CRUD operations on expenses,
summary statistics, and export functionality.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Optional
import csv
from io import StringIO, BytesIO
from fastapi import UploadFile, File

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    EXCEL_AVAILABLE = True
except ImportError:
    EXCEL_AVAILABLE = False

from ..database import get_db
from .. import schemas, models
from ..auth.utils import get_current_user
from .. import crud
from ..pagination import PaginatedResponse, PaginationParams, paginate

router = APIRouter(tags=["Expenses"])


@router.post("/", response_model=schemas.Expense, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new expense."""
    return crud.create_expense(db, expense, current_user.id)


@router.get("/", response_model=PaginatedResponse[schemas.Expense])
def get_expenses(
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    start_date: Optional[date] = Query(None, description="Fecha inicial (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Fecha final (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="Número de página"),
    page_size: int = Query(20, ge=1, le=100, description="Elementos por página"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all expenses with optional filters and pagination."""
    params = PaginationParams(page=page, page_size=page_size)

    expenses, total = crud.get_expenses_paginated(
        db,
        current_user.id,
        skip=params.offset,
        limit=params.limit,
        category=category,
        start_date=start_date,
        end_date=end_date
    )

    return paginate(expenses, total, params)


@router.get("/all", response_model=list[schemas.Expense])
def get_all_expenses(
    category: Optional[str] = Query(None, description="Filtrar por categoría"),
    start_date: Optional[date] = Query(None, description="Fecha inicial (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Fecha final (YYYY-MM-DD)"),
    limit: int = Query(1000, ge=1, le=5000, description="Límite de gastos a retornar"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all expenses without pagination (for dashboard and analytics)."""
    return crud.get_expenses(
        db,
        current_user.id,
        skip=0,
        limit=limit,
        category=category,
        start_date=start_date,
        end_date=end_date
    )


@router.put("/{expense_id}", response_model=schemas.Expense)
def update_expense(
    expense_id: int,
    expense_update: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an existing expense."""
    expense = crud.update_expense(db, expense_id, current_user.id, expense_update)
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gasto no encontrado"
        )
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete an expense."""
    deleted = crud.delete_expense(db, expense_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Gasto no encontrado"
        )


@router.get("/summary", response_model=schemas.ExpenseSummary)
def get_expense_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get expense summary with category breakdown and monthly trends."""
    return crud.get_expense_summary(db, current_user.id)


@router.get("/export/csv")
def export_expenses_csv(
    start_date: date = None,
    end_date: date = None,
    category: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Export expenses to CSV format."""
    expenses = crud.get_expenses(
        db, current_user.id, category=category, start_date=start_date, end_date=end_date, limit=10000
    )

    # Create CSV
    output = StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow(['Fecha', 'Descripción', 'Categoría', 'Monto'])

    # Rows
    for expense in expenses:
        writer.writerow([
            expense.date.strftime('%d/%m/%Y'),
            expense.description,
            expense.category,
            f"{expense.amount:.2f}"
        ])

    # Generate filename
    filename = f"gastos_{date.today().strftime('%Y%m%d')}.csv"

    return Response(
        content=output.getvalue(),
        media_type='text/csv',
        headers={
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
    )


@router.get("/export/excel")
def export_expenses_excel(
    start_date: date = None,
    end_date: date = None,
    category: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Export expenses to Excel format with professional styling."""
    if not EXCEL_AVAILABLE:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Exportación a Excel no disponible. Instala openpyxl: pip install openpyxl"
        )

    expenses = crud.get_expenses(
        db, current_user.id, category=category, start_date=start_date, end_date=end_date, limit=10000
    )

    # Create Excel workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Gastos"

    # Define styles
    header_font = Font(bold=True, color="FFFFFF", size=12)
    header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
    header_alignment = Alignment(horizontal="center", vertical="center")
    cell_alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    currency_alignment = Alignment(horizontal="right", vertical="center")

    border_thin = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )

    # Column widths
    ws.column_dimensions['A'].width = 15  # Fecha
    ws.column_dimensions['B'].width = 40  # Descripción
    ws.column_dimensions['C'].width = 20  # Categoría
    ws.column_dimensions['D'].width = 15  # Monto

    # Header row
    headers = ['Fecha', 'Descripción', 'Categoría', 'Monto']
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col)
        cell.value = header
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = header_alignment
        cell.border = border_thin

    # Data rows
    row_num = 2
    for expense in expenses:
        ws.cell(row=row_num, column=1).value = expense.date.strftime('%d/%m/%Y')
        ws.cell(row=row_num, column=1).alignment = cell_alignment
        ws.cell(row=row_num, column=1).border = border_thin

        ws.cell(row=row_num, column=2).value = expense.description
        ws.cell(row=row_num, column=2).alignment = cell_alignment
        ws.cell(row=row_num, column=2).border = border_thin

        ws.cell(row=row_num, column=3).value = expense.category
        ws.cell(row=row_num, column=3).alignment = cell_alignment
        ws.cell(row=row_num, column=3).border = border_thin

        cell_amount = ws.cell(row=row_num, column=4)
        cell_amount.value = float(expense.amount)
        cell_amount.alignment = currency_alignment
        cell_amount.border = border_thin
        cell_amount.number_format = '#,##0.00'

        row_num += 1

    # Total row
    if expenses:
        total_row = row_num
        ws.cell(row=total_row, column=3).value = "TOTAL"
        ws.cell(row=total_row, column=3).font = Font(bold=True)
        ws.cell(row=total_row, column=3).alignment = Alignment(horizontal="right", vertical="center")
        ws.cell(row=total_row, column=3).border = border_thin

        cell_total = ws.cell(row=total_row, column=4)
        cell_total.value = f"=SUM(D2:D{total_row-1})"
        cell_total.font = Font(bold=True, color="4F46E5")
        cell_total.alignment = currency_alignment
        cell_total.border = border_thin
        cell_total.number_format = '#,##0.00'

        # Fill for total row
        for col in range(1, 5):
            ws.cell(row=total_row, column=col).fill = PatternFill(
                start_color="E0E7FF",
                end_color="E0E7FF",
                fill_type="solid"
            )

    # Freeze header row
    ws.freeze_panes = 'A2'

    # Save to memory
    output = BytesIO()
    wb.save(output)
    output.seek(0)

    # Generate filename
    filename = f"gastos_{date.today().strftime('%Y%m%d')}.xlsx"

    return Response(
        content=output.getvalue(),
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
    )


@router.post("/import/csv", response_model=dict)
def import_expenses_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Import expenses from CSV file.

    Expected CSV format:
    Fecha,Descripción,Categoría,Monto
    DD/MM/YYYY,Descripción,Categoría,100.50

    Returns summary of imported expenses and any errors.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe ser un CSV"
        )

    try:
        # Read CSV content
        content = file.file.read().decode('utf-8')
        csv_reader = csv.reader(StringIO(content))

        # Skip header row
        headers = next(csv_reader, None)
        if not headers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo CSV está vacío"
            )

        # Expected columns: Fecha, Descripción, Categoría, Monto
        # Try to detect column positions by name
        col_mapping = {}
        for i, header in enumerate(headers):
            header_lower = header.lower().strip()
            if 'fecha' in header_lower or 'date' in header_lower:
                col_mapping['date'] = i
            elif 'descri' in header_lower or 'desc' in header_lower:
                col_mapping['description'] = i
            elif 'categ' in header_lower or 'cat' in header_lower:
                col_mapping['category'] = i
            elif 'monto' in header_lower or 'amount' in header_lower or 'importe' in header_lower:
                col_mapping['amount'] = i

        # If no headers detected, assume default order: date, description, category, amount
        if len(col_mapping) < 4:
            col_mapping = {'date': 0, 'description': 1, 'category': 2, 'amount': 3}

        imported_count = 0
        errors = []

        for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 (after header)
            try:
                if len(row) < 4:
                    errors.append(f"Fila {row_num}: Faltan columnas")
                    continue

                # Parse date (DD/MM/YYYY or YYYY-MM-DD)
                date_str = row[col_mapping['date']].strip()
                try:
                    if '/' in date_str:
                        day, month, year = map(int, date_str.split('/'))
                        expense_date = date(year, month, day)
                    else:
                        expense_date = date.fromisoformat(date_str)
                except ValueError:
                    errors.append(f"Fila {row_num}: Fecha inválida '{date_str}'")
                    continue

                # Parse amount
                amount_str = row[col_mapping['amount']].strip().replace('$', '').replace(',', '')
                try:
                    amount = float(amount_str)
                    if amount <= 0:
                        errors.append(f"Fila {row_num}: El monto debe ser positivo")
                        continue
                except ValueError:
                    errors.append(f"Fila {row_num}: Monto inválido '{amount_str}'")
                    continue

                # Create expense
                expense_data = schemas.ExpenseCreate(
                    description=row[col_mapping['description']].strip(),
                    amount=amount,
                    category=row[col_mapping['category']].strip(),
                    date=expense_date
                )
                crud.create_expense(db, expense_data, current_user.id)
                imported_count += 1

            except Exception as e:
                errors.append(f"Fila {row_num}: {str(e)}")

        db.commit()

        return {
            "message": "Importación completada",
            "imported": imported_count,
            "total_rows": row_num - 1,
            "errors": errors[:10],  # Return first 10 errors
            "error_count": len(errors)
        }

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo debe estar codificado en UTF-8"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar el archivo: {str(e)}"
        )
