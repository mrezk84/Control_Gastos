# Pantallas

## Marco de la aplicación (barra superior)
```
┌──────────────────────────────────────────────────────────────┐
│ ● TU CONTROL FINANCIERO ● GASTOS REGISTRADOS 42 ● TOTAL $…   │  cinta de acento (30 px)
├──────────────────────────────────────────────────────────────┤
│ [$] Control de Gastos   Panel Gastos Presupuestos Analíticas │  cabecera (fondo --panel)
│                        [☾ Oscuro|☀ Claro]  (M) martina  Salir│
└──────────────────────────────────────────────────────────────┘
```
- **Cinta:** fondo `--acc`, texto `--ink-on-acc` en mayúsculas mono de 11 px; separador de punto de 6 px; los valores van en negrita. Repite "Tu control financiero", "Gastos registrados N", "Total $X", "Categoría top Y" y "Actualizado <fecha larga>". Se detiene con `prefers-reduced-motion`.
- **Campana (extensión, ver [../specs/recordatorios.md](../specs/recordatorios.md)):** botón de 44 px con contador de no leídas (`--acc`, «9+» como máximo). Abre un panel de 380 px (ancho de pantalla en móvil) con la lista de avisos —no leídos con fondo `--accsoft`—, «Marcar todo como leído» y el botón «Activar notificaciones del navegador»; se cierra con clic fuera o `Esc`. Se actualiza al cargar y al volver el foco a la pestaña.
- **Escritorio (≥ 760 px):** navegación en píldoras (activa con fondo `--raised`), selector Oscuro/Claro, avatar, usuario en minúsculas y enlace "Salir".
- **Móvil (< 760 px):** botón de tema de 44 px y avatar de 44 px que abre un menú con el usuario y "Salir" (se cierra con clic fuera o `Esc`); la navegación pasa a una fila de píldoras con borde, desplazable y sin barra visible.
- **Extensión (no está en el diseño original):** los enlaces Panel / Gastos / Presupuestos / Analíticas; el diseño los incluye desde la versión 2.

## Dashboard
Escritorio (≥ 1024 px): columna principal flexible + columna lateral de 380 px (ancho máximo 1440 px, separación de 20 px).
Móvil: una columna; orden **hero → saldo del mes → KPIs → por categoría y distribución → tendencia → registrar gasto → historial**.

```
┌ principal ───────────────────────────────┐ ┌ lateral ─────────────────┐
│ PANEL PRINCIPAL · OCTUBRE 2026           │ │ Registrar gasto [Escanear]│
│ Hola, Martina        TOTAL ACUMULADO $…  │ │ ┌ visor ───────────────┐ │
│ ┌ hero (acento) ───────────────────────┐ │ │ │ MONTO     🍴 ALIMENT. │ │
│ │ Este mes   |  GASTO DIARIO ▂▃▅▂▇▃▂   │ │ │ │            $12.350    │ │
│ │ $248.700   |  1 OCT    15    HOY     │ │ │ └───────────────────────┘ │
│ └──────────────────────────────────────┘ │ │ [1][2][3][4][5][6][7][8][9]│
│ [● ● ● semáforo + Saldo del mes]         │ │                           │
│ [Promedio][Top categoría][Transac.][Categ.]│ │ [000][0][⌫]               │
│ [Por categoría (barras)] [Distribución]  │ │ ¿En qué gastaste?         │
│ [Tendencia (línea escalonada)]           │ │ [10 iconos de categoría]  │
│ [Historial por día, con editar/eliminar] │ │ [fecha] [Recibo]          │
└──────────────────────────────────────────┘ │ [Registrar gasto]         │
                                             │ ╔ ÚLTIMO REGISTRO ═══════╗│
                                             │ ║ Supermercado… $ 38.420 ║│
                                             │ ╚/\/\/\/\/\/\/\/\/\/\/\═╝│
                                             └───────────────────────────┘
```

