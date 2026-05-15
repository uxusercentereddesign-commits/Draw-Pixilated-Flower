# Draw Pixilated Flower

**Live:** https://draw-pixilated-flower.vercel.app/

A browser-based pixel drawing app. Works on laptop/desktop only — screens narrower than 800px show a "Open this link on a laptop to draw" message.

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

Other scripts from `package.json`:

| Script | Command |
|--------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Preview build | `npm run preview` |

## How it works

The full viewport is covered by a `#grid` div with a 16×16 px CSS grid background. A 600×600 px canvas area (`#canvas-box`) sits centered on top with a dashed border and a dimming overlay outside it.

Clicking or dragging inside the canvas area paints `div.pixel` elements (16×16 px) absolutely positioned on the grid. Painting outside the canvas bounds is ignored.

### Controls

| Control | What it does |
|---------|-------------|
| Click / drag | Paint pixels |
| Color swatches | Select active color (5 colors) |
| Shade palette | Select a darker or lighter shade of the active color |
| Clear button (↺) | Removes all painted pixels |
| Cmd+Z (Mac) · Ctrl+Z (Windows) | Undo one pixel at a time |
| Eye toggle | Show / hide the reference image |
| Download button | Saves the canvas as `drawing.png` (2× scale, 1200×1200px) |
| "Add a reference image" | Upload a local image to use as a tracing guide |

The download button is disabled until at least one pixel is painted.

### Colors

Colors are defined as CSS custom properties in `:root` and read by JS via `getComputedStyle`. JS never hardcodes hex values.

| Variable | Value |
|----------|-------|
| `--color-1` | `#7DBF82` |
| `--color-2` | `#9f7654` |
| `--color-3` | `#DCE9F5` |
| `--color-4` | `#F0A878` |
| `--color-5` | `#4A90D9` |

### Shade palette

Below the main color palette is a shade palette (`#shade-palette`) showing 5 solid shades of the active color — from darkest to lightest (left to right). Shades are computed by mixing the base color with black or white. No transparency is used.

Clicking a shade swatch paints with that shade. The shade palette updates whenever a new main color is selected. The base color swatch (`swatch-500`) is automatically marked active when a main color is selected.

### Reference image

`#canvas-box::before` renders a reference image at 30% opacity. The default is `flower image.png` (bundled in `public/`). Uploading a file via the button replaces it with an object URL; toggling the eye button sets opacity to 0 via the `.image-hidden` class.

### Cursor

The active cursor is a paint-bucket SVG with a color-filled drop that matches the selected swatch color. It is rebuilt as an inline `data:` URI whenever the active color changes.

### Save

Clicking the download button renders all `.pixel` elements onto an offscreen `<canvas>` at 2× scale (1200×1200px) and triggers a download of `drawing.png`. The same canvas blob is also uploaded to Supabase storage with a timestamp filename.

## File structure

```
index.html          — markup (includes Open Graph + Twitter Card meta tags)
main.js             — all JS logic
src/style.css       — all styles and CSS variables
vercel.json         — build config for Vercel
public/
  og-image.png          — OG/Twitter share image (1200×630px)
  Pixlated flower.png   — favicon (64×64)
  flower image.png      — default reference image
  Union.png             — mask shape used for color swatches
```
