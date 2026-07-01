# 🚀 Deployment Guide - Render (Gratis)

Esta guía explica cómo desplegar la aplicación usando **Render**, una alternativa gratuita a Railway.

## 📋 Arquitectura

```
┌─────────────────┐         ┌─────────────────┐
│   Vercel/Render │         │   Render        │
│                 │         │                 │
│  ┌───────────┐  │   API   │  ┌───────────┐  │
│  │ Frontend  │◄─┼────────┼──►│ Backend   │  │
│  │  (React)  │  │         │  │ (FastAPI) │  │
│  └───────────┘  │         │  └─────┬─────┘  │
│                 │         │        │        │
│   Global CDN    │         │   ┌────▼────┐   │
│                 │         │   │PostgreSQL│   │
│   *.onrender.  │         │   │  (DB)    │   │
│   *.vercel.app │         │   └─────────┘   │
└─────────────────┘         │                 │
                            │ *.onrender.app  │
                            └─────────────────┘
```

---

## 💰 Costos Render

| Servicio | Plan | Costo |
|----------|------|-------|
| Backend Python | Free | **$0** |
| PostgreSQL | Free Starter | **$0** (90 días) |
| Frontend (opcional) | Free | **$0** |

**Después de 90 días**: PostgreSQL cuesta ~$7/mes

---

## Paso 1: Crear Cuenta en Render

