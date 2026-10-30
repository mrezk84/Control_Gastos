# Pantallas

## Marco de la aplicación (barra superior)
```
┌──────────────────────────────────────────────────────────────┐
│ ▸ Tu control financiero ● Gastos registrados 42 ● Total … ▸  │  cinta (ticker)
├──────────────────────────────────────────────────────────────┤
│ [$] Control de Gastos   Panel Gastos Presupuestos Analíticas │
│                        [☾ Oscuro|☀ Claro]  (M) martina Salir │
└──────────────────────────────────────────────────────────────┘
```
- La cinta repite: "Tu control financiero", "Gastos registrados N", "Total $X", "Categoría top Y", "Actualizado <fecha larga>".
- **Extensión (no está en el diseño original):** enlaces de navegación Panel / Gastos / Presupuestos / Analíticas en la barra. En móvil pasan a una fila desplazable bajo la barra.
- Móvil: el selector de tema es un botón de icono de 44 px; "Salir" pasa al menú del avatar.

## Dashboard
Escritorio (≥ 1024 px): columna principal flexible + columna lateral de 380 px.
Móvil: una columna; orden **hero → KPIs → por categoría → distribución → tendencia → registrar gasto → historial**.

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
| Este mes | Suma de los gastos del mes en curso; subtítulo "<Mes> <año> · <N> días" |
| Gasto diario | Un valor por día del mes; altura relativa al máximo (mín. 6 %); el día de hoy con opacidad 1, el resto .32 |
| Promedio | Total / número de transacciones |
| Top categoría | Categoría con mayor suma |
| Transacciones / Categorías | Conteos |
| Por categoría | 6 categorías de mayor monto; etiqueta `$<n>k`, icono, escala = máximo redondeado |
| Distribución | Segmentos proporcionales + leyenda con porcentaje (coma decimal) |
| Tendencia | Últimos 6 meses con datos, línea escalonada; delta = último mes vs primero (`+31% vs MAY`) |
| Historial | Agrupado por día (`HOY`, `AYER`, `MIÉ 28 OCT`) con total del día; máximo 20 filas y enlace "Ver todos" a `/expenses` |
| Último registro | Gasto más reciente (por `created_at`, si no por fecha) |

### Registrar gasto
- **Visor + teclado:** dígitos enteros (pesos), tecla `000`, borrar. Máximo 9 dígitos. Acepta teclado físico mientras el foco no esté en un campo de texto.
- **Descripción:** al escribir, sugiere categoría con `utils/autoCategory.js` hasta que la persona elige una.
- **Categoría:** 10 iconos en cuadrícula de 5; seleccionada con borde `--acct` y fondo `--accsoft`.
- **Fecha:** `input[type=date]` (hoy por defecto). **Recibo:** adjunta un archivo que se sube con `POST /receipts/upload` tras crear el gasto.
- **Escanear:** envía el archivo a `POST /receipts/scan` y rellena monto, descripción, fecha y categoría con lo reconocido.
- **Editar** (lápiz del historial): carga el gasto en el mismo panel, que pasa a "Editar gasto" con "Guardar" y "Cancelar" (`PUT /expenses/{id}`).
- **Eliminar** (papelera): pide confirmación con `ConfirmDialog` antes de `DELETE /expenses/{id}`.
- Validaciones con toasts: descripción obligatoria, monto > 0, categoría obligatoria.

## Resto de pantallas (sin diseño propio todavía)
- **Gastos, Presupuestos, Analíticas:** mantienen su maquetación actual dentro del nuevo marco. Una capa de compatibilidad (`.cj-legacy` en `caja.css`) redefine las variables antiguas (`--bg-*`, `--text-*`, `--accent-*`, `--glass-*`, `--radius-*`) con los tokens nuevos, de modo que adopten la paleta, la tipografía y los dos temas. Es transitoria: cada pantalla debería rediseñarse con este mismo spec.
- **Autenticación (Login, Registro, Recuperar, Restablecer):** mantienen su maquetación actual; reciben el tema por la misma capa. El botón flotante y el modal de "Gasto rápido" siguen disponibles fuera del Dashboard (que ya tiene el registro integrado).
