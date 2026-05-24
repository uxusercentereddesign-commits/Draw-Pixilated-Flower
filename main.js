import '@phosphor-icons/web/bold';
import { createClient } from '@supabase/supabase-js';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { inject } from '@vercel/analytics';

injectSpeedInsights();
inject();

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET;

const grid = document.getElementById('grid');
const canvasBox = document.getElementById('canvas-box');
const clearBtn = document.querySelector('.icon-button--undo');
const eyeToggleBtn = document.querySelector('.icon-button--visibility');
const eraserBtn = document.querySelector('.icon-button--eraser');
const saveBtnEl = document.querySelector('.icon-button--download');
const uploadBtn = document.querySelector('.controls__upload');
const swatches = document.querySelectorAll('.palette__swatch');
const paletteWrapper = document.querySelector('.palette');

const CELL = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-size'), 10);
const rootStyle = getComputedStyle(document.documentElement);
const inkHex = rootStyle.getPropertyValue('--color-ink').trim().replace('#', '%23');

const getSwatchColor = (swatch) => {
  const index = swatch.dataset.color;
  return rootStyle.getPropertyValue(`--color-${index}`).trim();
};

const BUCKET_PATH = 'M234.53,139.07a8,8,0,0,0,3.13-13.24L122.17,10.34a8,8,0,0,0-11.31,0L70.25,51,45.65,26.34A8,8,0,0,0,34.34,37.66l24.6,24.6L15,106.17a24,24,0,0,0,0,33.94L99.89,225a24,24,0,0,0,33.94,0l78.49-78.49Zm-32.19-5.24-79.83,79.83a8,8,0,0,1-11.31,0L26.34,128.8a8,8,0,0,1,0-11.31L70.25,73.57l29.12,29.12a28,28,0,1,0,11.31-11.32L81.57,62.26l35-34.95L217.19,128l-11.72,3.9A8.09,8.09,0,0,0,202.34,133.83Zm-86.83-26.31,0,0a13.26,13.26,0,1,1-.05.06S115.51,107.53,115.51,107.52Z';
const DROP_PATH = 'M238.66,163.52a8,8,0,0,0-13.32,0C223.57,166.23,208,190.09,208,208a24,24,0,0,0,48,0C256,190.09,240.43,166.23,238.66,163.56Z';
const ERASER_PATH = 'M225,80.4,183.6,39a24,24,0,0,0-33.94,0L31,157.66a24,24,0,0,0,0,33.94l30.06,30.06A8,8,0,0,0,66.74,224H216a8,8,0,0,0,0-16h-84.7L225,114.34A24,24,0,0,0,225,80.4ZM108.68,208H70.05L42.33,180.28a8,8,0,0,1,0-11.31L96,115.31,148.69,168Zm105-105L160,156.69,107.31,104,161,50.34a8,8,0,0,1,11.32,0l41.38,41.38a8,8,0,0,1,0,11.31Z';

const buildCursor = (color) => {
  const fill = color.replace('#', '%23');
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' width='18' height='18'%3E%3Cg transform='translate(256,0) scale(-1,1)'%3E%3Cpath fill='${inkHex}' d='${BUCKET_PATH}'/%3E%3Cg transform='translate(232,186) scale(1.5) translate(-232,-186)'%3E%3Cpath fill='${fill}' d='${DROP_PATH}'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") 2 20, crosshair`;
};

const buildEraserCursor = () =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' width='18' height='18'%3E%3Cpath fill='${inkHex}' d='${ERASER_PATH}'/%3E%3C/svg%3E") 2 20, crosshair`;

let canvasRect = canvasBox.getBoundingClientRect();

window.addEventListener('resize', () => {
  canvasRect = canvasBox.getBoundingClientRect();
});

const history = [];
const pixelMap = new Map();
let isPainting = false;
let isErasing = false;
const painted = new Set();
const shadeSwatches = document.querySelectorAll('.palette__shade');
const shadePaletteEl = document.querySelector('.palette__shades');

let activeColorIndex = parseInt(document.querySelector('.palette__swatch[data-active="true"]').dataset.color);
let baseColor = getSwatchColor(document.querySelector('.palette__swatch[data-active="true"]'));
let activeColor = baseColor;

const getShadeColor = (colorIndex, level) =>
  rootStyle.getPropertyValue(`--color-${colorIndex}-${level}`).trim();

let prevColorIndex = null;
let lastMoveLeft = false;

const updateShadePalette = (colorIndex) => {
  if (prevColorIndex !== null && colorIndex !== prevColorIndex) {
    lastMoveLeft = colorIndex < prevColorIndex;
  }
  prevColorIndex = colorIndex;
  const movingLeft = lastMoveLeft;

  shadePaletteEl.classList.remove('animating');
  shadePaletteEl.classList.toggle('slide-left', movingLeft);
  void shadePaletteEl.offsetWidth;
  shadePaletteEl.classList.add('animating');
};

updateShadePalette(activeColorIndex);
document.querySelector('.palette__shade[data-level="300"]').dataset.active = 'true';

const deactivateEraser = () => {
  if (!isErasing) return;
  isErasing = false;
  delete eraserBtn.dataset.state;
};

