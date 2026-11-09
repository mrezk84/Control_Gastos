# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Personas que llevan el control de sus gastos personales. Situación principal: registran un gasto en el momento, desde el móvil, a menudo con el recibo en la mano. El análisis y la revisión (resumen del mes, categorías, tendencia) son secundarios y también ocurren en escritorio.

## Product Purpose
Dirección en curso: evolucionar hacia una app de **educación financiera** para principiantes adultos, con un chat tutor y app móvil (Capacitor). Spec: `docs/specs/educacion-financiera.md`. Lo que sigue describe el producto actual, que sigue siendo la base.

Control Gastos permite registrar, categorizar y analizar gastos personales con el mínimo de pasos, y mantener el gasto bajo control mediante presupuestos y recordatorios. Éxito: registrar un gasto en pocos toques y entender de un vistazo cómo va el mes.

## Positioning
Combinación de cuatro mecanismos confirmados:
- Registro como "caja registradora": teclado numérico, visor del monto y recibo de papel.
- Escaneo OCR de recibos y facturas (cámara, imágenes y PDFs) que rellena el gasto.
- Presupuestos por categoría y recordatorios (push).
- Login propio (usuario/email y contraseña) además de Google y Microsoft.

## Operating Context
Uso frecuente, breve y móvil; la cámara y la subida de archivos forman parte del flujo. Backend FastAPI + PostgreSQL (Neon); frontend React (Create React App) con Chart.js. Documentación de usuario en `MANUAL_USUARIO.md`, despliegue en `DEPLOY.md`.

## Capabilities and Constraints
- Páginas: Dashboard (con registro integrado), Gastos, Presupuestos, Analíticas, autenticación (login, registro, recuperar y restablecer contraseña).
- Tema oscuro (predeterminado) y claro, con selector que recuerda la elección.
- Interfaz en español. Idiomas adicionales: no decidido.
- Restricción visual vinculante existente: `docs/design/SPEC.md`, `tokens.md` y `screens.md` (concepto "Caja registradora"). Esta fase no la reemplaza ni la extiende; decisiones visuales se toman en new-work.

## Brand Commitments
Nombre: "Control Gastos" / "Control de Gastos". Voz en español. Sin otros compromisos de marca confirmados.

## Evidence on Hand
Aplicación funcional con documentación (`README.md`, `MANUAL_USUARIO.md`, `docs/`). No hay testimonios, métricas de uso ni clientes documentados; no fabricarlos.

## Product Principles
1. Registrar un gasto debe costar el menor número de toques posible, sobre todo en móvil.
2. El monto manda: las cifras son lo primero y nunca dependen solo del color.
3. Escanear antes que teclear: el OCR es un camino de primera clase, no un extra.
4. Sobriedad al servicio del dato: una interfaz tranquila que no compite con los números.
5. Educar sin asesorar: el tutor explica conceptos con los datos de la persona, sin recomendar productos ni activos concretos.

## Accessibility & Inclusion
Contraste de texto ≥ 4,5:1 y objetivos táctiles ≥ 44 px en móvil. Respetar `prefers-reduced-motion`. Teclado físico utilizable en el teclado numérico del monto.
