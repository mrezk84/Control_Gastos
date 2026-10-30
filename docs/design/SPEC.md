# Spec de diseño: "Caja registradora"

Fuente de verdad del rediseño de Control Gastos. Origen: proyecto de Claude Design
"Control de gastos brutalista", archivo `Control de Gastos - Final.dc.html` (pantalla Dashboard,
oscuro y claro, escritorio y móvil). Este spec reemplaza al concepto anterior "Jardín".
Detalles en [tokens.md](./tokens.md) y [screens.md](./screens.md).

## Concepto
Registrar un gasto es **cobrar en una caja registradora**: un visor con el monto en verde lima, un
teclado numérico con teclas que se hunden, un recibo de papel con borde dentado y una cinta
(*ticker*) de datos recorriendo la parte superior. El resto de la interfaz es sobria: paneles planos,
tipografía técnica y un solo color de acento.

## Principios
1. **Un acento.** Verde lima (`--acc`). Todo lo demás es neutro. En el tema claro el lima no se usa como texto: se usa `--acct`.
2. **Relieve de tecla.** Los elementos accionables y las tarjetas de KPI llevan una sombra inferior sólida (`0 3px 0`) que se reduce al presionarse. Sin sombras difusas ni cristal.
3. **Cifras de máquina.** Montos y datos en Geist Mono; texto en Geist.
4. **Barras punteadas.** Los gráficos de barras se dibujan con rayas horizontales (estilo contador), no con rellenos lisos.
5. **Dos temas, mismos tokens.** Oscuro (predeterminado) y claro, con el mismo conjunto de variables.
6. **El monto manda.** Cada barra o segmento lleva su valor en texto; el color nunca es la única señal.

## Alcance
- **Diseñado por la persona usuaria:** Dashboard (escritorio y móvil) con registro de gasto integrado.
- **Extensión de este spec (no diseñada en Claude Design):** barra de navegación entre páginas, y el
  tratamiento de Gastos, Presupuestos, Analíticas y Autenticación con los mismos tokens. Mientras esas
  pantallas no tengan diseño propio, usan una **capa de compatibilidad** que mapea sus variables
  antiguas a los tokens nuevos (ver [screens.md](./screens.md)).

## Criterios de aceptación
- Los dos temas funcionan con el selector Oscuro / Claro y recuerdan la elección.
- El Dashboard coincide con el diseño en escritorio (≥ 1024 px) y móvil (≈ 390 px) sin desbordes horizontales.
- Contraste de texto ≥ 4,5:1 (valores en tokens.md); objetivos táctiles ≥ 44 px en móvil.
- Iconos: Phosphor (regular y duotone); sin emojis en la interfaz nueva.
- `prefers-reduced-motion`: la cinta se detiene.
- Teclado numérico utilizable también con el teclado físico (dígitos, Backspace, Enter).

## Salvedades conocidas del diseño original
- Texto secundario del recibo de papel: el original usa `#6c6e69` (4,2:1); se sube a `#5f615c` (5,1:1).
- Barras de categoría 5 y 6 (oscuro) y 1 y 6 (claro): contraste con el panel entre 1,5:1 y 2,1:1.
  Se mantiene el diseño; cada barra tiene monto, porcentaje e icono como señal redundante.
