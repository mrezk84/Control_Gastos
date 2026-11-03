# Spec: recordatorios y notificaciones al escanear facturas o QR

Fuente de verdad de la funcionalidad. Se implementa en cuatro PR (spec, backend, Web Push + cron,
frontend). El diseño visual sigue [../design/SPEC.md](../design/SPEC.md) y sus tokens.

## Concepto
Al escanear una factura o un código QR, la app decide si ya está pagada o queda **pendiente**:
- **Con vencimiento futuro** → se guarda un *recordatorio de pago* y la app avisa antes de que venza.
  Al pagarla se crea el gasto.
- **Sin vencimiento futuro** (ya pagada) → se registra el gasto y se notifica el monto pagado.

Las notificaciones llegan por dos canales: **dentro de la app** (campana) y **del navegador** (Web Push).
No se envían por correo: Resend sin dominio propio solo entrega a `mrezk84@gmail.com`.

## Alcance
- **Funciona en cualquier país.** Nada está atado a un país: moneda, zona horaria y formato de fecha salen del
  perfil de cada persona, y los QR se leen con **adaptadores por país** sobre una base internacional.
  Uruguay (DGI) y Argentina (AFIP/ARCA) son los primeros adaptadores; añadir otro país no toca el resto del código.
- Lectura de QR (estándar EMVCo, adaptadores por país y texto libre) además del OCR actual.
- Recordatorios de pago con estado `pending`, `paid` o `dismissed`.
- Notificaciones en la app y Web Push, con un cron diario.
- Fuera de alcance: correo, SMS, recordatorios recurrentes, edición masiva.

## Flujo de escaneo
1. La persona pulsa **Escanear** y elige una imagen o PDF.
2. Si es imagen, el navegador intenta leer un QR (`jsQR`). Si hay QR, envía su texto a `POST /receipts/qr`;
   si no, envía el archivo a `POST /receipts/scan` (OCR), como hoy.
3. El resultado trae `amount`, `date`, `merchant`, `description` y, si se detecta, `due_date`.
4. Regla: **`due_date` posterior a hoy = pendiente**; cualquier otro caso = pagada.
   - Pendiente: el panel muestra "Factura por vencer el 15/11" con **Guardar recordatorio** (`POST /reminders`)
     y **Ya la pagué** (registra el gasto con fecha de hoy).
   - Pagada: el formulario se rellena como hoy y el gasto se crea con `from_scan=true`.
5. Siempre se revisan los datos antes de guardar; nada se crea sin confirmación.

## Formatos de QR
El parser (`services/qr_parser.py`) prueba en este orden y se queda con el primero que devuelve un monto:

1. **Adaptadores por país** (`services/qr_countries/<iso2>.py`). Cada uno expone `matches(text)` y `parse(text)`,
   y se registra en una lista; el primero cuyo `matches` acierta, gana.
2. **EMVCo** (estándar internacional de pagos con QR; lo usan Mercado Pago, Prex, Pix, UPI, SEPA y otros).
3. **URL con parámetros** (`?importe=...&fecha=...`) con nombres de campo habituales en varios idiomas.
4. **Texto libre**, con las mismas expresiones regulares que el OCR (`ocr_service._parse_receipt_text`).

| Origen | Reconocimiento | Campos que se extraen |
|---|---|---|
| **Uruguay: CFE de la DGI** (e-Ticket, e-Factura, notas) | URL `efactura.dgi.gub.uy/consultaQR/cfe?...` con datos separados por comas | RUT emisor, tipo de CFE, serie, número, monto, fecha `dd/mm/aaaa` → descripción "e-Ticket A-1234" |
| **Argentina: AFIP/ARCA** | URL `afip.gob.ar/fe/qr/?p=<base64>` con un JSON | `importe`, `fecha`, `cuit`, `ptoVta`, `tipoCmp`, `nroCmp` |
| **EMVCo** | Cadena TLV que empieza por `000201` | tag 54 = monto, tag 59 = comercio, tag 53 = moneda ISO 4217 numérica |
| **Texto libre** | Cualquier otro texto | monto, fecha, comercio |

