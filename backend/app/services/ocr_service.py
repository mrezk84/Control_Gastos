import os
import re
import json
import base64
from io import BytesIO
from typing import Optional, Dict, Any
from datetime import datetime
import httpx
from PIL import Image
import pdfplumber

# OCR.space API key (gratis en https://ocr.space/ocrapi/freekey). Sin ella no se puede escanear imágenes.
OCR_API_KEY = os.getenv("OCR_SPACE_API_KEY", "")

# El plan gratuito de OCR.space acepta archivos de hasta 1 MB
MAX_IMAGE_SIDE = 1600
JPEG_QUALITY = 75

class OCRService:
    """Servicio para escanear recibos y extraer información usando OCR"""

    @staticmethod
    def prepare_image(image_bytes: bytes) -> bytes:
        """
        Reduce la imagen (máx. 1600 px por lado, JPEG calidad 75, ~200 KB): cabe en el límite de
        OCR.space y evita guardar fotos de varios MB en la base de datos.
        """
        image = Image.open(BytesIO(image_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")
        image.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE))
        out = BytesIO()
        image.save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        return out.getvalue()

    @staticmethod
    async def extract_from_image(image_bytes: bytes) -> Dict[str, Any]:
        """
        Extrae datos de una imagen de recibo usando la API de OCR.space
        """
        try:
            return await OCRService.extract_with_ocr_space(OCRService.prepare_image(image_bytes))
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    async def extract_from_pdf(pdf_bytes: bytes) -> Dict[str, Any]:
        """
        Extrae datos de un PDF de factura/receipt (en memoria: el disco de Vercel es efímero)
        """
        try:
            text = ""
            with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() or ""

            return OCRService._parse_receipt_text(text)
        except Exception as e:
            return {"success": False, "error": str(e)}

    @staticmethod
    def _parse_receipt_text(text: str) -> Dict[str, Any]:
        """
        Parsea el texto extraído para encontrar datos del recibo
        """
        lines = [line.strip() for line in text.split('\n') if line.strip()]

        result = {
            "success": True,
            "raw_text": text,
            "merchant": None,
            "amount": None,
            "date": None,
            "description": None,
            "confidence": 0.0
        }

        # Patrones para encontrar montos (formatos comunes en Argentina/Latam)
        amount_patterns = [
            r'total[:\s]*\$?\s*([\d,]+\.?\d*)',
            r'importe[:\s]*\$?\s*([\d,]+\.?\d*)',
            r'pagar[:\s]*\$?\s*([\d,]+\.?\d*)',
            r'suma[:\s]*\$?\s*([\d,]+\.?\d*)',
            r'\$\s*([\d,]+\.?\d*)\s*(?:total|$)',
        ]

        # Buscar monto
        for pattern in amount_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                amount_str = match.group(1).replace(',', '').replace('.', '')
                if '.' in match.group(1):
                    amount_str = match.group(1).replace(',', '')
                try:
                    result["amount"] = float(amount_str)
                    result["confidence"] += 30
                    break
                except ValueError:
                    pass

        # Patrones para fecha
        date_patterns = [
            r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})',
            r'(\d{2,4})[/-](\d{1,2})[/-](\d{1,2})',
        ]

        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                try:
                    groups = match.groups()
                    if len(groups[0]) == 4:  # YYYY-MM-DD
                        result["date"] = f"{groups[0]}-{groups[1].zfill(2)}-{groups[2].zfill(2)}"
                    else:  # DD-MM-YYYY or similar
                        result["date"] = f"{groups[2]}-{groups[1].zfill(2)}-{groups[0].zfill(2)}"
                    result["confidence"] += 20
                    break
                except:
                    pass

        # Extraer posible merchant (primera línea con texto significativo)
        for line in lines[:5]:
            if len(line) > 3 and not re.search(r'\d', line):
                result["merchant"] = line
                result["confidence"] += 10
                break

        # Si encontramos merchant, usarlo como descripción por defecto
        if result["merchant"]:
            result["description"] = f"Compra en {result['merchant']}"
        else:
            result["description"] = "Compra escaneada"

        # Ajustar confianza máxima
        result["confidence"] = min(result["confidence"], 100)

        return result

    @staticmethod
    async def extract_with_ocr_space(image_bytes: bytes) -> Dict[str, Any]:
        """
        Envía una imagen JPEG a la API de OCR.space y parsea el texto devuelto
        """
        if not OCR_API_KEY:
            return {"success": False, "error": "OCR_SPACE_API_KEY not configured"}

        base64_image = base64.b64encode(image_bytes).decode('utf-8')

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.ocr.space/parse/image",
                data={
                    "base64Image": f"data:image/jpeg;base64,{base64_image}",
                    "language": "spa",
                    "isOverlayRequired": "false",
                    "scale": "true",
                    "detectOrientation": "true",
                    "OCREngine": "2",
                },
                headers={"apikey": OCR_API_KEY}
            )

        if response.status_code == 200:
            data = response.json()
            if data.get("IsErroredOnProcessing", False):
                return {"success": False, "error": data.get("ErrorMessage", "Unknown error")}

            parsed_text = data.get("ParsedResults", [{}])[0].get("ParsedText", "")
            return OCRService._parse_receipt_text(parsed_text)

        return {"success": False, "error": "API request failed"}