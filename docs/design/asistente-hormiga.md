# Diseño: asistente de gastos hormiga

Pantallas del asistente y guía de ahorro basada en gastos hormiga. Es la cara visible del chat tutor
de [../specs/educacion-financiera.md](../specs/educacion-financiera.md) (Fase 1) y de los retos y
lecciones (Fases 2 a 4). Sigue [SPEC.md](SPEC.md), [tokens.md](tokens.md) y el marco de
[screens.md](screens.md); no introduce colores ni tipografías nuevas.

- **Lienzo en Claude Design (fuente visual):** https://claude.ai/artifact/2LwC4kPgK4xMt2vJUkN1S2
  (privado; pedir acceso al autor). Versión 6, 10 de noviembre de 2026.
- **Código de los artboards:** [mockups/asistente-hormiga/](mockups/asistente-hormiga/). Son
  archivos `.dc.html` (HTML con estilos en línea) a 390 × 844 px; sirven para copiar medidas,
  radios, sombras y trazados de íconos. No se cargan en la app.

## Concepto
"La cinta de caja": el asistente habla con los datos de la persona y los muestra como tickets de
papel. El cobre se usa en superficies grandes (tarjeta principal, cinta, botones), nunca solo en
detalles; las cifras van en Geist Mono. Tono cercano en voseo, sin culpa ("nada grave", "vas bien"),
sin jerga y sin recomendar productos (principio 5 de `PRODUCT.md`).

Un **gasto hormiga** es, en el diseño, una compra menor a un umbral ($ 300 en los ejemplos). El umbral
real queda por decidir: monto fijo, porcentaje del gasto promedio o configurable en Ajustes.

## Pantallas

### 0 · Bienvenida (`Bienvenida.dc.html`)
Se muestra la primera vez que se abre el asistente. Calca el login: bloque cobre arriba con la marca
`$`, titular "Tu plata chica, a la vista." y un recibo de papel inclinado (−1,5°) con dos renglones
punteados (compras chicas / podés recuperar). Abajo, en grafito: presentación "¡Hola! Soy tu
asistente", tres beneficios con ícono en caja `--raised`, chips de metas (selección múltiple, con canto)
y botón "Empezar". Pie: candado + "Solo leo tus gastos. Nunca los cambio ni muevo plata."

### 1 · Panel hormiga (`Main.dc.html`)
Marco de la app (cinta, cabecera, píldoras) y, en orden:
1. Eyebrow mono "PANEL HORMIGA · OCTUBRE 2026" + saludo "Hola, {nombre}" (30 px en móvil).
2. **Tarjeta cobre** (`.cj-hero`): título con ícono, cifra mono 50 px (`$ 3.840`), subtítulo mono
   "38 compras chicas · 14 % del mes" y cuatro barras por semana en tinta (las pasadas al 35 %).
3. **Semáforo hormiga** (`.cj-sema`, lámparas en vertical en móvil): estado mono en el color de la
   lámpara, texto, barra de 10 px y escala "128 % · AVISO AL 80 %". Compara contra el tope de compras
   chicas que fija la persona.
4. **Dónde se te va** (`.cj-card`): tres filas con ícono en caja, nombre, cantidad y monto mono.
5. Botón cobre con canto "Charlar con mi asistente" → chat.

### 2 · Chat del asistente (`Chat.dc.html`)
Cinta y cabecera con botón "Volver", avatar del asistente (cuadrado cobre con ícono `bot`) y
subtítulo mono "SOLO LEE · NUNCA CAMBIA".
- Burbujas de la persona: cobre, tinta, radio 16/16/4/16, canto de 3 px.
- Burbujas del asistente: `--panel` con borde `--line`, radio 4/16/16/16. Los datos van dentro en
  un **ticket de papel** (`--paper`, mono 12,5 px, renglones punteados, total en mayúsculas).
- Pasos numerados en cajas `--raised` con el número en cobre brillante.
- Enlace a lección y botón "Sí, vamos al plan" dentro de la burbuja.
- Abajo: preguntas sugeridas (botones con canto, desplazables) y campo de 52 px + botón enviar de
  52 px cobre con canto de 4 px.

