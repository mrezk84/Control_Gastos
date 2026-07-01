# 🚀 Deployment en Railway - Guía Paso a Paso

Railway es una plataforma **100% gratuita** que incluye:
- ✅ Base de datos PostgreSQL
- ✅ Hosting para el backend (Python/FastAPI)
- ✅ Hosting para el frontend (React)
- ✅ **$5 USD/mes en créditos gratuitos**
- ✅ **Sin tarjeta de crédito**

---

## 📋 Pasos para desplegar:

### 1. Crear cuenta en Railway
1. Ve a: https://railway.app/
2. Clic en "Start a New Project"
3. Regístrate con **GitHub** (es más rápido)

### 2. Desplegar el Backend
1. Clic en **"Deploy from GitHub repo"**
2. Selecciona tu repositorio
3. En **Root**: selecciona `backend`
4. Clic en **"Deploy Now"**

Railway detectará automáticamente que es Python y creará el servicio.

### 3. Agregar Base de Datos
1. En el mismo proyecto, clic en **"+ New Service"**
2. Selecciona **"Database"** → **"PostgreSQL"**
3. Clic en **"Add PostgreSQL"**

### 4. Conectar Backend con Base de Datos
1. Clic en el servicio del **Backend**
2. Ve a la pestaña **"Variables"**
3. Agrega las variables:

```
DATABASE_URL = (clic en el icono 🔗 para conectar con PostgreSQL)
SECRET_KEY = (genera uno con: openssl rand -hex 32)
GOOGLE_CLIENT_ID = (si usas OAuth)
GOOGLE_CLIENT_SECRET = (si usas OAuth)
```

### 5. Desplegar el Frontend
1. Clic en **"+ New Service"** → **"Deploy from GitHub repo"**
2. Selecciona tu repositorio
3. En **Root**: selecciona `frontend`
4. Ve a **"Settings"** → **"Domains"**
5. Agrega un dominio gratuito de Railway (termina en `.railway.app`)

### 6. Conectar Frontend con Backend
1. Clic en el servicio del **Frontend**
2. Ve a **"Variables"**
3. Agrega:
```
REACT_APP_API_URL = (URL del backend de Railway, ej: https://tu-backend.railway.app)
```

### 7. Redeploy
Después de agregar las variables, clic en **"Redeploy"** en cada servicio.

---

## 🌐 URLs que obtendrás:

- **Backend**: `https://tu-backend.railway.app`
- **Frontend**: `https://tu-frontend.railway.app`
- **Base de datos**: Hospedada por Railway

---

## ✅ Ventajas de Railway:

| Feature | Railway |
|---------|---------|
| **Costo** | Gratis ($5/mes en créditos) |
| **Tarjeta** | No requerida |
| **Base de datos** | PostgreSQL incluido |
| **Deploy** | Automático desde GitHub |
| **Dominio** | `.railway.app` gratis |
| **SSL** | Automático |

---

## 🔧 Troubleshooting:

Si algo no funciona:
1. Verifica las **Variables de entorno** en cada servicio
2. Revisa los **Logs** (pestaña "Logs" en cada servicio)
3. Asegúrate de hacer **Redeploy** después de cambiar variables
