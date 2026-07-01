# 🚀 Deploy a Producción - Control de Gastos

## Estado Actual
- ✅ Backend corriendo en `http://localhost:8000`
- ✅ Frontend corriendo en `http://localhost:3000`
- ✅ API mejorada con v2.1.0

## Deploy en Railway

### Opción 1: Vía Web (Más Fácil)

1. **Ir a [railway.app](https://railway.app)** y loguearte
2. **Crear un nuevo proyecto** → "New Project" → "Deploy from GitHub repo"
3. **Seleccionar el repositorio** de este proyecto

#### Backend Service:
1. En Railway, crea un **New Service** → Select GitHub Repo
2. Selecciona la carpeta `backend/` como root
3. Railway detectará automáticamente que es Python/FastAPI
4. **Variables de entorno requeridas** (Settings → Variables):
   ```
   SECRET_KEY=genera_uno_nuevo_con_openssl_rand_base64_64
   TOKEN_EXPIRATION=30
   DB_HOST=(Railway te proveerá esto al agregar MySQL)
   DB_PORT=3306
   DB_USER=(Railway te proveerá esto)
   DB_PASS=(Railway te proveerá esto)
   DB_NAME=(Railway te proveerá esto)
   FRONTEND_URL=https://tu-frontend-url.railway.app

   # Google OAuth (Opcional)
   GOOGLE_CLIENT_ID=tu_client_id
   GOOGLE_CLIENT_SECRET=tu_client_secret
   GOOGLE_REDIRECT_URI=https://tu-backend-url.railway.app/auth/google/callback
   ```

5. **Agregar base de datos MySQL**: New Service → Provision MySQL
6. **Conectar el backend a la base de datos**:
   - Click en MySQL service → Variables
   - Copiar las variables de conexión al Backend Service

#### Frontend Service:
1. En el mismo proyecto, **New Service** → Select GitHub Repo
2. Selecciona la carpeta `frontend/` como root
3. **Variables de entorno**:
   ```
   REACT_APP_API_URL=https://tu-backend-url.railway.app
   ```

### Opción 2: Vía CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Loguearse
railway login

# Crear proyecto
railway init

# Agregar backend
cd backend
railway up

# Agregar base de datos MySQL
railway add mysql

# Agregar frontend (en otra terminal)
cd frontend
railway up

# Configurar variables de entorno
railway variables set SECRET_KEY="tu_secret_key"
railway variables set REACT_APP_API_URL="https://tu-backend-url.railway.app"

# Hacer deploy
railway deploy
```

## Variables de Entorno Esenciales

### Backend
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SECRET_KEY` | Clave secreta para JWT | Generar con `openssl rand -base64 64` |
| `FRONTEND_URL` | URL del frontend para CORS | `https://tu-app.railway.app` |
| `DB_*` | Variables de conexión MySQL | Railway las provee automáticamente |

### Frontend
| Variable | Descripción |
|----------|-------------|
| `REACT_APP_API_URL` | URL del backend API |

## Verificar Deploy

### Backend
```bash
curl https://tu-backend-url.railway.app/health
# Debería retornar: {"status":"healthy","version":"2.1.0"}
```

### Frontend
- Abrir `https://tu-frontend-url.railway.app`
- Verificar que cargue la página de login
- Probar registrar un nuevo usuario
- Probar iniciar sesión

## Dominio Personalizado (Opcional)

1. En Railway, Settings → Domains
2. Agregar tu dominio personalizado
3. Configurar DNS según instrucciones de Railway

## Solución de Problemas

### Error: SECRET_KEY está usando valor por defecto
- Generar una nueva clave: `openssl rand -base64 64`
- Actualizar la variable en Railway

### Error: CORS en producción
- Verificar que `FRONTEND_URL` tenga la URL correcta del frontend
- Verificar que `REACT_APP_API_URL` tenga la URL correcta del backend

### Error: Base de datos no conecta
- Verificar que las variables `DB_*` estén correctamente configuradas
- Verificar que el servicio MySQL esté corriendo en Railway

## URLs de Producción (Ejemplo)
- Backend: `https://control-gastos-api-production.up.railway.app`
- Frontend: `https://control-gastos-frontend-production.up.railway.app`
