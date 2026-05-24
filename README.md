# Draw Pixelated Flower

**Live:** https://pixelatedflower.vercel.app/

A browser-based pixel drawing app. Works on laptop/desktop only — touch devices and screens narrower than 800px show a video demo and a prompt to open on a bigger screen.

## Stack

- Vanilla HTML, CSS, JavaScript
- [Phosphor Icons](https://phosphoricons.com/) (web bundle)
- [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) (Google Fonts)
- Vite (dev server, build, preview)
- Supabase (drawing uploads)
- Vercel Speed Insights + Analytics

## Running locally

```bash
npm run dev
```

| Script | Command |
|--------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Preview build | `npm run preview` |

## How it works

The full viewport is covered by a `#grid` div with a CSS grid background. A 600×600 px canvas area (`#canvas-box`) sits centered on top with a dashed border and a dimming overlay outside it.

Clicking or dragging inside the canvas paints `div.pixel` elements absolutely positioned on the grid. Painting outside the canvas bounds is ignored. Painting over an existing pixel updates its color in place.

Each mousedown→mouseup is one undo stroke. Cmd+Z / Ctrl+Z undoes the entire last stroke at once, restoring any overwritten pixel colors.

### Controls

| Control | What it does |
|---------|-------------|
| Click / drag | Paint pixels |
| Color swatches | Select active color (5 colors) |
| Shade palette | Select a darker or lighter shade of the active color |
| Clear (↺) | Remove all painted pixels |
| Cmd+Z / Ctrl+Z | Undo the last full stroke |
| Eye toggle | Show / hide the reference image overlay |
| Download | Save the canvas as `drawing.png` at 2× scale (1200×1200px) |
| Add Reference Image | Upload a local image as a tracing guide |

The download button is disabled until at least one pixel is painted.

### Color system

Colors are defined as CSS custom properties in `:root` across three token levels and read by JS via `getComputedStyle`. JS never hardcodes hex values.

**Token hierarchy:**

```
Primitives  →  raw named values  (--primitive-red-300: #F07A86)
Semantic    →  purpose aliases   (--color-1-300: var(--primitive-red-300))
Component   →  element tokens    (--canvas-size, --flower-height-1 …)
```

**Palette (5 colors × 4 shades each):**

| Swatch | Color | Shades |
|--------|-------|--------|
| `data-color="1"` | Red | 700 → 500 → 300 → 100 |
| `data-color="2"` | Blue | 700 → 500 → 300 → 100 |
| `data-color="3"` | Yellow | 700 → 500 → 300 → 100 |
| `data-color="4"` | Purple | 700 → 500 → 300 → 100 |
| `data-color="5"` | Green | 700 → 500 → 300 → 100 |

### Shade palette

Below the main palette is a shade row showing 4 shades of the active color (darkest → lightest). It slides to center under the active swatch and animates in with a stagger. Clicking a shade paints with that shade. The mid-light shade (300) is auto-selected when switching colors.

Active color state is driven by `data-active-color` on `.palette` — set by JS on every swatch click. CSS reads this attribute directly; no `:has()` or `:nth-child` selectors are used for logic. Selected swatch/shade state is tracked via `data-active="true"` (data attribute, not a class).

### Reference image overlay

`#canvas-box::before` renders an image at 30% opacity. The default is `flower image.png` (in `public/`). Uploading via the button replaces it with an object URL set as `--canvas-bg-image`. The eye toggle controls visibility via `data-visible="false"` on `#canvas-box` and `data-state="open"` on the toggle button.

### Mobile / touch fallback

On touch devices or viewports under 800px, the drawing UI is hidden and a full-screen device block is shown instead. It displays a looping YouTube embed (video demo) and text prompting the user to open on a laptop.

### Corner flower decorations

Pixel-art flower PNGs are fixed to the bottom-left and bottom-right corners. Each flower has a `data-flower` attribute (`l1–l4`, `r1–r3`) that drives its individual height, gap, flip, and rotation via CSS tokens in `:root`. A wind sway animation (`wind-sway-1` through `wind-sway-4`) runs continuously with staggered delays to simulate a breeze.

**Flower positioning tokens:**

| Token | Controls |
|-------|----------|
| `--flower-height-{id}` | Height of each flower |
| `--flower-edge-l1` | Gap between l1 and the left screen edge |
| `--flower-gap-l{n}` | `margin-right` on ln (gap to the next flower) |
| `--flower-gap-r{n}` | `margin-left` on rn (gap from the previous flower) |
| `--flower-edge-r3` | Gap between r3 and the right screen edge |

### Cursor

A paint-bucket SVG with a color-filled drop matching the active swatch color. Rebuilt as an inline `data:` URI on every color change.

### Save

Renders all `.pixel` elements onto an offscreen `<canvas>` at 2× scale and triggers a `drawing.png` download. The same blob is uploaded to Supabase storage with a timestamp filename.

## Naming conventions

### Classes — BEM-lite
All classes follow `.block__element` and `.block__element--modifier`. Reusable UI primitives (e.g. `.icon-button`) are standalone blocks, not children of wherever they first appear.

### State — data attributes
Element state is tracked via data attributes, not class names:

| State | Attribute |
|-------|-----------|
| Canvas image visible | `data-visible="true/false"` on `#canvas-box` |
| Eye toggle open | `data-state="open"` on `.icon-button--visibility` |
| Active swatch / shade | `data-active="true"` on `.palette__swatch` / `.palette__shade` |
| Active color | `data-active-color="1–5"` on `.palette` |

Exception: transient animation-trigger classes (`.animating`, `.slide-left`) remain as classes — they're added, used for a reflow, then removed immediately.

### Tokens — three levels
```
Primitives  →  raw named values  (--primitive-red-300: #F07A86)
Semantic    →  purpose aliases   (--color-1-300: var(--primitive-red-300))
Component   →  element tokens    (--canvas-size, --flower-height-1 …)
```
Only repeated decisions are tokenized. Single-use values are inlined at the level that consumes them.

## CSS architecture

`src/style.css` is split into 7 layers:

| Layer | Contents |
|-------|----------|
| 1. Reset | Box model reset |
| 2. Design Tokens | CSS custom properties (primitives → semantic → component) |
| 3. Base Layout | body, grid, canvas layout structure |
| 4. Components | Canvas, controls, palette, flowers, device block |
| 5. Interactions / States | Hover, active, disabled, toggle, animation triggers |
| 6. Animations | All `@keyframes` |
| 7. Responsive | All `@media` queries |

## File structure

```
index.html          — markup + Open Graph / Twitter Card meta
main.js             — all JS logic
src/style.css       — styles and design tokens
vercel.json         — Vercel build config
public/
  og-image.png          — OG/Twitter share image (1200×630px)
  Pixlated flower.png   — favicon
  flower image.png      — default reference image
  Union.png             — mask shape for color swatches
  left1.png             — corner flower (bottom-left cluster)
  left2.png
  left 3.png
  left4.png
  right1.png            — corner flower (bottom-right)
  right2.png
  right3.png
```
