# Despliegue (todo gratis, sin tarjeta)

| Pieza | Servicio | Plan gratuito |
|---|---|---|
| Frontend (React) | Vercel, proyecto 1 (raíz `frontend/`) | Hobby |
| Backend (FastAPI) | Vercel, proyecto 2 (raíz `backend/`) | Hobby, funciones serverless |
| Base de datos | [Neon](https://neon.tech) | 0,5 GB, Postgres |
| Correo (recuperar contraseña) | [Resend](https://resend.com) | 3000 correos/mes |
| OCR de recibos | [OCR.space](https://ocr.space/ocrapi/freekey) | API key gratuita |

## 1. Base de datos en Neon
1. Crea un proyecto en Neon y copia la cadena **Pooled connection** (el host lleva `-pooler`).
2. Crea las tablas: en el *SQL Editor* de Neon pega `backend/migrations/001_initial_schema.sql`
   (o `psql "$DATABASE_URL" -f backend/migrations/001_initial_schema.sql`). El backend también crea
   las tablas que falten al arrancar, pero no añade columnas a tablas ya existentes.

### Traer los datos de la base anterior (opcional)
Solo si la base de Supabase/Render sigue accesible:
```bash
pg_dump --data-only --no-owner --exclude-table-data='_*' "$URL_ANTIGUA" > datos.sql
psql "$DATABASE_URL" -f backend/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f datos.sql
```
- Las cuentas que conserven `hashed_password` entran con su contraseña de siempre.
- Las que no la tengan (se crearon al migrar a Supabase) deben usar **"Olvidé mi contraseña"** o iniciar sesión con Google/Microsoft con el mismo correo.
- Los recibos que estaban en el disco del servidor anterior no se pueden recuperar; los nuevos se guardan en la base.

## 2. Backend en Vercel
> **Hazlo antes de publicar el frontend.** Los nombres `*.vercel.app` son de quien los registra primero: si el
> frontend apunta a un backend que aún no existe, cualquiera podría crear ese nombre y recibir los inicios de sesión.

1. *Add New → Project*, importa este repositorio, deja **Framework Preset = Other** y pon **Root Directory = `backend`**. Vercel detecta `api/index.py` y `requirements.txt`. Anota la URL que te asigne.
2. Variables de entorno (ver `backend/.env.example`):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | cadena pooled de Neon |
| `SECRET_KEY` | genera una con `openssl rand -hex 32` en tu terminal y pégala (no la compartas ni la subas al repo) |
| `FRONTEND_URL` | URL del frontend (varias separadas por coma) |
| `BACKEND_URL` | URL de este proyecto, p. ej. `https://control-gastos-api.vercel.app` |
| `RESEND_API_KEY`, `EMAIL_FROM` | correo de recuperación |
| `OCR_SPACE_API_KEY` | escaneo de recibos |
| `GOOGLE_CLIENT_ID/SECRET`, `MICROSOFT_CLIENT_ID/SECRET` | login social (opcional) |

3. Comprueba `https://<backend>.vercel.app/docs` y la raíz `https://<backend>.vercel.app/` (debe responder `{"message": "Control de Gastos API v2.1", ...}`).
4. **Deployment Protection**: en *Settings → Deployment Protection* del proyecto, desactiva *Vercel Authentication* para Production. Si está activa, el navegador recibe una redirección al login de Vercel en lugar de la API.

Límites de Vercel a tener en cuenta: cuerpo de petición de 4,5 MB (por eso los recibos admiten 4 MB), disco efímero (los recibos viven en la base) y arranque en frío de un par de segundos.

## 3. Frontend en Vercel
1. Segundo proyecto con **Root Directory = `frontend`**.
2. La URL del backend va en `frontend/.env.production` (`REACT_APP_API_URL`, sin barra final): es pública, no un secreto, y Create React App la incorpora al compilar. Si prefieres, puedes definirla también como variable de entorno en Vercel con ese mismo nombre y tendrá prioridad; pero Vercel avisa de que los prefijos públicos (`REACT_APP_`) exponen el valor al navegador y puede no dejar guardarla como variable *sensible*: por eso el archivo es la vía más simple. **Nunca pongas un secreto en una variable `REACT_APP_`.** Se aplica al compilar: redespliega tras cambiarla.
3. En el backend, `FRONTEND_URL` debe ser la URL pública del frontend (varias, separadas por coma): es el origen que acepta el CORS.
4. Si el frontend también tiene *Vercel Authentication* activa, la app solo la verá quien tenga cuenta de Vercel en tu equipo: desactívala para Production, porque la app ya tiene su propio login.

## 4. Login social (opcional)
Registra estas *redirect URI* en cada proveedor:
- Google: `{BACKEND_URL}/auth/google/callback` ([Google Cloud Console](https://console.cloud.google.com) → Credenciales → ID de cliente OAuth)
- Microsoft: `{BACKEND_URL}/auth/microsoft/callback` (Azure → Registros de aplicaciones)

Apple Sign In no está soportado (exige cuenta de desarrollador de pago).

## 5. Correo de recuperación
Sin dominio verificado, Resend solo permite enviar desde `onboarding@resend.dev` **al correo dueño de la cuenta de Resend**. Para escribir a cualquier usuario, verifica un dominio propio en Resend y ajusta `EMAIL_FROM`.
