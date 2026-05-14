# Draw Pixilated Flower

A browser-based pixel drawing app. Works on laptop/desktop only — screens narrower than 800px show a "Open this link on a laptop to draw" message.

## Stack

- Vanilla HTML, CSS, JavaScript
- [Phosphor Icons](https://phosphoricons.com/) (web bundle)
- [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) (Google Fonts)
- Vite (dev server, build, preview)

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
| Clear button (↺) | Removes all painted pixels |
| Cmd+Z (Mac / iOS) · Ctrl+Z (Windows) | Undo one pixel at a time |
| Eye toggle | Show / hide the reference image |
| Download button | Saves the canvas area as `drawing.png` |
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

### Reference image

`#canvas-box::before` renders a reference image at 30% opacity. The default is `flower image.png` (bundled in the repo). Uploading a file via the button replaces it with an object URL; toggling the eye button sets opacity to 0 via the `.image-hidden` class.

### Cursor

The active cursor is a paint-bucket SVG with a color-filled drop that matches the selected swatch color. It is rebuilt as an inline `data:` URI whenever the active color changes.

### Save

Clicking the download button renders all `.pixel` elements onto an offscreen `<canvas>` sized to the canvas-box dimensions and triggers a download of `drawing.png` as a PNG.

## File structure

```
index.html          — markup
main.js             — all JS logic
src/style.css       — all styles and CSS variables
flower image.png    — default reference image
Union.png           — mask shape used for color swatches
```
