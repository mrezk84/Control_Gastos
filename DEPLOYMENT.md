# 🚀 Deployment Guide - Google Cloud Run

## Requisitos previos

1. **Cuenta de Google Cloud** con facturación habilitada
2. **GitHub Repository** con el código del proyecto
3. **Google Cloud Project** creado

## 📋 Paso a paso

### 1. Crear proyecto en Google Cloud

```bash
# Instalar gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Crear proyecto
gcloud projects create control-gastos-prod
```

### 2. Habilitar APIs necesarias

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com
```

### 3. Crear repositorio Docker Artifact Registry

```bash
gcloud artifacts repositories create control-gastos \
  --repository-format=docker \
  --location=us-central1
```

### 4. Configurar base de datos (Cloud SQL)

```bash
# Crear instancia PostgreSQL
gcloud sql instances create control-gastos-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Crear base de datos
gcloud sql databases create control_gastos \
  --instance=control-gastos-db

# Crear usuario
gcloud sql users create controluser \
  --instance=control-gastos-db \
  --password=YOUR_SECURE_PASSWORD
```

### 5. Configurar Secrets en GitHub

Ve a tu repositorio en GitHub: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Agrega los siguientes secrets:

| Nombre | Valor |
|--------|-------|
| `GCP_PROJECT_ID` | `control-gastos-prod` (tu ID de proyecto) |
| `GCP_CREDENTIALS` | JSON de tu service account (ver abajo) |
| `DATABASE_URL` | `postgresql://controluser:password@//cloudsql/control-gastos-db/control_gastos` |
| `SECRET_KEY` | Clave secreta para JWT (genera una con: `openssl rand -hex 32`) |
| `GOOGLE_OAUTH_CLIENT_ID` | Tu Client ID de OAuth |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Tu Client Secret de OAuth |

### 6. Crear Service Account para GitHub Actions

```bash
# Crear service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions" \
  --project=control-gastos-prod

# Dar permisos
gcloud projects add-iam-policy-binding control-gastos-prod \
  --member="serviceAccount:github-actions@control-gastos-prod.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding control-gastos-prod \
  --member="serviceAccount:github-actions@control-gastos-prod.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding control-gastos-prod \
  --member="serviceAccount:github-actions@control-gastos-prod.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Crear clave JSON
gcloud iam service-accounts keys create credentials.json \
  --iam-account=github-actions@control-gastos-prod.iam.gserviceaccount.com
```

Copia el contenido de `credentials.json` y pégalo en el secret `GCP_CREDENTIALS` de GitHub.

### 7. Configurar OAuth (opcional)

Para Google OAuth, crea credenciales en [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Ir a APIs & Services → Credentials
2. Crear OAuth 2.0 Client ID
3. Agregar URLs de redirect:
   - `https://frontend-url/oauth-callback`
   - `http://localhost:3000/oauth-callback` (para desarrollo)

### 8. Hacer push y deploy

```bash
git add .
git commit -m "Configure deployment"
git push origin main
```

GitHub Actions automáticamente ejecutará el workflow y desplegará ambas aplicaciones.

## 🔗 URLs después del deployment

- **Backend**: `https://control-gastos-backend-xxxxx-us-central1.a.run.app`
- **Frontend**: `https://control-gastos-frontend-xxxxx-us-central1.a.run.app`

## 📝 Notas importantes

- El primer deployment puede tardar varios minutos
- Cloud Run usa HTTPS automáticamente
- Los servicios escalan automáticamente según el tráfico
- Para ver logs: `gcloud run services logs tail [SERVICE_NAME] --region=us-central1`

## 🔧 Actualizar variables de entorno en el frontend

Después del deployment, actualiza `frontend/src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://TU_BACKEND_URL',
});
```

O configura el secret en Cloud Run:

```bash
gcloud run services update control-gastos-frontend \
  --region=us-central1 \
  --set-env-vars="REACT_APP_API_URL=https://TU_BACKEND_URL"
```
