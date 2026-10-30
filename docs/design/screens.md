# Pantallas

## Marco de la aplicación (barra superior)
```
┌──────────────────────────────────────────────────────────────┐
│ ● TU CONTROL FINANCIERO ● GASTOS REGISTRADOS 42 ● TOTAL $…   │  cinta lima (30 px)
├──────────────────────────────────────────────────────────────┤
│ [$] Control de Gastos   Panel Gastos Presupuestos Analíticas │  cabecera (fondo --panel)
│                        [☾ Oscuro|☀ Claro]  (M) martina  Salir│
└──────────────────────────────────────────────────────────────┘
```
- **Cinta:** fondo `--acc`, texto `--ink-on-acc` en mayúsculas mono de 11 px; separador de punto de 6 px; los valores van en negrita. Repite "Tu control financiero", "Gastos registrados N", "Total $X", "Categoría top Y" y "Actualizado <fecha larga>". Se detiene con `prefers-reduced-motion`.
- **Escritorio (≥ 760 px):** navegación en píldoras (activa con fondo `--raised`), selector Oscuro/Claro, avatar, usuario en minúsculas y enlace "Salir".
- **Móvil (< 760 px):** botón de tema de 44 px y avatar de 44 px que abre un menú con el usuario y "Salir" (se cierra con clic fuera o `Esc`); la navegación pasa a una fila de píldoras con borde, desplazable y sin barra visible.
- **Extensión (no está en el diseño original):** los enlaces Panel / Gastos / Presupuestos / Analíticas; el diseño los incluye desde la versión 2.

## Dashboard
Escritorio (≥ 1024 px): columna principal flexible + columna lateral de 380 px (ancho máximo 1440 px, separación de 20 px).
Móvil: una columna; orden **hero → KPIs → por categoría y distribución → tendencia → registrar gasto → historial**.

```
┌ principal ───────────────────────────────┐ ┌ lateral ─────────────────┐
│ PANEL PRINCIPAL · OCTUBRE 2026           │ │ Registrar gasto [Escanear]│
│ Hola, Martina        TOTAL ACUMULADO $…  │ │ ┌ visor ───────────────┐ │
│ ┌ hero (acento) ───────────────────────┐ │ │ │ MONTO     🍴 ALIMENT. │ │
│ │ Este mes   |  GASTO DIARIO ▂▃▅▂▇▃▂   │ │ │ │            $12.350    │ │
│ │ $248.700   |  1 OCT    15    HOY     │ │ │ └───────────────────────┘ │
│ └──────────────────────────────────────┘ │ │ [1][2][3][4][5][6][7][8][9]│
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
| Historial | Agrupado por día (`HOY`, `AYER`, `MIÉ 28 OCT`) con el total del día; máximo 20 filas; enlace "Ver todos" a `/expenses` |
| Último registro | Recibo de papel con N.º (id con 4 dígitos), descripción, monto, categoría, cuándo y **TOTAL MES** |

Formato: montos como `$58.000` (sin espacio ni decimales) y porcentajes como `84,9 %`.

### Registrar gasto
- **Visor + teclado:** dígitos enteros (pesos), tecla `000`, borrar. Máximo 9 dígitos. Acepta teclado físico mientras el foco no esté en un campo de texto.
- **Descripción:** etiqueta visible "¿En qué gastaste?" sobre el campo; al escribir, sugiere categoría con `utils/autoCategory.js` hasta que la persona elige una.
- **Categoría:** grupo de opciones (`role="radiogroup"`) de 10 iconos en cuadrícula de 5; la elegida lleva borde `--acct` y fondo `--accsoft`. El visor muestra su nombre en lima (recortado si es largo: "ENTRETE.").
- **Fecha:** `input[type=date]` (hoy por defecto). **Recibo:** adjunta un archivo que se sube con `POST /receipts/upload` tras crear el gasto.
- **Escanear:** envía el archivo a `POST /receipts/scan` y rellena monto, descripción, fecha y categoría con lo reconocido.
- **Editar** (lápiz del historial): carga el gasto en el mismo panel, que pasa a "Editar gasto" con los botones "Cancelar" y "Guardar" (`PUT /expenses/{id}`).
- **Enter** registra el gasto cuando el foco no está en un campo ni en un botón.
- **Eliminar** (papelera): diálogo "¿Eliminar gasto?" con el detalle y los botones Cancelar / Eliminar (este último en `--tx` sobre `--bg`) antes de `DELETE /expenses/{id}`.
- Validaciones con toasts: descripción obligatoria, monto > 0, categoría obligatoria.

## Resto de pantallas (sin diseño propio todavía)
- **Gastos, Presupuestos, Analíticas:** mantienen su maquetación actual dentro del nuevo marco. Una capa de compatibilidad (`.cj-legacy` en `caja.css`) redefine las variables antiguas (`--bg-*`, `--text-*`, `--accent-*`, `--glass-*`, `--radius-*`) con los tokens nuevos, de modo que adopten la paleta, la tipografía y los dos temas. Es transitoria: cada pantalla debería rediseñarse con este mismo spec.
- **Autenticación (Login, Registro, Recuperar, Restablecer):** mantienen su maquetación actual; reciben el tema por la misma capa. El botón flotante y el modal de "Gasto rápido" siguen disponibles fuera del Dashboard (que ya tiene el registro integrado).

## Toasts y diálogo (compartidos con todas las pantallas)
- **Toast:** abajo al centro, fondo `--panel`, borde `--line`, relieve `0 3px 0 --key`; icono Phosphor (`check-circle` en `--acct`; `warning-circle` y `warning` en `--tx`).
- **Diálogo de confirmación:** fondo atenuado `rgba(0,0,0,.55)` sin desenfoque, tarjeta de 360 px, sin icono; se cierra con `Esc` o con el fondo.
