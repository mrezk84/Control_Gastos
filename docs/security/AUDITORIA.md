# Auditoría de seguridad

Fecha: 2026-11-09. Commit revisado: `e8c45d7`.

## Alcance y resultado

Revisión de rutas FastAPI, autenticación local y social, autorización por usuario, archivos, exportaciones, notificaciones, frontend, configuración y dependencias fijadas. Se identificaron nueve hallazgos: cinco de prioridad alta y cuatro de prioridad media. Las prioridades consideran impacto y condiciones de explotación; no representan puntuaciones CVSS calculadas.

Se ejecutaron 109 pruebas existentes del backend, todas satisfactorias, y seis pruebas adicionales que reproducen comportamientos vulnerables. Estas últimas pasan cuando el defecto está presente: no son pruebas que certifiquen seguridad. Utilizan SQLite en memoria, cuentas ficticias y transporte HTTP interceptado. No se realizaron ataques, envíos de correos ni cambios en producción.

## Hallazgos

### 1. Alta — Apropiación anticipada de cuentas por vinculación automática de correo

Evidencia: `backend/app/routes/auth.py:54`, `backend/app/routes/oauth_routes.py:75`.

El registro local acepta un correo sin demostrar su propiedad. El acceso social busca una cuenta por ese correo y devuelve la cuenta existente sin exigir autenticación previa ni eliminar su contraseña local. Un atacante puede registrar primero el correo de una futura víctima con una contraseña propia. Cuando la víctima ingresa con Google o Microsoft, empieza a usar esa misma cuenta; el atacante conserva acceso con su contraseña y puede consultar sus gastos y recibos.

