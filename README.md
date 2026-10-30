# Control de Gastos 💰

Aplicación moderna para el control de gastos personales con **escaneo de recibos mediante OCR** y **login propio (usuario/contraseña, Google, Microsoft)**.

## ✨ Características

### Backend (Python/FastAPI)
- ⚡ API REST moderna con FastAPI
- 🔐 Autenticación JWT propia + OAuth (Google, Microsoft)
- 📸 **Escaneo de recibos y facturas con OCR**
- 📄 **Procesamiento de PDFs**
- 💾 SQLAlchemy sobre PostgreSQL (Neon)
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

**Variables de entorno**: copia `backend/.env.example` a `backend/.env` y complétalo
(`DATABASE_URL` de Neon, `SECRET_KEY`, y opcionalmente Resend, OCR.space y OAuth).
Sin `DATABASE_URL` el backend usa un SQLite temporal, solo para desarrollo local.

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

1. **Imágenes**: JPG, PNG (máx 4MB)
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
- OCR.space (imágenes)
- PDFPlumber
- Python-jose (JWT)
- Passlib (bcrypt)

### Frontend
- React 18
- React Router
- Axios
- Chart.js

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
│   ├── api/               # Entrada serverless de Vercel
│   ├── migrations/        # SQL del esquema
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/    # React components
    │   ├── services/      # API client
    │   └── theme.css      # Estilos globales
    └── package.json
```

## 📝 Notas

- El OCR de imágenes usa la API de OCR.space (clave gratuita en https://ocr.space/ocrapi/freekey); los PDFs se leen con pdfplumber.
- Los recibos subidos se guardan en la base de datos (el disco de Vercel es efímero).

---

## 🌐 Despliegue

Todo corre en capas gratuitas sin tarjeta: **Vercel** (frontend y backend), **Neon** (PostgreSQL),
**Resend** (correo) y **OCR.space**. Guía paso a paso en [DEPLOY.md](./DEPLOY.md).

## 🔗 Links Útiles

- [Guía de despliegue](./DEPLOY.md)
- [Manual de Usuario](./MANUAL_USUARIO.md)
