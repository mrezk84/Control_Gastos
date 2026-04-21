# Control de Gastos 💰

Aplicación moderna para el control de gastos personales con **escaneo de recibos mediante OCR** y **autenticación OAuth**.

## ✨ Características

### Backend (Python/FastAPI)
- ⚡ API REST moderna con FastAPI
- 🔐 Autenticación OAuth (Google, Microsoft, Apple)
- 📸 **Escaneo de recibos y facturas con OCR**
- 📄 **Procesamiento de PDFs**
- 💾 Base de datos SQLAlchemy
- 📊 Análisis de gastos con estadísticas

### Frontend (React)
- 🎨 **Diseño moderno con efecto Glassmorphism**
- 📱 Totalmente responsivo
- 📈 Gráficos interactivos con Chart.js
- 📷 **Cámara para escanear recibos**
- 📎 **Subida de imágenes y PDFs**
- 🌙 Tema oscuro premium

## 🚀 Instalación

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Variables de entorno** (crear `.env`):
```env
DATABASE_URL=mysql://usuario:password@localhost/control_gastos
SECRET_KEY=tu_clave_secreta_aqui
FRONTEND_URL=http://localhost:3000
OCR_SPACE_API_KEY=tu_api_key_opcional  # Opcional, usa Tesseract local por defecto
```

**Ejecutar**:
```bash
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
```

**Variables de entorno** (crear `.env`):
```env
REACT_APP_API_URL=http://localhost:8000
```

**Ejecutar**:
```bash
npm start
```

## 📸 Escaneo de Recibos

La aplicación permite escanear recibos y facturas automáticamente:

1. **Imágenes**: JPG, PNG (máx 10MB)
2. **PDFs**: Soportados para facturas digitales
3. **OCR**: Extrae automáticamente:
   - ✅ Monto total
   - ✅ Fecha
   - ✅ Comercio/Establecimiento
   - ✅ Descripción sugerida

## 🛠️ Stack Tecnológico

### Backend
- FastAPI
- SQLAlchemy
- Pytesseract / OCR.space
- PDFPlumber
- Python-jose (JWT)
- Passlib (bcrypt)

### Frontend
- React 18
- React Router
- Axios
- Chart.js
- React Bootstrap

## 📁 Estructura del Proyecto

```
Proyecto_Control_Gastos/
├── backend/
│   ├── app/
│   │   ├── routes/        # Endpoints API
│   │   ├── services/      # OCR Service
│   │   ├── models.py      # Modelos BD
│   │   ├── schemas.py     # Pydantic schemas
│   │   └── main.py        # App entry point
│   ├── uploads/           # Archivos subidos
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── services/      # API client
    │   └── theme.css      # Estilos globales
    └── package.json
```

## 🔒 Variables de Entorno Opcionales

```env
# OAuth (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# OCR (opcional - usa Tesseract local si no se configura)
OCR_SPACE_API_KEY=
```

## 📝 Notas

- Para usar Tesseract OCR local, instalar: `apt-get install tesseract-ocr tesseract-spa-eng`
- Para usar OCR.space API, registrarse en https://ocr.space/ y obtener API key
- Los archivos subidos se guardan en `backend/uploads/receipts/`