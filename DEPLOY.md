# Despliegue (todo gratis, sin tarjeta)

| Pieza | Servicio | Plan gratuito |
|---|---|---|
| Frontend (React) | Vercel, proyecto 1 (raíz `frontend/`) | Hobby |
| Backend (FastAPI) | Vercel, proyecto 2 (raíz `backend/`) | Hobby, funciones serverless |
| Base de datos | [Neon](https://neon.tech) | 0,5 GB, Postgres |
| Correo (recuperar contraseña) | [Resend](https://resend.com) | 3000 correos/mes |
| OCR de recibos | [OCR.space](https://ocr.space/ocrapi/freekey) | API key gratuita |

**Orden:** Neon → backend → frontend → comprobación (§4). El backend va antes que el frontend: los nombres `*.vercel.app` son
de quien los registra primero, y un frontend que apunte a un backend inexistente permitiría que otra persona lo cree y reciba los inicios de sesión.

## 1. Base de datos en Neon
1. Crea un proyecto en Neon. En **Connect** activa **Connection pooling** y copia la cadena (el host lleva `-pooler` y termina en `?sslmode=require`).
2. Crea las tablas: en el *SQL Editor* pega `backend/migrations/001_initial_schema.sql` y pulsa **Run**
   (o `psql "$DATABASE_URL" -f backend/migrations/001_initial_schema.sql`). Es idempotente. El backend también crea las tablas que falten al arrancar, pero no añade columnas a tablas existentes.
3. Comprueba que están las 4 tablas:
   ```sql
   select table_name, count(*) as columnas from information_schema.columns
   where table_schema = 'public' and table_name in ('users','expenses','budgets','receipt_images')
   group by table_name order by table_name;
   ```
   Esperado: `budgets` 8, `expenses` 10, `receipt_images` 8, `users` 8.

> Al ejecutar el archivo completo verás un aviso `column "content" of relation "receipt_images" already exists, skipping`.
> No es un error: es un `NOTICE` de la sentencia `alter ... add column if not exists`, que solo actúa en bases antiguas.

### Traer los datos de la base anterior (opcional)
Solo si la base de Supabase/Render sigue accesible:
```bash
pg_dump --data-only --no-owner "$URL_ANTIGUA" > datos.sql
psql "$DATABASE_URL" -f backend/migrations/001_initial_schema.sql
psql "$DATABASE_URL" -f datos.sql
```
- Las cuentas que conserven `hashed_password` entran con su contraseña de siempre. Las que no, deben usar **"Olvidé mi contraseña"** o Google/Microsoft con el mismo correo.
- Los recibos del disco del servidor anterior no se pueden recuperar; los nuevos se guardan en la base.

## 2. Backend en Vercel
1. *Add New → Project*, importa el repositorio y configura:

   | Campo | Valor |
   |---|---|
   | Project Name | el que quieras (Vercel puede añadir un sufijo si el nombre está ocupado, p. ej. `control-gastos-api-rose`) |
   | Framework Preset | `Other` |
   | Root Directory | `backend` |

   No hace falta `vercel.json`: Vercel detecta FastAPI por sí solo (usa `app/main.py`) e instala `backend/requirements.txt` con Python 3.12 (`backend/.python-version`).
   Una regla de reescritura a `/api/index` rompería el enrutado, por eso no hay ninguna.
2. Variables de entorno, marcadas para **Production** (y Preview si quieres previsualizaciones). Ver `backend/.env.example`:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | la cadena **Pooled** de Neon, tal cual |
   | `SECRET_KEY` | genera una con `openssl rand -hex 32` en tu terminal y pégala (no la compartas ni la subas al repo) |
   | `FRONTEND_URL` | el dominio **de producción** del frontend, con `https://` y sin barra final (varios, separados por coma). Es el único origen que acepta el CORS |
   | `BACKEND_URL` | la URL real de este proyecto (la que te asignó Vercel) |
   | `RESEND_API_KEY`, `EMAIL_FROM` | correo de recuperación (opcional) |
   | `OCR_SPACE_API_KEY` | escaneo de recibos (opcional) |
   | `GOOGLE_CLIENT_ID/SECRET`, `MICROSOFT_CLIENT_ID/SECRET` | login social (opcional) |

   > **Vercel aplica las variables solo a los despliegues nuevos.** Después de crear o cambiar una, ve a *Deployments → ⋯ → Redeploy*
   > (desmarca *Use existing Build Cache*). Sin eso, el cambio no surte efecto.
3. **Deployment Protection**: en *Settings → Deployment Protection*, el dominio de producción debe ser público. Si abres la URL y Vercel te pide iniciar sesión, desactiva *Vercel Authentication* para Production (la app ya tiene su propio login).

Límites de Vercel: cuerpo de petición de 4,5 MB (por eso los recibos admiten 4 MB), disco efímero (los recibos viven en la base) y arranque en frío de un par de segundos.

## 3. Frontend en Vercel
1. Segundo proyecto con **Root Directory = `frontend`**. Se despliega en cada fusión a `main`.
2. La URL del backend va en `frontend/.env.production` (`REACT_APP_API_URL`, sin barra final). Es pública, no un secreto, y Create React App la incorpora al compilar.
   **Nunca pongas un secreto en una variable `REACT_APP_`**: todo lo que lleva ese prefijo queda a la vista de cualquiera que abra la web.
3. ⚠️ **Una variable de Vercel con el mismo nombre tiene prioridad sobre el archivo.** Si la app apunta a un backend equivocado (por ejemplo uno antiguo), revisa *Settings → Environment Variables* del frontend y **elimina** `REACT_APP_API_URL` si existe. Si Vercel no te deja editarla o cambiarla a *Config* (le pasó al autor de esta guía), simplemente elimínala: sin ella se usa el archivo. Luego redespliega sin caché.

## 4. Comprobación de punta a punta
Sustituye las dos URLs por las tuyas. No necesitan credenciales ni crean datos.
```bash
U=https://<frontend>.vercel.app
API=https://<backend>.vercel.app

curl -s $API/                         # {"message":"Control de Gastos API v2.1",...}
curl -s -o /dev/null -w "%{http_code}\n" $API/docs        # 200
curl -s -o /dev/null -w "%{http_code}\n" $API/auth/me     # 401 (sin token)

# 1) ¿a qué API apunta el frontend publicado?
JS=$(curl -s $U/ | grep -o 'static/js/main\.[a-z0-9]*\.js' | head -1)
curl -s "$U/$JS" | grep -o 'create({baseURL:[^}]*})'       # debe mostrar la URL de tu backend

# 2) CORS: el backend debe aceptar el origen del frontend (devuelve su URL) y rechazar uno ajeno (400)
curl -s -o /dev/null -D - -X OPTIONS -H "Origin: $U" -H "Access-Control-Request-Method: POST" $API/auth/token | grep -i -E "^HTTP|access-control-allow-origin"
curl -s -o /dev/null -D - -X OPTIONS -H "Origin: https://sitio-ajeno.example" -H "Access-Control-Request-Method: POST" $API/auth/token | grep -i "^HTTP"
```
Después, en el navegador, crea una cuenta y registra un gasto.

## 5. Problemas frecuentes
| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| El backend responde `500 FUNCTION_INVOCATION_FAILED` en todas las rutas | La función se cae al arrancar | Mira el motivo real en el proyecto → **Logs** (filtra por *Error*). Casos vistos: variable de entorno que falta (`SECRET_KEY`/`DATABASE_URL`), o dependencias sin fijar que cambiaron el controlador de la base (ver §6) |
| `500` justo tras añadir variables | Se añadieron después del despliegue | *Redeploy* sin caché |
| El formulario se queda en "Creando cuenta…" / "Iniciando sesión…" | El frontend apunta a otro backend, o el CORS lo rechaza | Comprueba el punto 1 y 2 de §4. Causa real que ocurrió: `REACT_APP_API_URL` en Vercel apuntaba a un backend antiguo |
| El preflight (`OPTIONS`) devuelve `400` | `FRONTEND_URL` no coincide con el dominio real del frontend | Corrígela (con `https://`, sin barra final) y redespliega el backend |
| Vercel pide iniciar sesión al abrir la web | *Vercel Authentication* activa en producción | §2 punto 3 |
| `DEPLOYMENT_NOT_FOUND` | El nombre `*.vercel.app` no existe (o es otro proyecto) | Usa la URL exacta que muestra tu proyecto |
| Subir un recibo falla | Archivo mayor de 4 MB | Reducirlo; el límite lo impone Vercel (4,5 MB) |

## 6. Versiones de las dependencias del backend
`backend/requirements.txt` está **fijado** (versión exacta, directas y transitivas, resuelto para Linux/Python 3.12). Antes no lo estaba: Vercel instaló
SQLAlchemy 2.1, que cambió el controlador predeterminado de PostgreSQL, y la API quedó caída. Para actualizar, edita `backend/requirements.in`, vuelve a resolver
(instrucciones en el encabezado de `requirements.txt`) y abre una PR: la CI prueba con Python 3.12, igual que producción. El frontend ya está fijado por `package-lock.json`.

## 7. Login social (opcional)
Registra estas *redirect URI* en cada proveedor:
- Google: `{BACKEND_URL}/auth/google/callback` ([Google Cloud Console](https://console.cloud.google.com) → Credenciales → ID de cliente OAuth)
- Microsoft: `{BACKEND_URL}/auth/microsoft/callback` (Azure → Registros de aplicaciones)

Apple Sign In no está soportado (exige cuenta de desarrollador de pago).

## 8. Correo de recuperación
Sin dominio verificado, Resend solo permite enviar desde `onboarding@resend.dev` **al correo dueño de la cuenta de Resend**. Para escribir a cualquier usuario, verifica un dominio propio en Resend y ajusta `EMAIL_FROM`.
Sin `RESEND_API_KEY` la recuperación no envía nada (el enlace solo queda en el registro del servidor).
