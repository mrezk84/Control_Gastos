---
name: Control Gastos
description: Registro de gastos tipo caja registradora, con cifras de máquina, un único acento cobre y dos temas.
colors:
  copper: "oklch(0.68 0.13 58)"
  copper-text-light: "oklch(0.44 0.1 52)"
  copper-edge: "oklch(0.46 0.1 52)"
  display-amount: "oklch(0.78 0.14 58)"
  ink-on-copper: "#0e0f11"
  graphite-bg: "#0e0f11"
  graphite-panel: "#16171a"
  graphite-raised: "#1d1f22"
  graphite-line: "#34373b"
  graphite-key: "#08090a"
  bone-text: "#ededea"
  bone-muted: "#a8aaa7"
  paper-bg: "#f1f1ec"
  paper-panel: "#ffffff"
  paper-raised: "#f6f6f1"
  paper-line: "#c9c9c0"
  paper-key: "#d9d9d1"
  ink-text: "#141513"
  ink-muted: "#575953"
  receipt-dark: "#e9e8e1"
  receipt-light: "#f7f6ef"
  receipt-text: "#1b1c1a"
  display-bg: "#0b0c0d"
  focus-dark: "oklch(0.85 0.13 215)"
  focus-light: "oklch(0.45 0.15 250)"
  ok-dark: "oklch(0.8 0.17 150)"
  warn-dark: "oklch(0.87 0.16 95)"
  bad-dark: "oklch(0.7 0.19 25)"
  danger: "#ff8a7d"
typography:
  greeting:
    fontFamily: "Geist Variable, Geist, system-ui, sans-serif"
    fontSize: "42px"
    fontWeight: 500
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Geist Variable, Geist, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
  body:
    fontFamily: "Geist Variable, Geist, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  figure-hero:
    fontFamily: "Geist Mono Variable, Geist Mono, ui-monospace, monospace"
    fontSize: "64px"
    fontWeight: 600
  display-amount:
    fontFamily: "Geist Mono Variable, Geist Mono, ui-monospace, monospace"
    fontSize: "44px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  label:
    fontFamily: "Geist Mono Variable, Geist Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.08em"
rounded:
  hero: "20px"
  card: "18px"
  display: "14px"
  key: "12px"
  field: "11px"
  receipt-top: "6px"
  avatar: "50%"
spacing:
  grid-gap: "8px"
  card-padding: "18px"
  stack: "16px"
components:
  button-key:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.bone-text}"
    rounded: "{rounded.key}"
    height: "52px"
  button-primary:
    backgroundColor: "{colors.copper}"
    textColor: "{colors.ink-on-copper}"
    rounded: "{rounded.key}"
    height: "52px"
  field:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.bone-text}"
    rounded: "{rounded.field}"
    height: "46px"
    padding: "0 14px"
  card:
    backgroundColor: "{colors.graphite-panel}"
    textColor: "{colors.bone-text}"
    rounded: "{rounded.card}"
    padding: "18px"
  display:
    backgroundColor: "{colors.display-bg}"
    textColor: "{colors.display-amount}"
    typography: "{typography.display-amount}"
    rounded: "{rounded.display}"
    padding: "14px 16px 12px"
  receipt:
    backgroundColor: "{colors.receipt-dark}"
    textColor: "{colors.receipt-text}"
    rounded: "{rounded.receipt-top}"
    padding: "18px 20px 28px"
---

# Design System: Control Gastos

## Overview

**Creative North Star: "El libro de contabilidad"**

Un libro mayor con un gesto de caja registradora a la entrada. La interfaz ordena cifras: el monto manda, el color nunca es la única señal, y todo lo demás se aparta. La caja registradora (visor, teclado, recibo de papel) es el momento de registrar un gasto; alrededor, el sistema es sobrio, de paneles planos y tipografía técnica.

El carácter es táctil, técnico y sobrio: una sola nota cálida (cobre) sobre grafito neutro, números en monoespaciada, teclas que se hunden. Rechaza el vidrio esmerilado, los degradados de malla y los brillos difusos del estilo "esmeralda fintech" anterior (`theme.css`, hoy solo capa de compatibilidad).