1. Ve a [render.com](https://render.com)
2. Clic en **"Sign Up"**
3. **"Continue with GitHub"**
4. Autoriza el acceso a tu repositorio `mrezk84/Control_Gastos`

---

## Paso 2: Desplegar Backend en Render

### Opción A: Desde el Dashboard (Recomendado)

1. En Render, clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio GitHub: `mrezk84/Control_Gastos`
3. Configura:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `control-gastos-backend` |
   | **Root Directory** | `backend` |
   | **Runtime** | `Docker` |
   | **Dockerfile Path** | `Dockerfile` |
   | **Region** | `Oregon (us-west)` |
   | **Plan** | **Free** |

4. Clic en **"Create Web Service"**

---

## Paso 3: Crear Base de Datos PostgreSQL

1. Clic en **"New +"** → **"PostgreSQL"**
2. Configura:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `control-gastos-db` |
   | **Database** | `control_gastos` |
   | **User** | `controluser` |
   | **Region** | `Oregon (us-west)` |
   | **Plan** | **Free** |

3. Clic en **"Create Database"**

---

## Paso 4: Conectar Backend con Base de Datos

1. Ve al servicio **Backend** en Render
2. En la sección **"Environment"**, clic en **"Add Environment Variable"**

3. Agrega las siguientes variables:

   | Key | Valor |
   |-----|-------|
   | `DATABASE_URL` | **Conectar desde DB** (clic en "Connect Database") |
   | `SECRET_KEY` | Genera con: `openssl rand -hex 32` |
   | `FRONTEND_URL` | `https://control-gastos-frontend.onrender.com` |
   | `PORT` | `8000` |

4. Para conectar `DATABASE_URL`:
   - Clic en **"Connect Database"**
   - Selecciona `control-gastos-db`
   - Render agregará la variable automáticamente

5. Clic en **"Save Changes"** y luego **"Manual Deploy"** → **"Clear build cache & deploy"**

---

## Paso 5: Obtener URL del Backend

1. En el servicio del Backend, copia la **URL**
2. Será algo como: `https://control-gastos-backend.onrender.com`
3. **Guarda esta URL** para el siguiente paso

---

## Paso 6: Desplegar Frontend

### Opción A: Render (Todo en una plataforma)

1. Clic en **"New +"** → **"Static Site"**
2. Conecta el mismo repositorio
3. Configura:

   | Campo | Valor |
   |-------|-------|
   | **Name** | `control-gastos-frontend` |
   | **Root Directory** | `frontend` |
   | **Build Command** | `npm ci && npm run build` |
   | **Publish Directory** | `build` |
   | **Node Version** | `20` |

4. Agregar Variable de Entorno:
   - `REACT_APP_API_URL` = `[PEGAR URL DEL BACKEND]`

5. Clic en **"Create Static Site"**

### Opción B: Vercel (Si ya lo tienes configurado)

1. Ve a tu proyecto en Vercel
2. Settings → **Environment Variables**
3. Actualiza `REACT_APP_API_URL` con la URL de Render
4. Clic en **"Redeploy"**

---

## Paso 7: Actualizar CORS

Después de obtener las URLs finales, asegúrate de:

1. **Backend** (Render → Environment):
   ```
   FRONTEND_URL=https://control-gastos-frontend.onrender.com
   ```

2. **Frontend** (Render/Vercel → Environment):
   ```
   REACT_APP_API_URL=https://control-gastos-backend.onrender.com
   ```

3. **Redeploy** ambos servicios

---

## 🌐 URLs Finales

| Servicio | URL |
|----------|-----|
| **Frontend** | `https://control-gastos-frontend.onrender.com` |
| **Backend** | `https://control-gastos-backend.onrender.com` |
| **Base de Datos** | PostgreSQL en Render (interna) |

---

## 🧪 Verificar el Deployment

### Test Backend
```bash
curl https://control-gastos-backend.onrender.com/
```
Debería retornar: `{"message": "Control de Gastos API v2.1", ...}`

### Test Frontend
1. Abre la URL del frontend en tu navegador
2. Deberías ver la página de login

---

## 🔄 Auto-Deploy

Render se conecta directamente a tu repo GitHub. Cada `push` a **main** activará:

1. Build del backend (si hay cambios en `/backend`)
2. Build del frontend (si hay cambios en `/frontend`)

---

## 📊 Monitoreo y Logs

### Ver Logs
1. Ve al servicio en Render
2. Pestaña **"Logs"** → ver logs en tiempo real

### Ver Métricas
1. Pestaña **"Metrics"** → CPU, memoria, requests

---

## 🆕 Troubleshooting

### Error: "CORS blocked"
**Solución**: Actualiza `FRONTEND_URL` en las variables del backend

### Error: "Network Error"
**Solución**: Verifica que `REACT_APP_API_URL` sea correcta en el frontend

### Error: "Database connection failed"
**Solución**: Reconecta `DATABASE_URL` usando "Connect Database"

### Error: "Health check failed"
**Solución**: Verifica que el puerto sea `8000` y el healthcheck path sea `/`

### Build muy lento
**Solución**: En "Settings" del servicio, activa "Build Cache"

---

## 🔧 Render CLI (Opcional)

```bash
# Instalar
npm install -g render

# Login
render login

# Ver logs
render logs --service control-gastos-backend

# Abrir dashboard
render open
```

---

## ✅ Checklist de Deployment

- [ ] Cuenta en Render creada
- [ ] Repositorio GitHub conectado
- [ ] Backend desplegado (Docker)
- [ ] PostgreSQL creado
- [ ] Variables de entorno configuradas en Backend
- [ ] DATABASE_URL conectada a PostgreSQL
- [ ] URL del backend copiada
- [ ] Frontend desplegado (Render o Vercel)
- [ ] REACT_APP_API_URL configurada en Frontend
- [ ] FRONTEND_URL actualizada en Backend
- [ ] Ambos servicios redeployados
- [ ] Aplicación probada end-to-end

---

## 📝 Notas Importantes

1. **Cold Starts**: En el plan gratuito, los servicios se "duermen" después de 15 min de inactividad. La primera petición puede tardar ~30 segundos.

2. **PostgreSQL Free Tier**: Solo disponible por 90 días para nuevas cuentas. Después necesitarás actualizar al plan pago ($7/mes).

3. **Límites del Plan Free**:
   - 512 MB RAM
   - 0.1 CPU
   - 750 horas/mes
   - 100 GB de tráfico

---

## 🚀 Siguiente Paso

Una vez completado el deployment, considera:
1. Configurar un dominio personalizado
2. Setear monitoreo (Uptime monitoring)
3. Configurar backups de la base de datos

---

## 📚 Referencias

- [Render Docs - Web Services](https://render.com/docs/web-services)
- [Render Docs - PostgreSQL](https://render.com/docs/databases)
- [Render Docs - Static Sites](https://render.com/docs/static-sites)
- [Render Docs - Environment Variables](https://render.com/docs/environment-variables)
