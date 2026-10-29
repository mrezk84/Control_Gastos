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
DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_JWT_SECRET=  # Solo si el proyecto usa el JWT secret legacy (HS256)
FRONTEND_URL=http://localhost:3000
OCR_SPACE_API_KEY=tu_api_key_opcional  # Opcional, usa Tesseract local por defecto
```

> La base de datos y el login (email, Google, Microsoft) usan **Supabase**. Ver [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md).

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
REACT_APP_SUPABASE_URL=https://<ref>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<anon-key>
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
# OCR (opcional - usa Tesseract local si no se configura)
OCR_SPACE_API_KEY=
```

## 📝 Notas

- Para usar Tesseract OCR local, instalar: `apt-get install tesseract-ocr tesseract-spa-eng`
- Para usar OCR.space API, registrarse en https://ocr.space/ y obtener API key
- Los archivos subidos se guardan en `backend/uploads/receipts/`

---

## 🌐 Deployment en Producción

### Opción Recomendada: Render (Gratis)

**Railway ya no ofrece plan gratuito**. La mejor alternativa actual es **Render**.

- **Frontend**: Render Static Site (o Vercel)
- **Backend + DB**: Render Web Service + PostgreSQL

```
┌─────────────┐         ┌─────────────┐
│   Render    │         │   Render    │
│  Frontend   │◄───────►│  Backend    │
│   (React)   │  API    │  (FastAPI)  │
│             │         │   + PGSQL   │
└─────────────┘         └─────────────┘
```

### Guía de Deployment Paso a Paso

📖 **Ver guía completa**: [RENDER_DEPLOY.md](./RENDER_DEPLOY.md)

#### Resumen Rápido - Render:

1. **Crear cuenta en [render.com](https://render.com)** con GitHub

2. **Backend (Render)**
   - New → Web Service → Conectar repo `Control_Gastos`
   - Root: `backend`, Runtime: Docker, Plan: Free
   - Variables: `DATABASE_URL` (Supabase), `SUPABASE_URL`, `SUPABASE_JWT_SECRET` (opcional), `FRONTEND_URL`

3. **Base de Datos y Auth (Supabase)**
   - Ver [SUPABASE_MIGRATION.md](./SUPABASE_MIGRATION.md)

4. **Frontend (Render o Vercel)**
   - Render: New → Static Site → Root: `frontend`
   - Variables: `REACT_APP_API_URL` (URL del backend), `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`

### URLs de Producción (Ejemplo)

| Servicio | URL |
|----------|-----|
| Frontend | `https://control-gastos-frontend.onrender.com` |
| Backend | `https://control-gastos-backend.onrender.com` |

### Costos

- ✅ **Render Backend**: Gratis (plan Free)
- ✅ **Render PostgreSQL**: Gratis (90 días, luego $7/mes)
- ✅ **Vercel Frontend**: Gratis (opcional)

---

## 🔗 Links Útiles

- [Deployment en Render (Recomendado)](./RENDER_DEPLOY.md)
- [Deployment Híbrido Vercel + Railway](./HYBRID_DEPLOY.md) ⚠️ Railway ya no es gratis
- [Deployment en Google Cloud](./DEPLOYMENT.md)
- [Deployment en Railway](./RAILWAY_DEPLOY.md)
- [Manual de Usuario](./MANUAL_USUARIO.md)