# Migración a Supabase

La app ahora usa **Supabase** para:

- **Base de datos**: Postgres de Supabase (el backend FastAPI sigue usando SQLAlchemy, solo cambia `DATABASE_URL`).
- **Autenticación**: Supabase Auth reemplaza el login propio y el OAuth manual con Google y Microsoft
  (registro, login con email/contraseña, Google, Microsoft, Apple y recuperación de contraseña).

```
Frontend (React) ──supabase-js──► Supabase Auth (email, Google, Microsoft)
      │  Authorization: Bearer <access_token de Supabase>
      ▼
Backend (FastAPI) ── verifica el JWT ──► Supabase Postgres (users, expenses, budgets, receipt_images)
```

El backend ya no emite tokens propios: valida el JWT de Supabase (por JWKS, o con
`SUPABASE_JWT_SECRET` si el proyecto usa el secreto legacy HS256) y en el primer login
vincula el usuario de Supabase con la fila de `users` por email (o la crea).

## 1. Crear el proyecto

1. Entrá a [supabase.com](https://supabase.com) → **New project**.
2. Guardá la contraseña de la base de datos.

## 2. Crear las tablas

En **SQL Editor** → **New query**, pegá y ejecutá
[`supabase/migrations/20261029000000_initial_schema.sql`](./supabase/migrations/20261029000000_initial_schema.sql)
(o `supabase db push` si usás la CLI).

## 3. Configurar Auth

**Authentication → URL Configuration**

- **Site URL**: la URL del frontend (ej. `https://control-gastos-frontend.vercel.app`).
- **Redirect URLs**: agregá
  - `https://<tu-frontend>/oauth-callback`
  - `https://<tu-frontend>/reset-password`
  - `http://localhost:3000/**` (desarrollo)

**Authentication → Providers**

- **Email**: habilitado. Si dejás "Confirm email" activo, el usuario tiene que confirmar antes de entrar.
- **Google**: en [Google Cloud Console](https://console.cloud.google.com/apis/credentials) usá tu
  OAuth Client existente (o creá uno) y en *Authorized redirect URIs* poné
  `https://<project-ref>.supabase.co/auth/v1/callback`. Copiá Client ID y Secret en Supabase.
- **Azure (Microsoft)**: en [Azure Portal → App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
  agregá el redirect URI `https://<project-ref>.supabase.co/auth/v1/callback` (tipo *Web*),
  creá un *Client secret* y cargá Application (client) ID + Secret en Supabase.
  Tenant URL: dejalo vacío para cuentas personales y de trabajo (`common`).
- **Apple** (opcional): seguí la guía de Supabase para Sign in with Apple.

Las credenciales de Google/Microsoft ahora viven **solo en Supabase**; ya no van en el backend.

## 4. Variables de entorno

### Backend (Render / Railway / `.env`)

| Variable | Dónde se obtiene |
| --- | --- |
| `DATABASE_URL` | Project Settings → Database → Connection string → URI. En Render/Railway usá el **Session pooler** (puerto 5432), porque la conexión directa es solo IPv6. |
| `SUPABASE_URL` | Project Settings → API → Project URL |
| `SUPABASE_JWT_SECRET` | Solo si el proyecto usa el *Legacy JWT secret* (Project Settings → JWT Keys). Con las nuevas signing keys no hace falta. |
| `FRONTEND_URL` | URL del frontend (CORS) |

Se eliminan: `SECRET_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`,
`MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_REDIRECT_URI`, `APPLE_*`.

### Frontend (Vercel / `.env`)

| Variable | Valor |
| --- | --- |
| `REACT_APP_API_URL` | URL del backend |
| `REACT_APP_SUPABASE_URL` | Project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | anon / publishable key (es pública, segura para el navegador) |

> ⚠️ Nunca pongas la `service_role` key en el frontend.

## 5. Migrar los datos existentes

Si tenés datos en la base anterior (MySQL o Postgres de Render/Railway):

```bash
cd backend
pip install -r requirements.txt
pip install pymysql              # solo si el origen es MySQL

export DATABASE_URL="postgresql://postgres.<ref>:<pass>@aws-0-<region>.pooler.supabase.com:5432/postgres"
export SUPABASE_URL="https://<ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service_role key>"

python -m scripts.migrate_to_supabase --source "<URL de la base anterior>"
```

El script:

1. Copia `users`, `expenses`, `budgets` y `receipt_images` conservando los ids.
2. Crea cada usuario en Supabase Auth **con su misma contraseña** (importa el hash bcrypt)
   y con el email ya confirmado, y guarda el `supabase_id`.

Se puede volver a ejecutar sin duplicar datos. Los usuarios que antes entraban con Google o
Microsoft siguen entrando con el mismo botón: Supabase los vincula por email.

> Cambio para los usuarios: el login ahora es con **email** + contraseña (antes era usuario).

## 6. Deploy

1. Cargá las variables nuevas en Render/Railway y Vercel.
2. Hacé deploy del backend y del frontend.
3. Probá: registro, login, Google, Microsoft, "¿Olvidaste tu contraseña?" y crear un gasto.
4. Cuando todo funcione, podés borrar la base anterior.

## Pendiente / opcional

- Los comprobantes subidos siguen guardándose en el disco del backend (`uploads/receipts`).
  En Render el disco es efímero; el siguiente paso recomendado es moverlos a **Supabase Storage**.