### Datos
Todo sale de `GET /expenses/` (sin endpoints nuevos).
| Elemento | Cálculo |
|---|---|
| Total acumulado | Suma de todos los gastos |
| Este mes | Suma de los gastos del mes en curso; subtítulo "<Mes> <año> · <N> días", con N = días transcurridos |
| Gasto diario | Una barra punteada por día transcurrido; altura relativa al máximo (mín. 6 %); hoy con opacidad 1, el resto .32; cada barra lleva su `title` ("12 OCT · $5.000") |
| Indicadores | Promedio ("por transacción"), Top categoría (con su monto), Transacciones ("registradas") y Categorías ("de 10 en uso") |
| Por categoría | 6 categorías de mayor monto; etiqueta `$<n>k` sobre la barra, icono y porcentaje debajo. **Escala redondeada** al orden de magnitud (832.000 → 900.000) |
| Distribución | Barra apilada fina (16 px) y leyenda con icono, nombre, monto y porcentaje; las categorías restantes se agrupan en "Resto" |
| Tendencia | Últimos 6 meses con datos, línea escalonada con base en cero, y debajo cada mes con su valor (el último, destacado); variación del último frente al primero (`+31% vs MAY`) |
| Saldo del mes | Semáforo de tres lámparas (verde / ámbar / rojo) con barra de avance: «DENTRO DEL SALDO», «CERCA DEL LÍMITE» (desde el 80 % gastado) y «SALDO SUPERADO». Texto «Gastado $X de $Y. Te quedan $Z.» (o «Superaste el saldo por $Z»), porcentaje y «AVISO AL 80 %». El saldo se edita en el campo «Saldo del mes» (predeterminado $300.000) y se guarda en el navegador (`localStorage`, clave `saldo`) |
| Pendientes de pago | Tarjeta bajo el semáforo del saldo, solo si hay recordatorios pendientes: descripción, `15/11 · vence en 3 días` (ámbar a ≤ 3 días, rojo si venció), monto y botones **Pagar** (`POST /reminders/{id}/pay`, crea el gasto de hoy) y **Descartar** |
| Historial | Agrupado por día (`HOY`, `AYER`, `MIÉ 28 OCT`) con el total del día; máximo 20 filas; enlace "Ver todos" a `/expenses` |
| Último registro | Recibo de papel con N.º (id con 4 dígitos), descripción, monto, categoría, cuándo y **TOTAL MES** |

Formato: montos como `$58.000` (sin espacio ni decimales) y porcentajes como `84,9 %`.

### Registrar gasto
- **Visor + teclado:** dígitos enteros (pesos), tecla `000`, borrar. Máximo 9 dígitos. Acepta teclado físico mientras el foco no esté en un campo de texto.
- **Descripción:** etiqueta visible "¿En qué gastaste?" sobre el campo; al escribir, sugiere categoría con `utils/autoCategory.js` hasta que la persona elige una.
- **Categoría:** grupo de opciones (`role="radiogroup"`) de 10 iconos en cuadrícula de 5; la elegida lleva borde `--acct` y fondo `--accsoft`. El visor muestra su nombre en el color de acento (recortado si es largo: "ENTRETE.").
- **Fecha:** `input[type=date]` (hoy por defecto). **Recibo:** adjunta un archivo que se sube con `POST /receipts/upload` tras crear el gasto.
- **Escanear:** si el archivo es una imagen con un QR legible, envía su texto a `POST /receipts/qr`; si no, envía el archivo a `POST /receipts/scan` (OCR). Rellena monto, descripción, fecha y categoría con lo reconocido. Si la factura vence en el futuro aparece un aviso «Factura por vencer el 15/11» con **Guardar recordatorio** (`POST /reminders`) y **Ya la pagué** (pone la fecha de hoy para registrarla). Si el QR trae otra moneda que la del perfil, un aviso pide revisar el monto. Lectura de QR, recordatorios de pago y notificaciones: ver [../specs/recordatorios.md](../specs/recordatorios.md).
- **Editar** (lápiz del historial): carga el gasto en el mismo panel, que pasa a "Editar gasto" con los botones "Cancelar" y "Guardar" (`PUT /expenses/{id}`).
- **Enter** registra el gasto cuando el foco no está en un campo ni en un botón.
- **Eliminar** (papelera): diálogo "¿Eliminar gasto?" con el detalle y los botones Cancelar / Eliminar (este último en `--tx` sobre `--bg`) antes de `DELETE /expenses/{id}`.
- Validaciones con toasts: descripción obligatoria, monto > 0, categoría obligatoria.

