# Control de Gastos 💰

Aplicación para el control de gastos personales con **escaneo de recibos (OCR y QR)**, **detección de gastos hormiga con avisos** y **login propio (usuario/contraseña, Google, Microsoft)**.

## ✨ Características

### Backend (Python/FastAPI)
- ⚡ API REST con FastAPI
- 🔐 Autenticación JWT propia + OAuth (Google, Microsoft)
- 📸 **Escaneo de recibos y facturas con OCR y QR**, y lectura de PDF
- 💾 SQLAlchemy sobre PostgreSQL (Neon)
- 🔔 **Notificaciones**: en la app y del navegador (Web Push con claves VAPID), avisos diarios de vencimientos por cron
- 🐜 **Gastos hormiga**: umbral que se adapta a cada persona y avisos al registrar un gasto
- 📊 Estadísticas y exportación a CSV/Excel; importación desde CSV

### Frontend (React)
- 🎨 **Diseño "Tinta + Lima"**: paleta de tinta con lima como único acento, tema oscuro y claro, títulos en Bricolage Grotesque, cifras en Geist Mono y iconos Phosphor ([spec](./docs/design/SPEC.md))
- 📱 Responsivo: barra de pestañas inferior en el móvil
- 💱 **Moneda del perfil**: un solo formato de importes para toda la app, con centavos cuando los hay
- 🐜 **Gastos hormiga**: panel del mes, asistente, plan con simulador y reto de 7 días
- 🧭 **Guía de primeros pasos**: un asistente que lleva a cargar moneda, saldo, primer gasto y presupuesto
- ❓ **Ayuda**: chat con respuestas sobre cómo usar cada pantalla
- 📷 Escaneo con cámara, subida de imágenes y PDF

> Los dos asistentes (hormiga y ayuda) **no usan un modelo de lenguaje ni un servidor**: responden con plantillas y una base de conocimiento local, y solo leen los gastos de la persona.

## 🚀 Instalación

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Variables de entorno**: copia `backend/.env.example` a `backend/.env` y complétalo
(`DATABASE_URL` de Neon, `SECRET_KEY`, y opcionalmente Resend, OCR.space, OAuth, las claves VAPID del push y `CRON_SECRET`).
Sin `DATABASE_URL` el backend usa un SQLite temporal, solo para desarrollo local.

**Esquema de la base de datos**: `create_all` crea las tablas que falten al arrancar, pero **no añade columnas** a tablas existentes. Las
migraciones están en `backend/migrations/` (001 a 005) y hay que ejecutarlas **antes de desplegar** una versión que las necesite
(ver [DEPLOY.md](./DEPLOY.md)). La más reciente es `005_avisos_hormiga.sql` (preferencias de gastos hormiga en `users`).

**Ejecutar**:
```bash
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
```

**Variables de entorno** (crear `.env`):
```env
VITE_API_URL=http://localhost:8000
```

**Ejecutar**:
```bash
npm start
```

## ✅ Pruebas

Se ejecutan en cada pull request (`.github/workflows/ci.yml`).

```bash
# Backend (usan SQLite en memoria, no necesitan .env)
cd backend
pip install -r requirements.txt -r requirements-dev.txt
pytest

# Frontend (Vitest)
cd frontend
npm test
```

Un `vite build` que compila **no** detecta referencias sin definir: tras cambios en pantallas conviene abrirlas en el navegador y mirar la consola.

## 📸 Escaneo de Recibos

La aplicación permite escanear recibos y facturas automáticamente:

1. **Imágenes**: JPG, PNG (máx 4MB)
2. **PDFs**: Soportados para facturas digitales
3. **QR**: lee el código de facturas y comprobantes de pago
4. **OCR**: Extrae automáticamente:
   - ✅ Monto total (con centavos)
   - ✅ Fecha y fecha de vencimiento
   - ✅ Comercio/Establecimiento
   - ✅ Descripción sugerida

Si la factura vence más adelante se puede guardar como **recordatorio de pago**.

## 🐜 Gastos hormiga y avisos

Un gasto hormiga es una compra chica y repetida.

