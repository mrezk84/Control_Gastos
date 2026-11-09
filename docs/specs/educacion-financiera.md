# Spec: educación financiera, chat tutor y app móvil

Fuente de verdad de la evolución de Control Gastos hacia una app de **educación financiera**.
Se implementa por fases, cada una en uno o varios PR pequeños. El diseño visual sigue
[../design/SPEC.md](../design/SPEC.md) y sus tokens; las pantallas nuevas pasan por Claude Design
antes de implementarse.

## Concepto
Control Gastos deja de ser solo un registro de gastos: ayuda a **entender el dinero y a mejorarlo**,
usando los datos de cada persona. Se apoya en tres pilares:

- **Aprender:** lecciones cortas (3 a 5 minutos) en rutas progresivas.
- **Practicar:** quizzes, simuladores y retos.
- **Aplicar:** un **chat tutor** y sugerencias que parten de los gastos reales de la persona
  ("gastás el 35 % en delivery; mirá esta lección").

El registro rápido de gastos se mantiene como base: es lo que alimenta todo lo demás.

## Público
Principiantes adultos que empiezan a ordenar sus finanzas. Tono cercano, sin jerga, en español.
El contenido se adapta al país y la moneda del perfil (`User.country`, `User.currency`).

## Alcance
- Chat tutor con la API de Claude, con acceso de solo lectura a los datos de la persona.
- Lecciones, quizzes, progreso, retos, simuladores, logros y rachas.
- App móvil para iOS y Android con Capacitor, reutilizando el frontend React.
- Saneamiento técnico previo (Fase 0) necesario para operar con dinero y con IA.

**Fuera de alcance:** asesoría de inversión personalizada, recomendar productos, activos o entidades
concretas, pagos, escritura de datos desde el chat (el tutor solo lee), idiomas distintos del español.

## Fases

| Fase | Contenido | Depende de |
|---|---|---|
| 0 | Saneamiento técnico | — |
| 1 | MVP del chat tutor | 0 (rate limiting, montos) |
| 2 | Lecciones y quizzes | 1 |
| 3 | Personalización (RAG, sugerencias, retos) | 2 |
| 4 | Retención (simuladores, logros, analíticas) | 2 |
| 5 | App móvil con Capacitor | 0 (Vite); en paralelo a 2–4 |

