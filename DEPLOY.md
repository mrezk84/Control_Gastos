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
1. *Add New → Project*, importa este repositorio y pon **Root Directory = `backend`**. Vercel detecta `api/index.py` y `requirements.txt`.
2. Variables de entorno (ver `backend/.env.example`):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | cadena pooled de Neon |
| `SECRET_KEY` | `openssl rand -hex 32` |
| `FRONTEND_URL` | URL del frontend (varias separadas por coma) |
| `BACKEND_URL` | URL de este proyecto, p. ej. `https://control-gastos-api.vercel.app` |
| `RESEND_API_KEY`, `EMAIL_FROM` | correo de recuperación |
| `OCR_SPACE_API_KEY` | escaneo de recibos |
| `GOOGLE_CLIENT_ID/SECRET`, `MICROSOFT_CLIENT_ID/SECRET` | login social (opcional) |

3. Comprueba `https://<backend>.vercel.app/docs`.

Límites de Vercel a tener en cuenta: cuerpo de petición de 4,5 MB (por eso los recibos admiten 4 MB), disco efímero (los recibos viven en la base) y arranque en frío de un par de segundos.

## 3. Frontend en Vercel
1. Segundo proyecto con **Root Directory = `frontend`**.
2. Variable `REACT_APP_API_URL` = URL del backend, sin barra final. Se aplica al compilar: redespliega tras cambiarla.

## 4. Login social (opcional)
Registra estas *redirect URI* en cada proveedor:
- Google: `{BACKEND_URL}/auth/google/callback` ([Google Cloud Console](https://console.cloud.google.com) → Credenciales → ID de cliente OAuth)
- Microsoft: `{BACKEND_URL}/auth/microsoft/callback` (Azure → Registros de aplicaciones)

Apple Sign In no está soportado (exige cuenta de desarrollador de pago).

## 5. Correo de recuperación
Sin dominio verificado, Resend solo permite enviar desde `onboarding@resend.dev` **al correo dueño de la cuenta de Resend**. Para escribir a cualquier usuario, verifica un dominio propio en Resend y ajusta `EMAIL_FROM`.
