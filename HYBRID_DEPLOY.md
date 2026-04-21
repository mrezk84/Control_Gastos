# 🚀 Deployment Híbrido: Vercel + Railway

Esta guía explica cómo desplegar la aplicación usando:
- **Frontend**: Vercel (hosting estático rápido y gratuito)
- **Backend + Database**: Railway (Python + PostgreSQL)

---

## 📋 Arquitectura

```
┌─────────────────┐         ┌─────────────────┐
│   Vercel        │         │   Railway        │
│                 │         │                 │
│  ┌───────────┐  │   API   │  ┌───────────┐  │
│  │ Frontend  │◄─┼────────┼──►│ Backend   │  │
│  │  (React)  │  │         │  │ (FastAPI) │  │
│  └───────────┘  │         │  └─────┬─────┘  │
│                 │         │        │        │
│   Global CDN    │         │   ┌────▼────┐   │
│                 │         │   │PostgreSQL│   │
│   *.vercel.app  │         │   │  (DB)    │   │
└─────────────────┘         │   └─────────┘   │
                            │                 │
                            │ *.railway.app   │
                            └─────────────────┘
```

---

## Paso 1: Backend en Railway

### 1.1 Crear cuenta en Railway
1. Ve a https://railway.app/
2. Clic en **"Login with GitHub"**
3. Autoriza el acceso a tu repositorio

### 1.2 Crear Nuevo Proyecto
1. Clic en **"+ New Project"**
2. Selecciona **"Deploy from GitHub repo"**
3. Busca y selecciona: `mrezk84/Control_Gastos`
4. En **Root Directory**, escribe: `backend`
5. Clic en **"Deploy Now"**

### 1.3 Agregar Base de Datos
1. En el proyecto, clic en **"+ New Service"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Railway creará la base de datos automáticamente

### 1.4 Configurar Variables de Entorno (Backend)
1. En el servicio del **Backend**, ve a la pestaña **"Variables"**
2. Agrega las siguientes variables:

```bash
# Conectar con la base de datos (clic en el icono 🔗)
DATABASE_URL = [Conectar con PostgreSQL service]

# Generar con: openssl rand -hex 32
SECRET_KEY = tu_clave_secreta_aqui

# Permitir CORS desde Vercel
FRONTEND_URL = https://control-gastos-frontend.vercel.app
```

### 1.5 Obtener URL del Backend
1. En el servicio del **Backend**, copia la **URL generada**
2. Será algo como: `https://control-gastos-backend-production.up.railway.app`
3. **Guarda esta URL** para el siguiente paso

---

## Paso 2: Frontend en Vercel

### 2.1 Crear cuenta en Vercel
1. Ve a https://vercel.com
2. Clic en **"Login"** → **"Continue with GitHub"**
3. Autoriza el acceso

### 2.2 Importar Proyecto
1. Clic en **"Add New..."** → **"Project"**
2. Importa el repositorio: `mrezk84/Control_Gastos`
3. En **Root Directory**, selecciona: `frontend`
4. Clic en **"Continue"**

### 2.3 Configurar Variables de Entorno (Frontend)
1. En **Environment Variables**, agrega:
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `[PEGAR LA URL DEL BACKEND DE RAILWAY]`

2. Ejemplo:
   ```
   REACT_APP_API_URL=https://control-gastos-backend-production.up.railway.app
   ```

### 2.4 Deploy
1. Clic en **"Deploy"**
2. Espera unos minutos...
3. ¡Listo! Tu frontend estará en: `https://control-gastos-frontend.vercel.app`

---

## Paso 3: Configurar CORS (Importante)

Después de obtener las URLs, actualiza el backend:

### 3.1 En Railway (Variables del Backend)
```bash
FRONTEND_URL=https://control-gastos-frontend.vercel.app
```

### 3.2 En el código (si es necesario)
El archivo `backend/app/main.py` ya tiene configurado CORS. Solo asegúrate de que la variable `FRONTEND_URL` esté correcta.

---

## 🌐 URLs Finales

| Servicio | URL |
|----------|-----|
| **Frontend** | `https://control-gastos-frontend.vercel.app` |
| **Backend** | `https://control-gastos-backend-production.up.railway.app` |
| **Base de Datos** | PostgreSQL en Railway (interna) |

---

## 🔄 Actualizar CORS después del Deploy

1. Ve a Railway → Backend → Variables
2. Actualiza `FRONTEND_URL` con la URL real de Vercel
3. Clic en **"Redeploy"** en el backend

---

## 🧪 Verificar el Deployment

### Test Backend
```bash
curl https://tu-backend.railway.app/
```
Debería retornar: `{"message": "Control de Gastos API v2.1", ...}`

### Test Frontend
1. Abre la URL de Vercel en tu navegador
2. Debería ver la página de login

---

## 📊 Monitoreo

### Railway Logs
1. Ve al servicio en Railway
2. Pestaña **"Logs"** → ver logs en tiempo real

### Vercel Logs
1. Ve al proyecto en Vercel
2. Pestaña **"Deployments"** → clic en un deployment → **"Build Logs"**

---

## 🆕 Troubleshooting

### Error: "CORS blocked"
- Solución: Actualiza `FRONTEND_URL` en Railway variables

### Error: "Network Error"
- Solución: Verifica que `REACT_APP_API_URL` sea correcta en Vercel

### Error: "Database connection failed"
- Solución: Reconecta `DATABASE_URL` usando el icono 🔗 en Railway

---

## 💰 Costos

| Plataforma | Plan | Costo |
|------------|------|-------|
| Vercel | Hobby | **Gratis** |
| Railway | Starter | **Gratis** ($5 crédito/mes) |

---

## 🔧 Comandos Útiles

### Railway CLI
```bash
# Instalar
npm install -g railway

# Login
railway login

# Ver logs
railway logs

# Abrir consola
railway open
```

### Vercel CLI
```bash
# Instalar
npm install -g vercel

# Login
vercel login

# Deploy local
vercel --prod
```

---

## ✅ Checklist de Deployment

- [ ] Cuenta en Railway creada
- [ ] Backend desplegado en Railway
- [ ] PostgreSQL agregado en Railway
- [ ] Variables de entorno configuradas en Railway
- [ ] URL del backend copiada
- [ ] Cuenta en Vercel creada
- [ ] Frontend importado en Vercel
- [ ] `REACT_APP_API_URL` configurada en Vercel
- [ ] Frontend desplegado en Vercel
- [ ] CORS configurado (`FRONTEND_URL` en Railway)
- [ ] Backend redeployado después de configurar CORS
- [ ] Aplicación probada end-to-end