document.querySelector('.palette__swatches').addEventListener('click', (e) => {
  const swatch = e.target.closest('.palette__swatch');
  if (!swatch) return;
  deactivateEraser();
  swatches.forEach(s => delete s.dataset.active);
  swatch.dataset.active = 'true';
  shadeSwatches.forEach(s => delete s.dataset.active);
  document.querySelector('.palette__shade[data-level="300"]').dataset.active = 'true';
  activeColorIndex = parseInt(swatch.dataset.color);
  paletteWrapper.dataset.activeColor = activeColorIndex;
  baseColor = getSwatchColor(swatch);
  activeColor = getShadeColor(activeColorIndex, '300');
  grid.style.cursor = buildCursor(baseColor);
  updateShadePalette(activeColorIndex);
});

document.querySelector('.palette__shades').addEventListener('click', (e) => {
  const swatch = e.target.closest('.palette__shade');
  if (!swatch) return;
  deactivateEraser();
  shadeSwatches.forEach(s => delete s.dataset.active);
  swatch.dataset.active = 'true';
  activeColor = getShadeColor(activeColorIndex, swatch.dataset.level);
  grid.style.cursor = buildCursor(baseColor);
});

const inCanvas = (clientX, clientY) =>
  clientX >= canvasRect.left && clientX <= canvasRect.right &&
  clientY >= canvasRect.top  && clientY <= canvasRect.bottom;

const paintCell = (clientX, clientY) => {
  if (!inCanvas(clientX, clientY)) return;

  const x = Math.floor(clientX / CELL) * CELL;
  const y = Math.floor(clientY / CELL) * CELL;
  const key = `${x},${y}`;

  if (painted.has(key) || pixelMap.has(key)) return;
  painted.add(key);

  const cell = document.createElement('div');
  cell.className = 'pixel';
  cell.style.cssText = `left:${x}px;top:${y}px;background:${activeColor}`;
  grid.appendChild(cell);
  history.push(cell);
  pixelMap.set(key, cell);

  if (history.length === 1) saveBtnEl.disabled = false;
};

const eraseCell = (clientX, clientY) => {
  if (!inCanvas(clientX, clientY)) return;

  const x = Math.floor(clientX / CELL) * CELL;
  const y = Math.floor(clientY / CELL) * CELL;
  const key = `${x},${y}`;

  const cell = pixelMap.get(key);
  if (!cell) return;

  cell.remove();
  pixelMap.delete(key);
  const idx = history.indexOf(cell);
  if (idx !== -1) history.splice(idx, 1);
  if (history.length === 0) saveBtnEl.disabled = true;
};

eraserBtn.addEventListener('click', () => {
  isErasing = !isErasing;
  eraserBtn.dataset.state = isErasing ? 'active' : '';
  grid.style.cursor = isErasing ? buildEraserCursor() : buildCursor(activeColor);
});

grid.addEventListener('mousedown', (e) => {
  isPainting = true;
  painted.clear();
  if (isErasing) eraseCell(e.clientX, e.clientY);
  else paintCell(e.clientX, e.clientY);
});

grid.addEventListener('mousemove', (e) => {
  const { clientX, clientY } = e;
  const inside = inCanvas(clientX, clientY);

  if (isErasing) {
    grid.style.cursor = inside ? buildEraserCursor() : '';
  } else {
    grid.style.cursor = inside ? buildCursor(activeColor) : '';
  }

  if (isPainting) {
    if (isErasing) eraseCell(clientX, clientY);
    else paintCell(clientX, clientY);
  }
});

document.addEventListener('mouseup', () => {
  isPainting = false;
  painted.clear();
});

saveBtnEl.addEventListener('click', () => {
  const size = Math.round(canvasRect.width);
  const scale = 2;
  const offscreen = document.createElement('canvas');
  offscreen.width = size * scale;
  offscreen.height = size * scale;
  const ctx = offscreen.getContext('2d');

  grid.querySelectorAll('.pixel').forEach(cell => {
    const x = parseFloat(cell.style.left) - canvasRect.left;
    const y = parseFloat(cell.style.top) - canvasRect.top;
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    ctx.fillStyle = cell.style.background;
    ctx.fillRect(x * scale, y * scale, CELL * scale, CELL * scale);
  });

  const a = document.createElement('a');
  a.download = 'drawing.png';
  a.href = offscreen.toDataURL('image/png');
  a.click();

  offscreen.toBlob(async (blob) => {
    const now = new Date();
    const filename = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}.png`;
    const { data, error } = await supabase.storage.from(BUCKET).upload(filename, blob, { contentType: 'image/png' });
    if (error) console.error('Supabase upload error:', error);
    else console.log('Uploaded:', data);
  }, 'image/png');
});

let uploadedImageUrl = null;

uploadBtn.addEventListener('click', () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl);
    uploadedImageUrl = URL.createObjectURL(file);
    canvasBox.style.setProperty('--canvas-bg-image', `url("${uploadedImageUrl}")`);
    canvasBox.dataset.visible = 'true';
    eyeToggleBtn.dataset.state = 'open';
  };
  input.click();
});

eyeToggleBtn.addEventListener('click', () => {
  const isVisible = canvasBox.dataset.visible === 'true';
  canvasBox.dataset.visible = isVisible ? 'false' : 'true';
  eyeToggleBtn.dataset.state = isVisible ? '' : 'open';
});

clearBtn.addEventListener('click', () => {
  history.forEach(cell => cell.remove());
  history.length = 0;
  pixelMap.clear();
  saveBtnEl.disabled = true;
});

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

document.addEventListener('keydown', (e) => {
  if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'z') {
    e.preventDefault();
    const last = history.pop();
    if (last) {
      const key = [...pixelMap.entries()].find(([, v]) => v === last)?.[0];
      if (key) pixelMap.delete(key);
      last.remove();
    }
    if (history.length === 0) saveBtnEl.disabled = true;
  }
});
