# 💰 FinanzaFlow - Control de Gastos

Aplicación web moderna para control de gastos personales con autenticación OAuth, dashboard interactivo y análisis financiero.

**🌐 Demo en producción:** https://frontend-production-35fd.up.railway.app

![Version](https://img.shields.io/badge/version-2.1.0-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688)

---

## 📋 Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación Local](#instalación-local)
- [Configuración](#configuración)
- [Uso de la Aplicación](#uso-de-la-aplicación)
- [Deploy en Producción](#deploy-en-producción)
- [Configuración de OAuth](#configuración-de-oauth)
- [Dominio Personalizado](#dominio-personalizado)
- [Solución de Problemas](#solución-de-problemas)

---

## ✨ Características

### 🔐 Autenticación
- Registro e inicio de sesión con email/contraseña
- **Google Sign In** (OAuth 2.0)
- **Microsoft Sign In** (OAuth 2.0)
- **Apple Sign In** (OAuth 2.0)
- Recuperación de contraseña

### 📊 Dashboard
- Vista general de gastos mensuales
- Resumen por categorías
- Distribución visual de gastos
- Tendencias de gastos a lo largo del tiempo

### 💳 Gestión de Gastos
- Agregar, editar y eliminar gastos
- Categorización personalizada
- Filtros por fecha, categoría y monto
- Exportación a CSV y Excel
- Importación masiva desde CSV

### 📈 Presupuestos
- Creación de presupuestos mensuales
- Seguimiento del progreso
- Alertas visuales por categoría
- Historial de presupuestos

### 🎨 Interfaz
- Diseño moderno y responsivo
- **Modo claro/oscuro**
- Animaciones fluidas
- Compatible con móviles y tablets

---

## 🛠 Tecnologías

### Frontend
```
React 18
- React Router v6
- Axios
- Chart.js
- Recharts
```

### Backend
```
Python 3.11
- FastAPI 0.135
- SQLAlchemy 2.0
- PostgreSQL
- Pydantic v2
- Uvicorn
```

### Infraestructura
```
- Railway (Hosting)
- PostgreSQL (Base de datos)
- Nginx (Servidor web)
```

---

## 🚀 Instalación Local

### Requisitos Previos

```bash
# Backend
Python 3.11+
pip install virtualenv

# Frontend
Node.js 18+
npm
```

### 1. Clonar el Repositorio

```bash
git clone <tu-repositorio>
cd Control_Gastos
```

### 2. Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales
```

**Variables de entorno requeridas (`.env`):**

```env
# Base de datos (opcional para desarrollo local)
DATABASE_URL=postgresql://user:pass@localhost:5432/finanzaflow

# JWT
SECRET_KEY=tu_clave_secreta_aqui_genera_con_openssl_rand_base64_64

# Frontend (para CORS)
FRONTEND_URL=http://localhost:5173

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# Microsoft OAuth (opcional)
MICROSOFT_CLIENT_ID=tu_client_id
MICROSOFT_CLIENT_SECRET=tu_client_secret
MICROSOFT_REDIRECT_URI=http://localhost:8000/auth/microsoft/callback

# Apple OAuth (opcional)
APPLE_CLIENT_ID=tu_client_id
APPLE_TEAM_ID=tu_team_id
APPLE_KEY_ID=tu_key_id
```

### 3. Iniciar Backend

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El backend estará disponible en: http://localhost:8000

**Documentación API:** http://localhost:8000/docs

### 4. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Crear archivo de configuración
echo "REACT_APP_API_URL=http://localhost:8000" > .env
```

### 5. Iniciar Frontend

```bash
npm start
```

La aplicación estará disponible en: http://localhost:3000

---

## ⚙️ Configuración

### Base de Datos PostgreSQL (Opcional)

Para desarrollo, puedes usar SQLite o configurar PostgreSQL:

```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt install postgresql
sudo systemctl start postgresql

# Crear base de datos
createdb finanzaflow
```

Luego actualiza `DATABASE_URL` en tu `.env`:

```env
DATABASE_URL=postgresql://tu_usuario:tu_password@localhost:5432/finanzaflow
```

---

## 📖 Uso de la Aplicación

### Registro e Inicio de Sesión

1. **Registro con email:**
   - Ve a `/register`
   - Ingresa usuario, email y contraseña
   - Haz clic en "Crear Cuenta"

2. **Inicio de sesión:**
   - Ve a `/login`
   - Ingresa tus credenciales
   - O usa Google/Microsoft/Apple Sign In

### Agregar un Gasto

1. Ve a la sección **Gastos**
2. Haz clic en **+ Nuevo Gasto**
3. Completa el formulario:
   - Descripción
   - Monto
   - Categoría
   - Fecha
4. Haz clic en **Guardar**

### Crear un Presupuesto

1. Ve a la sección **Presupuestos**
2. Haz clic en **+ Nuevo Presupuesto**
3. Configura:
   - Mes y año
   - Categoría
   - Monto límite
4. Haz clic en **Guardar**

### Ver Análisis

1. Ve a la sección **Análisis**
2. Explora:
   - Distribución por categoría
   - Tendencias mensuales
   - Gastos promedio

### Exportar Datos

1. Ve a **Gastos**
2. Aplica los filtros deseados
3. Haz clic en **Exportar CSV** o **Exportar Excel**

---

## 🌐 Deploy en Producción

### Deploy Automático en Railway

La aplicación ya está configurada para Railway. Sigue estos pasos:

1. **Fork/Clonar el repositorio** a tu cuenta de GitHub

2. **Conectar con Railway:**
   - Ve a [railway.com](https://railway.com)
   - Clic en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Elige tu repositorio

3. **Configurar servicios:**

   **Backend:**
   ```bash
   # Variables de entorno
   DATABASE_URL=(Railway PostgreSQL URL)
   SECRET_KEY=(generar con openssl rand -base64 64)
   FRONTEND_URL=(URL del frontend)
   ```

   **Frontend:**
   ```bash
   # Variables de entorno
   REACT_APP_API_URL=(URL del backend)
   ```

4. **Desplegar:**
   - Railway detectará automáticamente los Dockerfiles
   - El deploy comenzará automáticamente
   - Espera a que ambos servicios estén "Healthy"

### URLs de Producción (Ejemplo)

```
Frontend: https://frontend-production-xxxx.up.railway.app
Backend:  https://backend-production-xxxx.up.railway.app
```

---

## 🔐 Configuración de OAuth

### Google Sign In

1. **Crear proyecto en Google Cloud:**
   - Ve a [console.cloud.google.com](https://console.cloud.google.com)
   - Crea un nuevo proyecto
   - Ve a **APIs & Services** → **Credentials**

2. **Crear OAuth Client ID:**
   - Clic en **Create Credentials** → **OAuth Client ID**
   - Tipo: **Web application**
   - Nombre: **FinanzaFlow**

3. **Authorized redirect URIs:**
   ```
   http://localhost:8000/auth/google/callback           # Desarrollo
   https://backend-production-xxxx.up.railway.app/auth/google/callback  # Producción
   https://api.tudominio.com/auth/google/callback       # Dominio personalizado
   ```

4. **Configurar variables en Railway:**
   ```bash
   GOOGLE_CLIENT_ID=514484055057-xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
   GOOGLE_REDIRECT_URI=https://api.tudominio.com/auth/google/callback
   ```

### Microsoft Sign In

1. **Registrar app en Azure:**
   - Ve a [portal.azure.com](https://portal.azure.com)
   - **Azure Active Directory** → **App registrations**
   - **New registration**

2. **Configurar redirect URIs:**
   ```
   http://localhost:8000/auth/microsoft/callback
   https://backend-production-xxxx.up.railway.app/auth/microsoft/callback
   ```

3. **Variables en Railway:**
   ```bash
   MICROSOFT_CLIENT_ID=tu-client-id
   MICROSOFT_CLIENT_SECRET=tu-client-secret
   ```

### Apple Sign In

Requiere cuenta de desarrollador Apple ($99/año).

---

## 🌍 Dominio Personalizado

### Configurar DNS en Railway

1. **Añadir dominio al servicio:**
   ```
   Frontend → Settings → Domains → New Domain
   Backend → Settings → Domains → New Domain
   ```

2. **Configurar registros DNS en tu proveedor:**
   ```
   CNAME  app  →  (Railway Frontend Target)
   CNAME  api  →  (Railway Backend Target)
   CNAME  www  →  (Railway Frontend Target)
   ```

3. **Actualizar variables:**
   ```bash
   # Backend
   FRONTEND_URL=https://app.tudominio.com
   GOOGLE_REDIRECT_URI=https://api.tudominio.com/auth/google/callback

   # Google Cloud Console - Agregar nuevo redirect URI
   https://api.tudominio.com/auth/google/callback
   ```

---

## 🔧 Solución de Problemas

### Problemas Comunes

**1. Error "Database connection failed"**
```bash
# Verifica que DATABASE_URL sea correcta
# Para Railway PostgreSQL, usa la URL proporcionada
```

**2. Google Sign In no funciona**
```bash
# Verifica las variables GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET
# Confirma que el redirect URI coincida exactamente
# Revisa los logs del backend en Railway
```

**3. CORS errors en el navegador**
```bash
# Verifica que FRONTEND_URL esté configurada correctamente
# Debe incluir el protocolo (https://)
```

**4. El frontend no carga los datos**
```bash
# Verifica REACT_APP_API_URL en el frontend
# Debe apuntar al backend correcto
# Abre la consola del navegador (F12) para ver errores
```

### Comandos Útiles

```bash
# Ver logs del backend en Railway
railway logs --service backend

# Ver variables de entorno
railway variables --service backend

# Re-deploy sin cambios
railway up

# Ver estado del servicio
railway status
```

### Debug en Producción

1. **Verificar backend:**
   ```bash
   curl https://backend-production-xxxx.up.railway.app/
   # Debe devolver: {"message":"Control de Gastos API v2.1"...}
   ```

2. **Verificar OAuth:**
   ```bash
   curl https://backend-production-xxxx.up.railway.app/auth/google
   # Debe devolver un JSON con auth_url
   ```

3. **Consola del navegador:**
   - Presiona F12
   - Pestaña "Console" para errores de JavaScript
   - Pestaña "Network" para ver peticiones HTTP

---

## 📚 Estructura del Proyecto

```
Control_Gastos/
├── backend/
│   ├── app/
│   │   ├── routes/         # Rutas de la API
│   │   ├── models.py       # Modelos de base de datos
│   │   ├── schemas.py      # Schemas de Pydantic
│   │   ├── crud.py         # Operaciones CRUD
│   │   ├── database.py     # Configuración de DB
│   │   ├── config.py       # Configuración de la app
│   │   └── main.py         # Entry point de FastAPI
│   ├── requirements.txt
│   ├── Dockerfile
│   └── railway.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas principales
│   │   ├── services/       # API client (axios)
│   │   ├── theme.css       # Estilos globales
│   │   └── App.js          # Entry point de React
│   ├── package.json
│   ├── Dockerfile
│   └── railway.json
│
└── README.md
```

---

## 📝 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## 👨‍💻 Autor

Marcos Rezk

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o un pull request.

---

**Última actualización:** Marzo 2026
**Versión:** 2.1.0
