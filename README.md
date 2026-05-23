# Draw Pixilated Flower

**Live:** https://draw-pixilated-flower.vercel.app/

A browser-based pixel drawing app. Works on laptop/desktop only — screens narrower than 800px or touch devices show a "Open this link on a laptop to draw" message.

## Stack

- Vanilla HTML, CSS, JavaScript
- [Phosphor Icons](https://phosphoricons.com/) (web bundle)
- [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) (Google Fonts)
- Vite (dev server, build, preview)
- Supabase (drawing uploads)
- Vercel Speed Insights

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

Clicking or dragging inside the canvas paints `div.pixel` elements absolutely positioned on the grid. Painting outside the canvas bounds is ignored.

### Controls

| Control | What it does |
|---------|-------------|
| Click / drag | Paint pixels |
| Color swatches | Select active color (5 colors) |
| Shade palette | Select a darker or lighter shade of the active color |
| Clear (↺) | Remove all painted pixels |
| Cmd+Z / Ctrl+Z | Undo one pixel at a time |
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

Active color state is driven by `data-active-color` on `#palette-wrapper` — set by JS on every swatch click. CSS reads this attribute directly; no `:has()` or `:nth-child` selectors are used for logic.

### Reference image overlay

`#canvas-box::before` renders an image at 30% opacity. The default is `flower image.png` (in `public/`). Uploading via the button replaces it with an object URL set as `--canvas-bg-image`. The eye toggle sets opacity to 0 via the `.image-hidden` class.

### Corner flower decorations

Pixel-art flower PNGs are fixed to the bottom-left and bottom-right corners. Each flower has a `data-flower` attribute (`l1–l4`, `r1–r3`) that drives its individual height, gap, flip, and rotation via CSS tokens in `:root`. A wind sway animation (`wind-sway-1` through `wind-sway-4`) runs continuously with staggered delays to simulate a breeze.

### Cursor

A paint-bucket SVG with a color-filled drop matching the active swatch color. Rebuilt as an inline `data:` URI on every color change.

### Save

Renders all `.pixel` elements onto an offscreen `<canvas>` at 2× scale and triggers a `drawing.png` download. The same blob is uploaded to Supabase storage with a timestamp filename.

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
  right 3.png
```
