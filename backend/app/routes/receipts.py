from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, models
from ..auth.utils import get_current_user
from ..services.ocr_service import OCRService
from datetime import datetime
import os
import uuid
from pathlib import Path

router = APIRouter(tags=["Receipts"])

# Configuración de uploads
UPLOAD_DIR = Path("uploads/receipts")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/scan", response_model=schemas.ReceiptScanResult)
async def scan_receipt(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    """
    Escanea una imagen o PDF de recibo y extrae datos usando OCR
    """
    # Validar extensión
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extensión no permitida. Use: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Leer archivo
    content = await file.read()

    # Validar tamaño
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande (máx 10MB)")

    # Procesar según tipo
    if file_ext == ".pdf":
        result = await OCRService.extract_from_pdf(content)
    else:
        result = OCRService.extract_from_image(content)

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Error al procesar imagen"))

    # Guardar archivo temporalmente para retorno
    temp_filename = f"temp_{uuid.uuid4().hex}{file_ext}"
    temp_path = UPLOAD_DIR / temp_filename

    with open(temp_path, "wb") as f:
        f.write(content)

    return schemas.ReceiptScanResult(
        success=True,
        data={
            "description": result.get("description"),
            "amount": result.get("amount"),
            "date": result.get("date"),
            "merchant": result.get("merchant"),
            "raw_text": result.get("raw_text"),
            "temp_file": temp_filename
        },
        message="Datos extraídos correctamente",
        confidence=result.get("confidence", 0)
    )


@router.post("/upload", response_model=schemas.ReceiptImage)
async def upload_receipt(
    expense_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Sube y asocia un recibo a un gasto existente
    """
    # Verificar que el gasto existe y pertenece al usuario
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    # Validar extensión
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extensión no permitida. Use: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Leer y guardar archivo
    content = await file.read()
    filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = UPLOAD_DIR / filename

    with open(file_path, "wb") as f:
        f.write(content)

    # Crear registro en base de datos
    receipt = models.ReceiptImage(
        expense_id=expense_id,
        file_path=str(file_path),
        file_name=file.filename,
        file_type="pdf" if file_ext == ".pdf" else "image"
    )

    db.add(receipt)

    # Actualizar URL del recibo en el gasto
    expense.receipt_url = f"/api/receipts/view/{filename}"

    db.commit()
    db.refresh(receipt)

    return receipt


@router.get("/view/{filename}")
async def view_receipt(
    filename: str,
    current_user: models.User = Depends(get_current_user)
):
    """
    Retorna una imagen de recibo
    """
    from fastapi.responses import FileResponse

    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    # Determinar tipo de contenido
    ext = Path(filename).suffix.lower()
    content_type = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".pdf": "application/pdf"
    }.get(ext, "application/octet-stream")

    return FileResponse(file_path, media_type=content_type)


@router.get("/expense/{expense_id}", response_model=list[schemas.ReceiptImage])
async def get_expense_receipts(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene todos los receipts asociados a un gasto
    """
    # Verificar que el gasto pertenece al usuario
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    receipts = db.query(models.ReceiptImage).filter(
        models.ReceiptImage.expense_id == expense_id
    ).all()

    return receipts


@router.delete("/{receipt_id}", status_code=204)
async def delete_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Elimina un receipt
    """
    receipt = db.query(models.ReceiptImage).join(models.Expense).filter(
        models.ReceiptImage.id == receipt_id,
        models.Expense.user_id == current_user.id
    ).first()

    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt no encontrado")

    # Eliminar archivo
    file_path = Path(receipt.file_path)
    if file_path.exists():
        file_path.unlink()

    db.delete(receipt)
    db.commit()