### Estado de la implementación
- **Hecho:** Fase 0, punto 4 (limitador de intentos, PR #42) y punto 5 (Vite y Vitest, PR #43). Además, las correcciones de la
  auditoría de seguridad (`docs/security/AUDITORIA.md`, PR #42), que cambian el acceso social, la recuperación de contraseña,
  Web Push y las cuotas; las fases siguientes parten de ese estado.
- **Pendiente:** Fase 0, puntos 1 a 3 (montos en `Decimal`, Alembic, recibos fuera de la base) y las fases 1 a 5.
- **Decisiones tomadas al implementar:** el limitador usa la base de datos y no Redis; el frontend usa Vite 8 con Node 22.

## Fase 0: saneamiento técnico
1. **Montos en `Decimal`.** `amount` pasa de `Float` a `Numeric(12,2)` en `Expense`, `Budget` y
   `PaymentReminder` (`backend/app/models.py`), con `Decimal` en `schemas.py`. El JSON sigue
   entregando números. Migración que redondea a 2 decimales.
2. **Alembic.** Se adopta para el esquema; `migrations/001_initial_schema.sql` y `002_recordatorios.sql`
   son la base y la primera revisión parte de ese estado.
3. **Recibos fuera de la base.** `ReceiptImage.content` (`LargeBinary`) pasa a almacenamiento de
   objetos (Cloudflare R2, compatible con S3). Se migran los recibos existentes y se conserva
   la lectura del campo antiguo hasta terminar.
4. **Rate limiting distribuido. Hecho (PR #42).** El limitador en memoria no servía con varias instancias. Se reescribió
   `backend/app/rate_limiter.py` sobre la base de datos (tabla `rate_limit_hits`, migración `003_seguridad.sql`) en lugar de
   Upstash Redis: la base ya la comparten todas las instancias y no suma infraestructura. Cada intento se registra antes de
   contarse; la API es `rate_limiter.hit(db, ámbito, identificador, límite, ventana)`. La IP del cliente solo se toma de
   cabeceras de proxy si la infraestructura lo garantiza (Vercel o `TRUST_PROXY_HEADERS`). El chat lo reutiliza para su
   tope por persona. Si el tráfico crece, se revisará el coste de una escritura por intento y se valorará Redis.
5. **Frontend con Vite. Hecho (PR #43).** Se migró de Create React App (deprecado) a Vite 8, con Vitest 5 para las pruebas.
   Los 24 componentes con JSX pasaron a `.jsx`, `src/index.js` a `src/main.jsx`, y `REACT_APP_*` a `VITE_*`
   (`VITE_API_URL`). La carpeta de salida sigue siendo `build/`. Requiere Node 22.12 o superior (CI y Dockerfile ya lo usan).
   Con esto `npm audit` pasó de 69 avisos a 0. Sigue sin TypeScript.

## Fase 1: MVP del chat tutor

### Flujo
1. La persona abre el panel de chat (botón flotante) o toca una pregunta sugerida.
2. El frontend envía el mensaje a `POST /chat/conversations/{id}/messages`.
3. El backend arma la consulta al modelo con el prompt de sistema y el historial, y ejecuta las
   herramientas que el modelo pida.
4. La respuesta llega por streaming (SSE) y se guarda al terminar.

### API
Router nuevo `backend/app/routes/chat.py`, registrado en `main.py` con prefijo `/chat`. Todas las
rutas exigen sesión (`auth/utils.py:get_current_user`).

| Método y ruta | Función |
|---|---|
| `POST /chat/conversations` | Crea una conversación |
| `GET /chat/conversations` | Lista las propias, de la más reciente a la más antigua |
| `GET /chat/conversations/{id}` | Mensajes de una conversación |
| `POST /chat/conversations/{id}/messages` | Envía un mensaje; responde con SSE |
| `DELETE /chat/conversations/{id}` | Borra la conversación y sus mensajes |

### Tutor (`backend/app/services/tutor.py`)
- SDK `anthropic`. Modelo por defecto: Claude Haiku 5.5; configurable con `CHAT_MODEL`
  (Sonnet 5.5 para análisis más largos).
- **Prompt de sistema** pedagógico (tono, nivel, formato breve, país y moneda del perfil), con
  **prompt caching**.
- **Tool use** de solo lectura. Cada herramienta filtra siempre por la persona autenticada y
  reutiliza consultas de `crud.py`:
  - `resumen_mes`: total, por categoría y comparación con el mes anterior.
  - `gastos_por_categoria`: rango de fechas y categoría.
  - `presupuestos`: presupuestos del mes y avance.
  - `recordatorios_pendientes`: pagos por vencer.
- Se envían **datos agregados**, no descripciones de gastos, salvo que la pregunta lo requiera.
- Límite de pasos por respuesta para evitar bucles de herramientas.

### Modelo de datos
- `ChatConversation`: `id`, `user_id`, `title`, `created_at`, `updated_at`.
- `ChatMessage`: `id`, `conversation_id`, `role` (`user` | `assistant`), `content`, `input_tokens`,
  `output_tokens`, `created_at`.

### Límites y configuración
- Variables nuevas: `ANTHROPIC_API_KEY`, `CHAT_MODEL`, `CHAT_DAILY_LIMIT` (mensajes por persona y
  día), `CHAT_MAX_INPUT_CHARS`. Se documentan en `backend/.env.example` y en `config.py`.
- Rate limiting por persona con `rate_limiter.hit` (ya implementado, Fase 0) y tope diario de mensajes; al superarlo la API
  responde 429 con un mensaje claro.

### Salvaguardas
- Aviso visible en el panel: "Educación financiera, no asesoría profesional".
- El tutor **no recomienda** activos, productos ni entidades concretas, ni promete rendimientos;
  explica conceptos y compara opciones de forma general.
- Ante temas fuera de finanzas personales, responde brevemente y reconduce.
- La clave de Anthropic vive solo en el backend. Los logs no guardan el contenido de los mensajes.
- Ante una crisis de deudas o de salud mental, sugiere buscar ayuda profesional.

### Frontend
- `frontend/src/components/chat/ChatPanel.js`: panel flotante, abierto desde `FloatingActionButton`.
  Preguntas sugeridas, render de markdown, indicador de escritura y estados de error y límite.
- Streaming con `fetch` y `ReadableStream`, porque axios no lo soporta. Se añaden las funciones al
  módulo `services/api.js` reutilizando el token existente.
- Accesible: foco gestionado, `aria-live` en las respuestas, objetivos táctiles ≥ 44 px.

### Pruebas y evaluación
- `backend/tests/test_chat.py` con el cliente de Anthropic simulado: aislamiento entre personas,
  límites, borrado y errores del proveedor.
- `backend/evals/chat_cases.yaml`: preguntas normales y casos adversos (pedir "en qué acción invertir",
  inyección de instrucciones, pedir datos de otra persona). Se ejecutan a mano antes de cambiar
  de modelo o de prompt.

## Fase 2: contenido educativo
- Modelos: `Lesson`, `LessonProgress`, `Quiz`, `QuizAttempt`.
- Las lecciones se escriben en Markdown en `content/lessons/<slug>.md` con frontmatter
  (título, nivel, duración, países, orden). Un script las carga en la base.
- Router `/learn` (listado, detalle, progreso, intento de quiz) y páginas `Learn.js` y `Lesson.js`,
  con una entrada nueva en `AppLayout`.
- Las primeras ocho lecciones: presupuesto 50/30/20, gastos hormiga, fondo de emergencia, deudas y
  tarjetas, interés compuesto, inflación, ahorro con objetivos y primeros pasos para invertir.
  Claude redacta borradores; **una persona con criterio financiero los revisa antes de publicar**.

## Fase 3: personalización
- **RAG:** pgvector en Neon, con embeddings de las lecciones y una herramienta `buscar_lecciones`
  para que el chat cite el contenido de la app.
- **Lección sugerida** en el Dashboard según el patrón de gastos (parte de `utils/dashboardStats.js`).
- **Retos** (`Challenge`, `ChallengeProgress`), por ejemplo "7 días sin gasto hormiga", con
  seguimiento automático a partir de los gastos registrados.

## Fase 4: retención
- **Simuladores:** interés compuesto, préstamo y meta de ahorro, como funciones puras con tests.
- **Logros y rachas** moderados; sin presión ni mensajes de culpa.
- **Recordatorios de aprendizaje** con la infraestructura de notificaciones existente
  (`services/push.py`, `routes/cron.py`).
- **Analíticas del producto** (PostHog) para medir lecciones completadas y uso del chat, sin
  enviar montos ni descripciones.

## Fase 5: app móvil con Capacitor
Depende de la migración a Vite (Fase 0) y puede avanzar en paralelo a las Fases 2–4.

- **Proyecto:** Capacitor dentro de `frontend/` (`capacitor.config.ts`, carpetas `ios/` y `android/`),
  appId `uy.controlgastos.app`. La misma base de código sirve para web y móvil.
- **API:** el build móvil usa la URL absoluta del backend. Se añaden `capacitor://localhost` y
  `https://localhost` a los orígenes permitidos por CORS (`backend/app/main.py`, `frontend_url.py`).
- **Token:** en móvil pasa de `localStorage` a `@capacitor/preferences` (o almacenamiento seguro),
  encapsulado en `utils/storage.js`; en web sigue usando `localStorage`. `services/api.js` lo consume.
- **OAuth (Google y Microsoft):** el flujo web ya usa un `state` aleatorio de un solo uso, PKCE con el proveedor y un código
  de canje de 60 s atado al navegador (`OAuthFlow`, `POST /auth/oauth/exchange`; el JWT no viaja por la URL). En móvil se abre
  con `@capacitor/browser` y vuelve por deep link `controlgastos://oauth-callback?code=…`; la app canjea el código con el
  verificador que guardó al empezar (hoy en `sessionStorage`, `utils/oauthPkce.js`; en la app irá en su almacenamiento).
  `routes/oauth_routes.py` elige el destino según un campo `platform` guardado en la transacción `OAuthFlow`, que se consume
  una sola vez. Universal Links y App Links quedan como mejora.
- **Cámara y archivos:** `@capacitor/camera` y selector nativo. La lectura de QR con `jsQR` y los
  endpoints `/receipts/scan` y `/receipts/qr` no cambian.
- **Push nativo:** `@capacitor/push-notifications` con FCM (en iOS entrega vía APNs). Backend:
  modelo `DeviceToken` (`user_id`, `token`, `platform`), ruta `POST /push/devices` y envío por FCM
  (`firebase-admin`) desde `services/push.py:send_push`, junto al Web Push actual. El cron de
  recordatorios no cambia.
- **Chat:** el streaming con `fetch` funciona en el WebView; se verifica en dispositivos reales.
- **UX nativa:** splash, iconos, barra de estado acorde al tema, áreas seguras
  (`safe-area-inset`), botón atrás de Android y teclado (`@capacitor/keyboard`).
- **Publicación:** cuentas de Apple Developer (99 USD al año) y Google Play (25 USD, pago único),
  política de privacidad pública, declaración de datos financieros en Play, capturas y fichas.
  Builds en GitHub Actions, primero en TestFlight y en prueba interna de Play.
- **Pruebas:** manuales en un iPhone y un Android reales (login, OAuth, escaneo, push, chat) y tests
  unitarios de `utils/storage.js`, del guardado del verificador y de la elección de destino en OAuth.

## Seguridad y privacidad
- Base ya aplicada (PR #42, `docs/security/AUDITORIA.md`): identidad social por sujeto del proveedor (sin vincular por correo),
  recuperación de contraseña de un solo uso con revocación de sesiones, limitador de intentos, lista de hosts para Web Push,
  neutralización de fórmulas en exportaciones y cuotas de carga. El chat y la app móvil deben respetarla.
- Datos financieros: el tutor solo lee, siempre acotado a la persona autenticada.
- Minimización: datos agregados al modelo; sin contenido de mensajes en logs ni en analíticas.
- Permitir borrar conversaciones y, con la cuenta, todo el contenido asociado.
- Política de privacidad y términos antes de publicar en las tiendas, indicando el uso de un proveedor de IA.

## Salvedades
- **Costo de la API:** depende del uso; se controla con el modelo por defecto, el caching y los límites diarios.
- **Aviso legal:** el texto "educación, no asesoría" debe revisarlo alguien con conocimiento legal.
- **Contenido:** las lecciones generadas con IA requieren revisión experta.
- **Streaming en Vercel:** hay que confirmar en la Fase 1 que el despliegue Python soporta SSE; si no,
  se mueve el chat a otro servicio.
- **Tiendas:** Apple puede rechazar un WebView sin valor nativo; conviene destacar cámara, push y chat.
- **iOS:** compilar requiere un Mac con Xcode.
- **Verificación de correo:** las cuentas locales aún no verifican su correo; depende de un dominio propio en Resend.
