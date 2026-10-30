from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File, Form
from sqlalchemy.orm import Session
from ..database import get_db
from .. import schemas, models
from ..auth.utils import get_current_user
from ..services.ocr_service import OCRService
from pathlib import Path

router = APIRouter(tags=["Receipts"])

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
# Vercel rechaza cuerpos de petición mayores a 4,5 MB
MAX_FILE_SIZE = 4 * 1024 * 1024  # 4MB


def _validate_upload(file: UploadFile) -> str:
    file_ext = Path(file.filename or "").suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Extensión no permitida. Use: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    return file_ext


async def _read_limited(file: UploadFile) -> bytes:
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Archivo demasiado grande (máx 4MB)")
    return content


@router.post("/scan", response_model=schemas.ReceiptScanResult)
async def scan_receipt(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    """
    Escanea una imagen o PDF de recibo y extrae datos usando OCR.
    No guarda el archivo: para conservarlo, súbelo con /receipts/upload una vez creado el gasto.
    """
    file_ext = _validate_upload(file)
    content = await _read_limited(file)

    if file_ext == ".pdf":
        result = await OCRService.extract_from_pdf(content)
    else:
        result = await OCRService.extract_from_image(content)

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Error al procesar imagen"))

    return schemas.ReceiptScanResult(
        success=True,
        data={
            "description": result.get("description"),
            "amount": result.get("amount"),
            "date": result.get("date"),
            "merchant": result.get("merchant"),
            "raw_text": result.get("raw_text"),
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
    Sube y asocia un recibo a un gasto existente (se guarda en la base de datos)
    """
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    file_ext = _validate_upload(file)
    content = await _read_limited(file)

    is_pdf = file_ext == ".pdf"
    if not is_pdf:
        try:
            content = OCRService.prepare_image(content)
        except Exception:
            raise HTTPException(status_code=400, detail="La imagen no es válida")

    receipt = models.ReceiptImage(
        expense_id=expense_id,
        content=content,
        file_name=file.filename,
        file_type="pdf" if is_pdf else "image"
    )
    db.add(receipt)
    db.flush()  # asigna receipt.id

    expense.receipt_url = f"/receipts/{receipt.id}/file"

    db.commit()
    db.refresh(receipt)

    return receipt


def _get_user_receipt(db: Session, receipt_id: int, user_id: int) -> models.ReceiptImage:
    receipt = db.query(models.ReceiptImage).join(models.Expense).filter(
        models.ReceiptImage.id == receipt_id,
        models.Expense.user_id == user_id
    ).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Recibo no encontrado")
    return receipt


@router.get("/{receipt_id}/file")
async def get_receipt_file(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Devuelve el archivo de un recibo guardado en la base de datos
    """
    receipt = _get_user_receipt(db, receipt_id, current_user.id)

    if not receipt.content:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    media_type = "application/pdf" if receipt.file_type == "pdf" else "image/jpeg"
    return Response(content=receipt.content, media_type=media_type)


@router.get("/expense/{expense_id}", response_model=list[schemas.ReceiptImage])
async def get_expense_receipts(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene todos los receipts asociados a un gasto
    """
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    return db.query(models.ReceiptImage).filter(
        models.ReceiptImage.expense_id == expense_id
    ).all()


@router.delete("/{receipt_id}", status_code=204)
async def delete_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Elimina un receipt
    """
    receipt = _get_user_receipt(db, receipt_id, current_user.id)

    db.delete(receipt)
    db.commit()
