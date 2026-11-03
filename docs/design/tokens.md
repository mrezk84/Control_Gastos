# Tokens

Implementación: `frontend/src/styles/caja.css`. El tema se aplica con `data-theme="dark|light"` en `<html>`
(clave `theme` en `localStorage`; si no hay valor guardado se usa `prefers-color-scheme`).

## Color
| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--bg` | `#0e0f11` | `#f1f1ec` | Fondo de la app |
| `--panel` | `#16171a` | `#ffffff` | Tarjetas |
| `--raised` | `#1d1f22` | `#f6f6f1` | Teclas, campos, avatar |
| `--line` | `#34373b` | `#c9c9c0` | Bordes |
| `--tx` | `#ededea` | `#141513` | Texto principal |
| `--mu` | `#a8aaa7` | `#575953` | Texto secundario |
| `--acc` | `oklch(0.68 0.13 58)` (cobre) | igual | Acento: fondos de botón y tarjeta principal |
| `--acct` | `oklch(0.68 0.13 58)` | `oklch(0.44 0.1 52)` | Acento como texto/icono/línea |
| `--accsoft` | `oklch(0.68 0.13 58 / .12)` | `… / .25` | Fondo de selección |
| `--acc-edge` | `oklch(0.46 0.1 52)` | igual | Sombra de relieve del acento |
| `--key` | `#08090a` | `#d9d9d1` | Sombra de relieve de teclas/tarjetas |
| `--paper` | `#e9e8e1` | `#f7f6ef` | Recibo de papel |
| `--ink-on-acc` | `#0e0f11` | igual | Texto sobre `--acc` |
| `--display-bg` | `#0b0c0d` | igual | Visor del monto (siempre oscuro) |
| `--display-line` / `--display-mu` | `#1a1c1e` / `#a8aaa7` | igual | Borde del visor y etiquetas apagadas dentro de él |
| `--display-amt` | `oklch(0.78 0.14 58)` | igual | Cifra del visor (cobre claro con brillo) |
| `--paper-tx` / `--paper-mu` | `#1b1c1a` / `#4b4d48` | igual | Texto del recibo |
| `--focus` | `oklch(0.85 0.13 215)` | `oklch(0.45 0.15 250)` | Anillo de foco de teclado (3 px) |
| `--ok` / `--warn` / `--bad` | `oklch(0.8 0.17 150)` / `oklch(0.87 0.16 95)` / `oklch(0.7 0.19 25)` | `oklch(0.5 0.14 150)` / `oklch(0.55 0.13 80)` / `oklch(0.5 0.2 25)` | Semáforo del saldo (verde, ámbar, rojo) |

### Contrastes medidos (WCAG 2.x)
| Par | Oscuro | Claro |
|---|---|---|
| `--tx` sobre `--panel` | 15,3 | 18,3 |
| `--mu` sobre `--panel` | 7,9 | 7,3 |
| `--acct` sobre `--panel` | 6,4 | 6,9 |
| `--ink-on-acc` sobre `--acc` | 6,3 | 6,3 |
| `--paper-mu` sobre `--paper` | 6,9 (sobre `#e9e8e1`) | 6,9 |

(Valores del diseño `Tokens.dc.html` de Claude Design; no se han vuelto a medir en el código.)

## Paleta de categorías (6 mayores, por orden de monto)
| # | Oscuro | Claro |
|---|---|---|
| 1 | `oklch(0.68 0.13 58)` | `oklch(0.5 0.12 55)` |
| 2 | `oklch(0.78 0.13 255)` | `oklch(0.5 0.15 255)` |
| 3 | `oklch(0.84 0.15 125)` | `oklch(0.55 0.13 125)` |
| 4 | `oklch(0.76 0.14 305)` | `oklch(0.5 0.17 305)` |
| 5 | `oklch(0.78 0.13 350)` | `oklch(0.52 0.18 350)` |
| 6 | `#9a9c99` | `#6b6d68` |

## Tipografía
- **Geist** 400/500/600: interfaz. **Geist Mono** 400/500/600: montos, etiquetas, cinta, teclas.
- Escala: saludo 42/28 px (escritorio/móvil, peso 500, `letter-spacing -0.025em`); cifra hero 64/46 px mono 600; KPI 24/19 px mono; visor 44/36 px mono; etiquetas 11–12 px mono en mayúsculas con `letter-spacing .06–.08em`.

## Forma y relieve
- Radios: tarjeta hero 20, paneles 16–20, teclas y campos 11–12, avatar 50 %.
- Relieve de tecla: `box-shadow: 0 3px 0 var(--key)`; al presionar `translateY(2px)` y `0 1px 0`.
- Relieve del acento: `0 3px/4px 0 var(--acc-edge)`.
- Visor: `inset 0 2px 8px rgba(0,0,0,.5)` y brillo `text-shadow: 0 0 18px oklch(0.78 0.14 58 / .35)`.
- Recibo: borde inferior dentado con `mask`: `radial-gradient(circle at 6px 100%, transparent 5px, #000 5.5px) 0 0 / 12px 100% repeat-x`; radio superior de 6 px.
- Barras punteadas por categoría: `repeating-linear-gradient(to top, <color> 0 7px, transparent 7px 10px)` (5/8 px en pantallas de menos de 480 px). Las del gasto diario del resumen usan `#0e0f11 0 4px, transparent 4px 6px`.

## Movimiento
- Cinta: `translateX(0 → -50%)`, lineal e infinita, 40 s (configurable); se detiene con `prefers-reduced-motion`.
- Transición de tema: `background .25s, color .25s`.

## Iconos (Phosphor)
Categorías: Vivienda `house`, Alimentación `fork-knife`, Transporte `bus`, Servicios `lightning`,
Entretenimiento `film-slate`, Salud `first-aid-kit`, Educación `graduation-cap`, Ropa `t-shirt`,
Tecnología `device-mobile`, Otros `package` (todos en `ph-duotone`). Interfaz: `wallet`, `chart-bar`,
`trophy`, `receipt`, `squares-four` (duotone); `plus-circle`, `scan`, `paperclip`,
`clock-counter-clockwise`, `pencil-simple`, `trash`, `backspace`, `moon`, `sun`, `sign-out` (regular).
