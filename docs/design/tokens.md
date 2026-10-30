# Tokens

Implementación: `frontend/src/styles/caja.css`. El tema se aplica con `data-theme="dark|light"` en `<html>`
(clave `theme` en `localStorage`; si no hay valor guardado se usa `prefers-color-scheme`).

## Color
| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--bg` | `#0e0f11` | `#f1f1ec` | Fondo de la app |
| `--panel` | `#16171a` | `#ffffff` | Tarjetas |
| `--raised` | `#1d1f22` | `#f6f6f1` | Teclas, campos, avatar |
| `--line` | `#26282c` | `#e1e1da` | Bordes |
| `--tx` | `#ededea` | `#141513` | Texto principal |
| `--mu` | `#8f918f` | `#686a65` | Texto secundario |
| `--acc` | `oklch(0.88 0.18 128)` | igual | Acento: fondos de botón y tarjeta principal |
| `--acct` | `oklch(0.88 0.18 128)` | `oklch(0.5 0.14 135)` | Acento como texto/icono/línea |
| `--accsoft` | `oklch(0.88 0.18 128 / .12)` | `… / .25` | Fondo de selección |
| `--acc-edge` | `oklch(0.62 0.14 128)` | igual | Sombra de relieve del acento |
| `--key` | `#08090a` | `#d9d9d1` | Sombra de relieve de teclas/tarjetas |
| `--paper` | `#e9e8e1` | `#f7f6ef` | Recibo de papel |
| `--ink-on-acc` | `#0e0f11` | igual | Texto sobre `--acc` |
| `--display-bg` | `#0b0c0d` | igual | Visor del monto (siempre oscuro) |
| `--paper-tx` / `--paper-mu` | `#1b1c1a` / `#5f615c` | igual | Texto del recibo |

### Contrastes medidos (WCAG 2.x)
| Par | Oscuro | Claro |
|---|---|---|
| `--tx` sobre `--panel` | 15,3 | 18,3 |
| `--mu` sobre `--bg` / `--panel` / `--raised` | 6,0 / 5,7 / 5,2 | 4,8 / 5,5 / 5,1 |
| `--acct` sobre `--panel` | 13,0 | 5,7 |
| `--ink-on-acc` sobre `--acc` | 13,9 | 13,9 |
| `--paper-mu` sobre `--paper` | — | 5,1 (sobre `#e9e8e1`) |

## Paleta de categorías (6 mayores, por orden de monto)
| # | Oscuro | Claro |
|---|---|---|
| 1 | `oklch(0.88 0.18 128)` | `oklch(0.8 0.19 128)` |
| 2 | `oklch(0.74 0.14 128)` | `oklch(0.66 0.16 132)` |
| 3 | `oklch(0.6 0.1 128)` | `oklch(0.5 0.12 135)` |
| 4 | `#6b6e70` | `#3a3c39` |
| 5 | `#4a4d50` | `#80827c` |
| 6 | `#33363a` | `#b8b9b2` |

## Tipografía
- **Geist** 400/500/600: interfaz. **Geist Mono** 400/500/600: montos, etiquetas, cinta, teclas.
- Escala: saludo 42/28 px (escritorio/móvil, peso 500, `letter-spacing -0.025em`); cifra hero 64/46 px mono 600; KPI 24/19 px mono; visor 44/36 px mono; etiquetas 11–12 px mono en mayúsculas con `letter-spacing .06–.08em`.

## Forma y relieve
- Radios: tarjeta hero 20, paneles 16–20, teclas y campos 11–12, avatar 50 %.
- Relieve de tecla: `box-shadow: 0 3px 0 var(--key)`; al presionar `translateY(2px)` y `0 1px 0`.
- Relieve del acento: `0 3px/4px 0 var(--acc-edge)`.
- Visor: `inset 0 2px 8px rgba(0,0,0,.5)` y brillo `text-shadow: 0 0 18px oklch(0.88 0.18 128 / .35)`.
- Recibo: borde inferior dentado con `mask` (círculos de 5 px cada 12 px).
- Barras punteadas: `repeating-linear-gradient(to top, <color> 0 7px, transparent 7px 10px)` (5/8 px en móvil).

## Movimiento
- Cinta: `translateX(0 → -50%)`, lineal e infinita, 40 s (configurable); se detiene con `prefers-reduced-motion`.
- Transición de tema: `background .25s, color .25s`.

## Iconos (Phosphor)
Categorías: Vivienda `house`, Alimentación `fork-knife`, Transporte `bus`, Servicios `lightning`,
Entretenimiento `film-slate`, Salud `first-aid-kit`, Educación `graduation-cap`, Ropa `t-shirt`,
Tecnología `device-mobile`, Otros `package` (todos en `ph-duotone`). Interfaz: `wallet`, `chart-bar`,
`trophy`, `receipt`, `squares-four` (duotone); `plus-circle`, `scan`, `paperclip`,
`clock-counter-clockwise`, `pencil-simple`, `trash`, `backspace`, `moon`, `sun`, `sign-out` (regular).