### 3 · Plan y simulador (`Plan.dc.html`)
Marco de la app; la cinta muestra "Reto activo · Día N", "Recuperado $" y "Racha".
1. Eyebrow "PLAN HORMIGA · SIMULADOR" + "¿Cuánto recuperás?".
2. **Tarjeta cobre** con deslizador (0–100 %, paso 5), "AL AÑO" en mono 44 px y "AL MES" en 18 px.
   El texto de ayuda cambia por tramo: 0 % / < 25 % / 25–69 % / ≥ 70 %.
3. **Reto de 7 días** (`.cj-sema` sin lámparas): siete teclas (`.cj-key`, 48 px, canto de 3 px) que
   se marcan con ✓ y pasan a cobre; el progreso va en el `cj-card-meta`.
4. Dos tarjetas de lección (ícono cobre, título, "3 MIN").

## Medidas y estilos tomados de la app
| Elemento | Valor |
|---|---|
| Cinta | 30 px, `--acc`, mono 11 px, `letter-spacing` 0,08 em, punto de 6 px |
| Marca `$` | 32 px, radio 9, `--acc`, canto `0 3px 0 --acc-edge` |
| Píldoras de navegación | 14 px/500, `padding` 8×12, radio 10; activa `--raised` + `--tx` |
| Tarjeta cobre | radio 20, `padding` 20, canto `0 4px 0 --acc-edge`, cifra mono 600 50 px, `letter-spacing` −0,03 em |
| Tarjeta semáforo | `--panel`, borde `--line`, radio 18, canto `0 3px 0 --key` |
| Lámparas | 22 px (26 en escritorio), apagadas al 20 %, encendida con `0 0 16px` del color |
| Tarjeta normal | `--panel`, borde `--line`, radio 18, `padding` 16–18 |
| Botón principal | 52–54 px, radio 12, `--acc`, canto `0 4px 0 --acc-edge` |
| Tecla / chip | 40–48 px, radio 10–12, `--raised`, canto `0 3px 0 --key`; activa en `--acc` |
| Campo | 52 px, radio 12, `--raised`, borde `--line` |
| Ticket de papel | `--paper`, radio 6 arriba, mono 12,5 px, punteado `1.5px dotted #8a8b84` |

## Íconos
El diseño usa **Lucide** (https://lucide.dev, trazo 2, `round`), incrustados como SVG en los
artboards. La app usa hoy Phosphor (`ph-duotone`). Decisión pendiente antes de implementar:
- (a) migrar la app a `lucide-react` y usar estos nombres, o
- (b) mantener Phosphor y sustituir por su equivalente.

| Uso | Lucide | Phosphor equivalente |
|---|---|---|
| Gastos hormiga | `sparkles` | `ph-sparkle` |
| Panel | `house` | `ph-house` |
| Gastos / dónde se va | `receipt` | `ph-receipt` |
| Asistente | `message-circle`, `bot` | `ph-chat-circle`, `ph-robot` |
| Plan / reto | `target`, `flame` | `ph-target`, `ph-fire` |
| Café, delivery, suscripciones | `coffee`, `bike`, `repeat` | `ph-coffee`, `ph-bicycle`, `ph-repeat` |
| Lección | `book-open`, `piggy-bank` | `ph-book-open`, `ph-piggy-bank` |
| Aviso del semáforo | `triangle-alert` | `ph-warning` |
| Avisos, volver, enviar, candado | `bell`, `arrow-left`, `send`, `lock` | `ph-bell`, `ph-arrow-left`, `ph-paper-plane-tilt`, `ph-lock` |

## Implementación sugerida
- Ruta `/asistente` con tres vistas (panel hormiga, chat, plan) dentro de `AppLayout`, y una píldora
  "Asistente" en `NAV_ITEMS` (`frontend/src/components/Layout/AppLayout.jsx`). La bienvenida se
  muestra una vez y se recuerda en `localStorage`.
- Reutilizar `SaldoCard` (semáforo) con los datos de compras chicas, y las clases `cj-hero`,
  `cj-card`, `cj-key`, `cj-btn` de `frontend/src/styles/caja.css`.
- El total y el top 3 salen de `dashboardStats` filtrando por monto bajo el umbral; el simulador
  es solo frontend. El chat consume la API de la Fase 1 de la spec.
- Tema claro: aplicar las mismas variables; los artboards están solo en oscuro.

## Datos de ejemplo
Los montos ($ 3.840, 14 compras de café a $ 95, etc.), el nombre y el mes son inventados para el
mock; no son métricas del producto.