- **Umbral adaptativo**: por defecto, el percentil 30 de las compras de la persona en los últimos 90 días (con menos de 15 compras usa un valor inicial). Se puede fijar a mano.
- **Avisos al registrar un gasto**: cuando la misma compra se repite 3 veces en 14 días (y luego cada 5), o al llegar al 80 % y al 100 % del tope del mes.
- **Frecuencia limitada**: como máximo 1 aviso hormiga por día y 2 por semana, con un interruptor para apagarlos. Un fallo al avisar nunca impide registrar el gasto.
- **"No es hormiga"**: excluye una compra de la detección y de los totales.
- La configuración (`GET/PUT /hormiga/config`) vive en el servidor, no en el navegador.

## 🔔 Notificaciones del navegador

Requieren las claves VAPID en el backend (`npx web-push generate-vapid-keys`) y que la persona las active desde la campana.

- En **Brave**, el servicio de push de Google viene desactivado: hay que activar "Usar servicios de Google para mensajería push" en `brave://settings` y reiniciar el navegador. La app lo explica si falla.
- En iPhone solo funcionan con la app instalada en la pantalla de inicio.
- Los avisos de la campana funcionan aunque no se active el push del navegador.

## 🛠️ Stack Tecnológico

### Backend
- FastAPI
- SQLAlchemy
- OCR.space (imágenes)
- PDFPlumber
- PyJWT (JWT)
- Passlib (bcrypt)
- pywebpush (notificaciones del navegador)

### Frontend
- React 18 con Vite (Vitest para las pruebas)
- React Router
- Axios
- Chart.js (pantallas heredadas)
- Bricolage Grotesque, Geist, Geist Mono y Phosphor Icons

## 📁 Estructura del Proyecto

```
Proyecto_Control_Gastos/
├── docs/design/           # Spec de diseño (SPEC, tokens, screens) y mockups del asistente
├── backend/
│   ├── app/
│   │   ├── routes/        # Endpoints API (incl. hormiga.py)
│   │   ├── services/      # OCR, notificaciones, push y gastos hormiga
│   │   ├── models.py      # Modelos BD
│   │   ├── schemas.py     # Pydantic schemas
│   │   └── main.py        # App entry point
│   ├── api/               # Entrada serverless de Vercel
│   ├── migrations/        # SQL del esquema (001 a 005)
│   ├── tests/             # Pruebas (pytest)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/    # caja/ (panel), hormiga/, asistente/ (guía), ayuda/ (chat), ui/
    │   ├── pages/         # Pantallas (Dashboard, Gastos, Presupuestos, Analíticas, Hormiga)
    │   ├── services/      # Cliente de la API
    │   ├── utils/         # Lógica pura (con pruebas): hormiga, guía, ayuda, formatos…
    │   └── styles/caja.css  # Tokens y estilos del diseño
    └── package.json
```

## 📝 Notas

- El OCR de imágenes usa la API de OCR.space (clave gratuita en https://ocr.space/ocrapi/freekey); los PDFs se leen con pdfplumber.
- Los recibos subidos se guardan en la base de datos (el disco de Vercel es efímero).
- Los importes se guardan con precisión de centavos (se redondean a 2 decimales) y se muestran en la moneda del perfil.
- Para respuestas libres en los asistentes haría falta un servicio de modelo de lenguaje en el backend (clave de API, límites por persona y control de privacidad): hoy no está implementado.

---

## 🌐 Despliegue

Todo corre en capas gratuitas sin tarjeta: **Vercel** (frontend y backend), **Neon** (PostgreSQL),
**Resend** (correo) y **OCR.space**. Guía paso a paso en [DEPLOY.md](./DEPLOY.md).

## 🔗 Links Útiles

- [Guía de despliegue](./DEPLOY.md)
- [Manual de Usuario](./MANUAL_USUARIO.md)
- [Spec de diseño](./docs/design/SPEC.md)
- [Diseño del asistente de gastos hormiga](./docs/design/asistente-hormiga.md)
- [Spec de educación financiera, chat tutor y app móvil](./docs/specs/educacion-financiera.md)
