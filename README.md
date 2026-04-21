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

---

## 🌐 Deployment en Producción

### Opción Recomendada: Vercel + Railway

El proyecto está configurado para deployment híbrido:

- **Frontend (Vercel)**: Hosting estático global, CDN gratis
- **Backend + DB (Railway)**: API Python + PostgreSQL

```
┌─────────────┐         ┌─────────────┐
│   Vercel    │         │   Railway   │
│  Frontend   │◄───────►│  Backend    │
│   (React)   │  API    │  (FastAPI)  │
│             │         │   + PGSQL   │
└─────────────┘         └─────────────┘
```

### Guía de Deployment Paso a Paso

📖 **Ver guía completa**: [HYBRID_DEPLOY.md](./HYBRID_DEPLOY.md)

#### Resumen Rápido:

1. **Railway (Backend + DB)**
   - Ve a railway.app → Login with GitHub
   - Deploy from GitHub repo → Root: `backend`
   - Agregar servicio PostgreSQL
   - Configurar variables: `DATABASE_URL`, `SECRET_KEY`, `FRONTEND_URL`

2. **Vercel (Frontend)**
   - Ve a vercel.com → Login with GitHub
   - Import repo → Root: `frontend`
   - Configurar variable: `REACT_APP_API_URL` (URL del backend de Railway)

3. **Configurar CORS**
   - En Railway Backend → Variables → `FRONTEND_URL = https://tu-frontend.vercel.app`

### URLs de Producción (Ejemplo)

| Servicio | URL |
|----------|-----|
| Frontend | `https://control-gastos-frontend.vercel.app` |
| Backend | `https://control-gastos-backend-production.up.railway.app` |

### Costos

- ✅ **Vercel**: Gratis (Hobby plan)
- ✅ **Railway**: Gratis ($5 crédito/mes)

---

## 🔗 Links Útiles

- [Guía de Deployment Híbrido](./HYBRID_DEPLOY.md)
- [Deployment en Google Cloud](./DEPLOYMENT.md)
- [Deployment en Railway](./RAILWAY_DEPLOY.md)
- [Manual de Usuario](./MANUAL_USUARIO.md)