La prueba `test_oauth_email_links_different_subject` confirma que una identidad social con otro identificador se vincula a la cuenta local y conserva su contraseña. El recorrido completo en un proveedor real no se ejecutó. Adicionalmente, la búsqueda ignora el identificador estable del proveedor en accesos posteriores; Microsoft se acepta solamente por correo. Microsoft documenta el riesgo de usar ese atributo mutable como identidad: [recomendación oficial](https://www.microsoft.com/en-us/msrc/blog/2023/06/potential-risk-of-privilege-escalation-in-azure-ad-applications/).

Corrección: verificar el correo antes de habilitar cuentas locales; identificar accesos sociales por proveedor/emisor y sujeto estable; exigir una sesión autenticada y reautenticación para vincular métodos. Resolver explícitamente las colisiones de correo, sin fusionar cuentas automáticamente.

### 2. Alta — Solicitudes del servidor a destinos arbitrarios mediante Web Push (SSRF)

Evidencia: `backend/app/routes/push.py:18`, `backend/app/routes/push.py:43`, `backend/app/services/push.py:39`.

Una cuenta autenticada puede guardar cualquier endpoint de hasta 1000 caracteres. Al crear un gasto con `from_scan=true`, la aplicación envía una notificación a ese endpoint. No se restringen esquema, dominio, direcciones internas ni redirecciones. Requiere Web Push habilitado y conectividad del despliegue al destino.

La prueba `test_push_ssrf_uses_private_endpoint` genera claves válidas, registra `https://127.0.0.1:8443/internal` e intercepta el POST que intenta realizar la biblioteca real. No se conecta a ese host. Confirma control del destino, no lectura de respuestas internas ni ejecución de comandos. El cuerpo está cifrado y limita posibles ataques contra protocolos internos.

Corrección: permitir únicamente servicios push admitidos mediante una lista explícita de hosts HTTPS y puertos; rechazar IP privadas, locales y reservadas al resolver DNS; impedir redirecciones fuera de esa política; aplicar restricciones de salida de red y un timeout corto explícito. Limitar suscripciones por usuario.

### 3. Alta — Sin limitación efectiva de intentos de autenticación y correo

Evidencia: `backend/app/routes/auth.py:88`, `backend/app/routes/auth.py:173`, `backend/app/rate_limiter.py:109`, `backend/app/main.py`.

El limitador existe pero ninguna ruta ni middleware lo invoca. La prueba `test_login_without_rate_limit` efectúa doce intentos consecutivos desde el mismo cliente: todos devuelven 401 y ninguno 429, superando el límite declarado de cinco. Facilita ataques de contraseñas; el endpoint de recuperación también permite abuso del envío de correo. Las contraseñas admiten solamente seis caracteres como mínimo.

Corrección: límites persistentes y compartidos entre instancias por cuenta e IP, retrasos progresivos y límites específicos de registro y correo. No basta conectar el limitador actual en Vercel: mantiene estado en memoria y confía directamente en `X-Forwarded-For`. Usar exclusivamente la información de proxy que la infraestructura garantice como confiable. No se verificaron posibles reglas WAF externas.

### 4. Alta — Recuperación reutilizable y sesiones que sobreviven al cambio de contraseña

Evidencia: `backend/app/routes/auth.py:195`, `backend/app/routes/auth.py:222`, `backend/app/auth/utils.py:130`.

El enlace de recuperación es un JWT válido durante quince minutos sin registro de consumo. La prueba `test_reset_reusable_and_old_session_valid` confirma que el mismo enlace cambia la contraseña dos veces y que un token de sesión anterior sigue accediendo a `/auth/me` después del primer cambio.

Un atacante que ya obtuvo el enlace puede volver a cambiar la contraseña hasta su vencimiento; uno que obtuvo una sesión conserva acceso después de la recuperación, hasta que expire su JWT. El valor predeterminado de sesión es 24 horas y es configurable.

Corrección: token aleatorio de recuperación con hash almacenado, expiración y consumo atómico de un solo uso; invalidar otros enlaces y sesiones al restablecer mediante versión de sesión o fecha de revocación verificadas en cada petición.

### 5. Media — Login CSRF y sustitución de sesión en el acceso social

Evidencia: `backend/app/routes/oauth_routes.py:60`, `frontend/src/components/OAuthCallback.js:12`.

El state firmado no contiene un nonce aleatorio asociado al navegador, no se guarda en una sesión/cookie y no se consume. La prueba `test_oauth_state_reusable_without_browser_binding` confirma validaciones repetidas sin contexto del navegador. Además, el frontend acepta directamente cualquier token recibido en `/oauth-callback?token=...` y reemplaza la sesión local. Un atacante puede enviar a una víctima un enlace con su propia sesión para inducirla a cargar información financiera en la cuenta del atacante.

Corrección: state aleatorio de un solo uso vinculado al navegador, PKCE y un intercambio final que valide la transacción iniciada por ese navegador. El callback de la SPA tampoco debe aceptar una sesión arbitraria desde un enlace. La vinculación y uso único corresponden a las recomendaciones de [RFC 9700](https://www.rfc-editor.org/info/rfc9700/).

### 6. Media — Token de acceso en la URL del callback

Evidencia: `backend/app/routes/oauth_routes.py:167`, `frontend/src/components/OAuthCallback.js:13`.

Se entrega el JWT de sesión completo en la query string. El frontend reemplaza después la URL, pero el token ya pudo quedar en registros HTTP, herramientas de observabilidad o capturas del enlace. No se verificó que esos registros existan ni una filtración real.

Corrección: entregar un código aleatorio, breve y de un solo uso; canjearlo por POST validando la transacción y retirar la query inmediatamente. Revisar redacción de registros y políticas de caché. El uso de localStorage amplifica el impacto de un eventual XSS, pero no se encontró un XSS ejecutable que permita afirmarlo como explotación comprobada.

### 7. Media — Fórmulas inyectadas en exportaciones CSV y Excel

Evidencia: `backend/app/routes/expenses.py:144`, `backend/app/routes/expenses.py:173`.

Descripción y categoría llegan sin neutralización a las hojas. La prueba `test_excel_formula_injection` guarda `=1+1`, exporta el archivo y confirma que la celda B2 tiene tipo fórmula (`f`). El CSV también conserva esos prefijos. Una descripción importada desde un CSV puede introducir fórmulas que el usuario ejecute posteriormente al abrir su exportación.

La explotación requiere abrir el archivo en un programa que interprete fórmulas. El efecto de enlaces externos u otras fórmulas depende del programa y sus controles; no se comprobó ejecución de comandos ni extracción de datos.

Corrección: forzar tipo texto en celdas XLSX originadas en entradas de usuario y neutralizar prefijos de fórmula en CSV, considerando `=`, `+`, `-`, `@` y caracteres iniciales de control. Las comillas de CSV por sí solas no resuelven el problema.

### 8. Media — Procesamiento y almacenamiento sin cuotas suficientes

Evidencia: `backend/app/routes/expenses.py:197`, `backend/app/routes/receipts.py:28`, `backend/app/services/ocr_service.py:65`, `backend/app/routes/expenses.py:42`.

La importación CSV lee todo el cuerpo y recorre todas las filas, sin máximo de registros. Los recibos se leen completos antes de verificar 4 MB y pueden acumularse sin cuota por usuario. Los PDF se procesan sin límite de páginas ni tiempo, dentro de una ruta asíncrona con trabajo síncrono. Los listados de gastos y recordatorios carecen de paginación. Esto permite a una cuenta consumir base de datos, CPU, memoria o cuota de OCR.

Vercel limita el tamaño de una petición, como indica el propio código, pero no establece cuotas acumuladas ni acota la complejidad de un PDF pequeño. Este hallazgo es una revisión estática; no se ejecutaron cargas de agotamiento.

Corrección: límites de cuerpo antes de materializarlo, lectura acotada, máximo de filas y páginas, cuotas de almacenamiento y OCR, paginación y procesamiento aislado con límites de CPU/memoria y tiempo.

### 9. Alta — Dependencias con avisos conocidos; exposición condicionada al uso

Resultados completos: `npm-audit.json` y `pip-audit.json`, obtenidos durante esta revisión. Los códigos de salida 1 indican avisos encontrados.

`npm audit --json --package-lock-only` informa **69 paquetes afectados**: 4 críticos, 32 altos, 14 moderados y 19 bajos. No son 69 exploits independientes: el conteo incluye paquetes afectados por dependencias transitivas. Los críticos son `form-data`, `proxy-addr`, `shell-quote` y `websocket-driver`. La cadena de `react-scripts` incorpora herramientas de compilación y desarrollo; el lockfile las clasifica como producción, pero eso no demuestra que se ejecuten en el sitio estático publicado. No se confirmó una explotación remota del frontend desplegado por estos avisos.

`pip-audit -r backend/requirements.txt --no-deps --disable-pip --format json` devuelve tres entradas en dos paquetes, equivalentes a **dos avisos únicos**:

| Paquete | Aviso | Aplicabilidad observada |
| --- | --- | --- |
| `ecdsa==0.19.2` | CVE-2024-23342 / GHSA-wj6h-64fc-37mp | Aparece duplicado en la respuesta. Ataque temporal contra operaciones criptográficas específicas; no se identificó firma ECDSA con esta biblioteca en la aplicación. |
| `python-jose==3.5.0` | CVE-2026-85394 / GHSA-3qf3-8w2g-rqmx | Confusión con claves asimétricas DER. Las llamadas revisadas fijan HS256 y usan un secreto simétrico; no se reprodujo el ataque descrito. |

La consulta no ofrece versiones corregidas para esos avisos Python. No presentar una actualización arbitraria como solución. `--no-deps` audita las versiones enumeradas en el requirements, sin resolver dependencias adicionales ni demostrar coincidencia con producción.

Corrección: actualizar y revisar transitivas, validar cada aviso contra su ruta de ejecución y sustituir progresivamente la cadena de compilación heredada si impide corregirla. No ejecutar `npm audit fix --force` sin revisión: la respuesta propone incluso `react-scripts@0.0.0`, lo cual no constituye una migración válida. Añadir auditorías de dependencias a CI y evaluar librerías criptográficas mantenidas.

## Controles que se observaron

Las operaciones revisadas de gastos, presupuestos, recibos, recordatorios y notificaciones filtran por propietario. No se identificó acceso directo a objetos de otro usuario en esas rutas. El cron exige secreto y falla cerrado cuando falta. Los JWT restringen algoritmo y los tokens de recuperación se rechazan como sesiones. Las contraseñas se almacenan con bcrypt. No se encontraron valores de credenciales reales en los archivos de entorno versionados revisados; los `.env` locales no se imprimieron. No se efectuó un análisis exhaustivo del historial Git.

## Validación reproducible

Desde la raíz del repositorio:

```sh
cd backend
venv/bin/python -m pytest -q
cd ..
backend/venv/bin/python -m pytest -q -c backend/pytest.ini --rootdir=docs/security --confcutdir=docs/security docs/security/test_security_probes.py
```

Las seis pruebas de auditoría documentan el estado vulnerable. Después de corregirlo deben invertirse para exigir rechazo, revocación o neutralización según corresponda. No incorporarlas a CI como criterio de seguridad satisfactorio en su forma actual.

## Orden de corrección y límites

Primero resolver vinculación de cuentas, SSRF, límites de autenticación y recuperación. Después corregir callbacks, exportaciones y cuotas; tratar las dependencias en paralelo según exposición real.

No se modificó lógica de aplicación. No se inspeccionaron configuración efectiva del despliegue, WAF, registros, permisos de la base, imágenes construidas ni infraestructura de terceros. Los resultados corresponden al código local y a las versiones declaradas; las pruebas funcionales satisfactorias no descartan vulnerabilidades adicionales.

## Estado de la remediación

Rama `fix/auditoria-seguridad`. Pruebas del backend: 193 satisfactorias (las 109 previas, adaptadas donde el comportamiento cambió a propósito, más las regresiones de `backend/tests/test_security.py`). Pruebas del frontend: 50 satisfactorias.

| # | Hallazgo | Estado | Qué se hizo |
| --- | --- | --- | --- |
| 1 | Apropiación anticipada por correo | **Corregido, con una decisión pendiente** | El acceso social identifica por (proveedor, sujeto estable) y no vincula por correo. Si el correo ya tiene una cuenta con contraseña, se ofrece vincular exigiendo la contraseña de esa cuenta (además de la identidad del proveedor y del verificador del navegador), con 5 intentos por cuenta cada 15 minutos. Pendiente: verificar el correo de las cuentas locales (ver abajo). |
| 2 | SSRF por Web Push | **Corregido** | Lista de hosts de servicios push (HTTPS, puerto 443, sin IP ni credenciales; ampliable con `PUSH_ALLOWED_HOSTS`), validación al suscribir y al enviar, comprobación de DNS a direcciones públicas, sin redirecciones, timeout de 10 s y tope de 10 suscripciones por persona. |
| 3 | Sin limitación de intentos | **Corregido** | Limitador compartido en la base de datos (`rate_limit_hits`): login por cuenta (5 en 15 min) y por IP, registro, recuperación y canje OAuth. IP de proxy solo si la infraestructura lo garantiza. Contraseña mínima de 8 caracteres (máx. 128). |
| 4 | Recuperación reutilizable / sesiones vivas | **Corregido** | Token aleatorio, solo se guarda su hash, un solo uso atómico, 15 min; pedir otro invalida el anterior. Al restablecer sube `users.token_version` y las sesiones anteriores dejan de valer. |
| 5 | Login CSRF en el acceso social | **Corregido** | State aleatorio de un solo uso, PKCE con el proveedor y código de canje atado al navegador que inició el flujo (verificador en sessionStorage). |
| 6 | Token en la URL del callback | **Corregido** | La URL solo lleva un código de un solo uso y 60 s de vida; el JWT se obtiene por `POST /auth/oauth/exchange`. |
| 7 | Fórmulas en CSV y Excel | **Corregido** | Excel fuerza tipo texto; CSV antepone `'` a `=`, `+`, `-`, `@`, tabulación y retorno de carro; la importación revierte esa comilla para que exportar e importar no la acumule. |
| 8 | Cuotas y procesamiento | **Corregido, con límites residuales** | Lectura acotada, importación máx. 1 MB y 5000 filas, listados con `limit`/`offset`, cuota de recibos por persona (200 y 50 MB), 40 escaneos por hora, PDF máx. 10 páginas con hilo y tiempo máximo, tope de píxeles, tope de 5 MB por petición. |
| 9 | Dependencias | **Corregido** | Python: `python-jose` y `ecdsa` sustituidos por PyJWT (`pip-audit` sin avisos). Frontend: se migró de Create React App a Vite y Vitest (los 69 paquetes afectados venían de `react-scripts`) y `react-router-dom` pasó a 7.x por un aviso de redirección abierta; `npm audit` queda en 0. No se ejecutó `npm audit fix --force`. CI ejecuta ambas auditorías y bloquea el PR ante avisos altos o críticos. |

### Pendiente y límites

- **Verificación de correo de cuentas locales (hallazgo 1).** No se activó porque el correo solo llega a una dirección mientras Resend no tenga dominio propio verificado (tarea ya abierta en Notion). Con esta rama el ataque descrito ya no funciona, pero conviene verificar el correo en cuanto el envío sea posible. Las cuentas que ya estuvieran vinculadas por el comportamiento anterior no se corrigen solas: revisar en la base las cuentas con `hashed_password` y `provider_id` a la vez.
- **Migración obligatoria antes de desplegar:** `backend/migrations/003_seguridad.sql` (añade `users.token_version`; sin ella fallan todas las lecturas de usuarios). Los enlaces de recuperación enviados antes del cambio dejan de funcionar.
- **Límites residuales:** la creación de gastos uno a uno no tiene tope por persona; el limitador usa la base de datos (una escritura por intento) y no un servicio como Redis; el tiempo máximo del PDF no puede matar el hilo, solo liberar la petición; no se inspeccionó la configuración efectiva de Vercel, WAF ni registros.
- **Pruebas de la auditoría:** `docs/security/test_security_probes.py` documentaba el estado vulnerable y ahora falla a propósito; está sustituido por `backend/tests/test_security.py` y puede eliminarse. Se dejó sin tocar por ser parte del material de la auditoría.