**Key Characteristics:**
- Un único acento (cobre); el resto es neutro más el semáforo del saldo y la paleta de categorías.
- Cifras de máquina (Geist Mono) para montos, etiquetas, cinta y teclas.
- Relieve sólido en lo accionable; tarjetas planas.
- Dos temas (oscuro por defecto, claro) con el mismo conjunto de variables.
- Cada barra o segmento lleva su valor en texto: señal redundante al color.

## Colors

Grafito cálido y hueso con un solo metal, el cobre. La paleta se define como variables CSS en `frontend/src/styles/caja.css` y cambia con `data-theme="dark|light"`.

### Primary
- **Cobre de caja** (`oklch(0.68 0.13 58)`): fondo de botón principal, cinta, marca y tarjeta principal. Como texto o icono sobre tema claro se sustituye por **Cobre de tinta** (`oklch(0.44 0.1 52)`, contraste 6,9:1).
- **Cobre brillante del visor** (`oklch(0.78 0.14 58)`): solo la cifra del visor, siempre sobre fondo oscuro, con un halo suave.
- **Canto de cobre** (`oklch(0.46 0.1 52)`): la sombra sólida de relieve bajo el botón principal.

### Neutral (oscuro / claro)
- **Fondo** (`#0e0f11` / `#f1f1ec`), **Panel** (`#16171a` / `#ffffff`), **Elevado** (`#1d1f22` / `#f6f6f1`): tres niveles tonales para app, tarjetas y teclas/campos.
- **Línea** (`#34373b` / `#c9c9c0`): bordes de 1 px.
- **Texto** (`#ededea` / `#141513`) y **Texto apagado** (`#a8aaa7` / `#575953`).
- **Tecla (sombra)** (`#08090a` / `#d9d9d1`): color del relieve inferior.
- **Papel de recibo** (`#e9e8e1` / `#f7f6ef`) con texto `#1b1c1a`; **Visor** (`#0b0c0d`, siempre oscuro).

### Semantic
- **Semáforo del saldo**: verde `oklch(0.8 0.17 150)`, ámbar `oklch(0.87 0.16 95)`, rojo `oklch(0.7 0.19 25)` en oscuro (versiones más oscuras en claro).
- **Foco**: cian `oklch(0.85 0.13 215)` en oscuro, azul `oklch(0.45 0.15 250)` en claro; anillo de 3 px.
- **Categorías**: seis tonos por orden de monto (cobre, azul, lima, violeta, rosa, gris), con variante clara de menor luminosidad.

### Named Rules
**The One Copper Rule.** El cobre es el único acento. Si algo necesita otro color de marca, el diseño está mal; los colores restantes son semáforo o categoría.
**The Not-Only-Color Rule.** Ninguna barra, segmento o estado depende solo del color: lleva monto, porcentaje o icono.
**The Light-Text Swap Rule.** En tema claro el cobre no se usa como texto; se usa Cobre de tinta.

## Typography

**Interface Font:** Geist (Variable, con `system-ui`)
**Figures/Label Font:** Geist Mono (Variable, con `ui-monospace`)

**Character:** Geist ofrece una voz neutra y legible para texto; Geist Mono da cifras de máquina que alinean y se leen como un contador.

### Hierarchy
- **Greeting** (500, 42px escritorio / 28px móvil, interletraje -0.025em): saludo del Dashboard.
- **Figure hero** (Mono 600, 64px / 46px): cifra principal del saldo.
- **Display amount** (Mono 600, 44px / 36px, línea 1.1): monto en el visor.
- **KPI** (Mono, 24px / 19px): tarjetas de resumen.
- **Title** (600, 16px): títulos de tarjeta.
- **Body** (400, 14px, línea 1.4): texto general.
- **Label** (Mono, 11–12px, mayúsculas, interletraje 0.06–0.08em): etiquetas, metadatos, cinta.

### Named Rules
**The Machine Figures Rule.** Todo monto y dato numérico va en Geist Mono; el texto corrido, en Geist.

## Layout

Contenedor de hasta 1440 px con rellenos laterales fluidos (`clamp(16px, 3vw, 28px)`). Cabecera de panel con marca, navegación, selector de tema y cuenta; en móvil la cuenta pasa a un botón avatar de 44 px. Las tarjetas son flexibles (`flex: 1.4 1 320px` / `1 1 260px`) y se apilan. Rejilla del teclado numérico de 3 columnas con separación de 8 px; selector de categorías en 5 columnas. Puntos de corte: 1023, 759 y 479 px. Objetivos táctiles de al menos 44 px en móvil.