## Resto de pantallas (sin diseño propio todavía)
- **Gastos, Presupuestos, Analíticas:** mantienen su maquetación actual dentro del nuevo marco. Una capa de compatibilidad (`.cj-legacy` en `caja.css`) redefine las variables antiguas (`--bg-*`, `--text-*`, `--accent-*`, `--glass-*`, `--radius-*`) con los tokens nuevos, de modo que adopten la paleta, la tipografía y los dos temas. Es transitoria: cada pantalla debería rediseñarse con este mismo spec.
- **Inicio de sesión (diseño propio, `Login.dc.html`):** dos mitades que se apilan en pantallas estrechas. A la izquierda un panel de acento (`--acc`) con la marca, el lema «Cada peso, a la vista.», un recibo de ejemplo inclinado −1,5° con borde dentado y tres lámparas apagándose; a la derecha el botón de tema (44 px) y el formulario de 400 px: «INICIAR SESIÓN» / «Hola de nuevo», campo de usuario o correo y de contraseña (52 px, con botón de mostrar u ocultar de 44 px), enlace «¿La olvidaste?», error en `--bad` con `role="alert"` y botón «Entrar» (54 px, relieve de acento). (Marquesina promocional desactivada: `SHOW_PROMO_TICKER` en `AuthShell.js`.) Cuando está activa, sobre las dos mitades va una marquesina oscura (`#0e0f11`, texto `--display-amt`) con los puntos fuertes de la app: QR, avisos de vencimiento, presupuestos, cualquier país, tema claro/oscuro. Difiere del diseño en dos puntos: el campo acepta usuario **o** correo (el servidor admite ambos) y se conservan los botones de Google y Microsoft; además no se exige un largo mínimo de contraseña para no bloquear cuentas existentes.
- **Registro (mismo marco que el inicio de sesión, modo «Crear cuenta»):** «CREAR CUENTA» / «Empieza hoy»; campos Nombre, Correo, Contraseña (con mostrar/ocultar), medidor de seguridad de 4 barras («SEGURIDAD: MUY DÉBIL … FUERTE», según largo ≥ 8, mayúsculas y minúsculas, número y símbolo) y Confirmar contraseña; botón «Crear cuenta», Google y Microsoft, y enlace «Iniciar sesión». «Nombre» es el nombre de usuario (único) con el que también se puede iniciar sesión. Validaciones: nombre, correo válido, contraseña de 6 o más caracteres y que coincidan. **No incluye** la casilla «Acepto los términos y la política de privacidad» del diseño: la app aún no tiene esos textos.
- **Recuperar y Restablecer contraseña:** mantienen su maquetación actual; reciben el tema por la misma capa. El botón flotante y el modal de "Gasto rápido" siguen disponibles fuera del Dashboard (que ya tiene el registro integrado).
- **Asistente de gastos hormiga (diseño propio, pendiente de implementar):** bienvenida, panel hormiga, chat y plan con simulador. Spec en [asistente-hormiga.md](asistente-hormiga.md), artboards en [mockups/asistente-hormiga/](mockups/asistente-hormiga/).

## Toasts y diálogo (compartidos con todas las pantallas)
- **Toast:** abajo al centro, fondo `--panel`, borde `--line`, relieve `0 3px 0 --key`; icono Phosphor (`check-circle` en `--acct`; `warning-circle` y `warning` en `--tx`).
- **Diálogo de confirmación:** fondo atenuado `rgba(0,0,0,.55)` sin desenfoque, tarjeta de 360 px, sin icono; se cierra con `Esc` o con el fondo.