- Los formatos de Uruguay y Argentina **no están verificados contra un QR real**: los adaptadores se escriben de forma
  tolerante y se ajustan con muestras reales (ver Salvedades).
- Para otro país basta un archivo nuevo en `qr_countries/` con sus tests; si no hay adaptador, la persona sigue
  teniendo EMVCo, URL con parámetros y texto libre.
- **Fechas:** cada adaptador entrega la fecha ya en ISO (`aaaa-mm-dd`). El texto libre y el OCR interpretan
  `dd/mm/aaaa` salvo que el perfil indique el orden `mm/dd/aaaa`.
- **Vencimiento:** la mayoría de los QR fiscales no traen vencimiento. Sale del OCR ("vencimiento", "vence", "vto.",
  "due date", "expires") o se ingresa a mano al guardar el recordatorio.
- **Moneda:** el resultado incluye `currency` (ISO 4217, p. ej. `UYU`) cuando el QR o el texto la indican. Si difiere de
  la moneda del perfil, la app avisa y pide confirmar el monto antes de guardar; los gastos se guardan en la moneda del perfil.

Un QR ilegible o sin monto devuelve error 422 y la app pasa al OCR.

## Modelo de datos
- **Perfil (`users`):** columnas nuevas `country` (ISO 3166-1 alfa-2), `currency` (ISO 4217) y `timezone` (IANA),
  con valores por defecto tomados del navegador (`Intl`) la primera vez y editables en el perfil. Hoy la app asume
  pesos y huso de Argentina; estas columnas lo vuelven configurable. Si faltan, se usa `UYU` / `America/Montevideo`.
- **`payment_reminders`:** `id`, `user_id`, `description`, `amount`, `category`, `due_date`,
  `source` (`ocr` | `qr` | `manual`), `status` (`pending` | `paid` | `dismissed`), `expense_id` (nullable),
  `last_notified_kind`, `last_notified_on`, `created_at`.
- **`notifications`:** `id`, `user_id`, `kind` (`due_soon` | `due_today` | `overdue` | `payment_registered`),
  `title`, `body`, `link`, `read_at`, `created_at`.
- **`push_subscriptions`:** `id`, `user_id`, `endpoint` (único), `p256dh`, `auth`, `created_at`.
- Migración `backend/migrations/002_recordatorios.sql`, idempotente como la `001`.
- Todo se filtra por `user_id`: una persona nunca ve datos de otra.

## Endpoints
- **`POST /receipts/qr`:** `{text}` → mismo `ReceiptScanResult` que `/receipts/scan`, con `data.due_date`.
- **Recordatorios:** `GET /reminders?status=pending`, `POST /reminders`, `PUT /reminders/{id}`,
  `DELETE /reminders/{id}`, `POST /reminders/{id}/pay` (crea el gasto con fecha de hoy, enlaza `expense_id`
  y pone `status=paid`).
- **Notificaciones:** `GET /notifications` (incluye `unread_count`), `POST /notifications/{id}/read`,
  `POST /notifications/read-all`.
- **Push:** `GET /push/vapid-key` (pública), `POST /push/subscribe`, `DELETE /push/subscribe`.
- **Cron:** `GET /cron/reminders`, exige `Authorization: Bearer $CRON_SECRET` (401 si falta o no coincide).
- **Gastos:** `POST /expenses` acepta `from_scan` (booleano). Si es `true`, genera la notificación `payment_registered`.

## Cuándo se notifica
| Tipo | Condición | Texto |
|---|---|---|
| `due_soon` | Faltan 1 a 3 días | "Vence en 3 días: Edenor · $58.000" |
| `due_today` | Vence hoy | "Vence hoy: Edenor · $58.000" |
| `overdue` | Vencido y sigue pendiente | "Vencida: Edenor · $58.000" |
| `payment_registered` | Gasto creado con `from_scan` | "Pago registrado: $58.000 en Edenor · Total del mes: $412.000" |