## Elevation & Depth

Híbrido. Las superficies se separan con capas tonales (fondo → panel → elevado) y bordes de 1 px; las tarjetas son planas. La profundidad física se reserva a lo accionable: relieve sólido inferior, sin sombras difusas ni cristal. El visor es el único elemento hundido.

### Shadow Vocabulary
- **Relieve de tecla** (`box-shadow: 0 3px 0 var(--key)`): botones, teclas, adjuntos; al presionar `translateY(2px)` y `0 1px 0`.
- **Relieve del acento** (`box-shadow: 0 4px 0 var(--acc-edge)`): botón principal de envío; al presionar `translateY(3px)` y `0 1px 0`.
- **Visor hundido** (`box-shadow: inset 0 2px 8px rgba(0,0,0,.5)`) y halo `text-shadow: 0 0 18px oklch(0.78 0.14 58 / .35)` en la cifra.

### Named Rules
**The Raised-Actions-Only Rule.** Solo lo que se pulsa tiene relieve; las tarjetas de contenido son planas.

## Shapes

Esquinas generosas pero técnicas: tarjeta hero 20 px, paneles 18 px, visor 14 px, teclas 12 px, campos 11 px, avatar circular. El recibo tiene radio superior de 6 px y borde inferior dentado (máscara radial de 12 px). Las barras de categoría se dibujan punteadas con rayas horizontales (`repeating-linear-gradient`), no con relleno liso.

## Components

### Buttons
- **Key (secundario):** fondo elevado, borde de 1 px, radio 12 px, altura 52 px (36 px en barras), relieve de tecla.
- **Primary (envío):** fondo cobre, texto `#0e0f11`, 52 px, relieve de acento; ocupa el doble que el secundario en la fila de acciones.
- **Link:** texto en Cobre (`--acct`), sin fondo.
- **Estados:** foco con anillo de 3 px y desplazamiento de 2 px; deshabilitado al 60 % de opacidad.

### Inputs / Fields
- **Style:** fondo elevado, borde de 1 px, radio 11 px, altura 46 px, relleno 0 14 px.
- **Focus:** el borde pasa a Cobre (`--acct`) más el anillo global de foco.

### Cards / Containers
- **Corner Style:** 18 px. **Background:** panel. **Border:** 1 px línea. **Shadow:** ninguna. **Padding:** 18 px, separación interna de 16 px.

### Navigation
- Enlaces de 14 px, peso 500, radio 10 px, altura mínima 36 px. Activo: texto principal sobre fondo elevado. Selector de tema segmentado (Oscuro / Claro).

### Display (visor del monto)
Fondo siempre oscuro, cifra Mono en cobre brillante alineada a la derecha, etiqueta superior en Mono 10,5 px.

### Numeric keypad (teclado)
Tres columnas, teclas de 52 px en Mono 19 px con relieve. Utilizable con teclado físico (dígitos, Backspace, Enter).

### Paper receipt (recibo)
Papel con borde dentado, texto Mono, líneas con puntos guía (`dotted`) y regla discontinua; total en negrita.

### Ticker (cinta)
Banda de 30 px en cobre con datos en Mono mayúsculas; 40 s lineal e infinita; se detiene con `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** usar cobre solo como acento (botón principal, cinta, marca); texto cobre en claro con `oklch(0.44 0.1 52)`.
- **Do** poner todo monto en Geist Mono y acompañar cada barra con su valor.
- **Do** dar relieve de 3 px solo a lo accionable y hundirlo al presionar.
- **Do** mantener contraste de texto ≥ 4,5:1 y objetivos táctiles ≥ 44 px en móvil.
- **Do** respetar `prefers-reduced-motion` y el teclado físico en el monto.

### Don't:
- **Don't** usar vidrio esmerilado, degradados de malla, brillos difusos ni la paleta esmeralda del estilo anterior.
- **Don't** introducir un segundo color de marca.
- **Don't** usar emojis en la interfaz; iconos Phosphor (regular y duotone).
- **Don't** sombrear las tarjetas de contenido ni depender solo del color para transmitir estado.