Los montos se formatean con la moneda y el idioma del perfil (`Intl.NumberFormat` en el frontend; el backend guarda
el texto ya formateado con la misma moneda). Los textos de ejemplo usan pesos.

- El cron corre **una vez al día** (11:00 UTC, `backend/vercel.json`; es la misma hora para todos, así que el aviso llega a primera hora en Sudamérica y más tarde o antes en otras regiones).
- Un recordatorio no se notifica dos veces el mismo día con el mismo tipo (`last_notified_kind` + `last_notified_on`),
  así que ejecutar el cron dos veces no duplica avisos.
- «Hoy» y «faltan N días» se calculan con la **zona horaria de cada persona** (`users.timezone`).
- `overdue` se avisa una sola vez; después solo se ve en el panel.
- Toda notificación se guarda en la app; el Web Push se envía además si hay suscripciones.
  Si el envío devuelve 404 o 410, esa suscripción se borra.

## Interfaz
Usa los tokens de [../design/tokens.md](../design/tokens.md), iconos Phosphor y clases `cj-*`.
- **Campana:** en la barra superior, con contador de no leídas. Despliega la lista y "Marcar todo como leído".
  Se actualiza al cargar y al volver el foco a la pestaña.
- **Activar notificaciones:** botón dentro de la campana. Pide el permiso del navegador con un gesto de la persona
  y luego se suscribe (`POST /push/subscribe`). Si el permiso está denegado, explica cómo reactivarlo.
- **Pendientes de pago:** panel en el Dashboard con monto, días restantes y los botones **Pagar** y **Descartar**.
  Si no hay recordatorios, no se muestra.
- **Service worker** `public/sw.js`: muestra la notificación y, al pulsarla, abre o enfoca la app en `link`.

## Criterios de aceptación
- Un QR de cualquier adaptador instalado (hoy Uruguay y Argentina) con vencimiento futuro crea un recordatorio; uno ya pagado crea el gasto y la notificación con el monto.
- Pagar un recordatorio crea el gasto y lo marca como `paid`.
- El cron sin secreto responde 401; con secreto, notifica según la tabla y no duplica.
- Con el perfil en otro país y moneda, los montos, las fechas y el «hoy» del cron respetan ese perfil.
- Un QR EMVCo de cualquier país se lee aunque no exista adaptador para él.
- Una persona no puede leer ni modificar recordatorios o notificaciones de otra.
- Contraste ≥ 4,5:1 y objetivos táctiles ≥ 44 px; la campana es operable con teclado.
- Los tests nuevos (backend y frontend) pasan en la CI.

## Salvedades
- **Cron diario:** el plan gratuito de Vercel ejecuta los crons como máximo una vez al día. Si `backend/vercel.json`
  interfiere con la detección de FastAPI, el plan B es un workflow de GitHub Actions con `schedule` que llame al endpoint.
- **iPhone:** Web Push solo funciona con la app instalada en la pantalla de inicio (iOS 16.4 o superior).
  En escritorio y Android funciona desde el navegador.
- **Muestras reales pendientes:** hace falta al menos un QR real de e-Ticket/e-Factura uruguayo y uno argentino
  (texto del QR o foto) para fijar sus formatos en los tests de `test_qr_parser.py`.
- **Cron único:** al ser un solo horario diario, no se puede avisar a cada persona a su hora local. Si hiciera falta,
  se pasa a un cron más frecuente (requiere plan de pago en Vercel o un workflow de GitHub Actions).
- **Cámara y QR:** la lectura es por foto (`jsQR`), no por vídeo en vivo; en el móvil `accept="image/*"` ya ofrece la cámara.
- **Claves y secretos:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y `CRON_SECRET` se cargan en Vercel
  (proyecto `control-gastos-api`); hay que redesplegar sin caché tras añadirlas.
