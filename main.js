import { createClient } from '@supabase/supabase-js';
import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights();

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
const BUCKET = import.meta.env.VITE_SUPABASE_BUCKET;

const grid = document.getElementById('grid');
const canvasBox = document.getElementById('canvas-box');
const clearBtn = document.querySelector('.redo');
const eyeToggleBtn = document.querySelector('.eye-toggle');
const saveBtnEl = document.querySelector('.save-btn');
const uploadBtn = document.querySelector('.upload-btn');
const swatches = document.querySelectorAll('.swatch');

const CELL = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-size'), 10);
const rootStyle = getComputedStyle(document.documentElement);

const getSwatchColor = (swatch) => {
  const index = [...swatches].indexOf(swatch) + 1;
  return rootStyle.getPropertyValue(`--color-${index}`).trim();
};

const BUCKET_PATH = 'M234.53,139.07a8,8,0,0,0,3.13-13.24L122.17,10.34a8,8,0,0,0-11.31,0L70.25,51,45.65,26.34A8,8,0,0,0,34.34,37.66l24.6,24.6L15,106.17a24,24,0,0,0,0,33.94L99.89,225a24,24,0,0,0,33.94,0l78.49-78.49Zm-32.19-5.24-79.83,79.83a8,8,0,0,1-11.31,0L26.34,128.8a8,8,0,0,1,0-11.31L70.25,73.57l29.12,29.12a28,28,0,1,0,11.31-11.32L81.57,62.26l35-34.95L217.19,128l-11.72,3.9A8.09,8.09,0,0,0,202.34,133.83Zm-86.83-26.31,0,0a13.26,13.26,0,1,1-.05.06S115.51,107.53,115.51,107.52Z';
const DROP_PATH = 'M238.66,163.52a8,8,0,0,0-13.32,0C223.57,166.23,208,190.09,208,208a24,24,0,0,0,48,0C256,190.09,240.43,166.23,238.66,163.56Z';

const buildCursor = (color) => {
  const fill = color.replace('#', '%23');
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256' width='18' height='18'%3E%3Cg transform='translate(256,0) scale(-1,1)'%3E%3Cpath fill='%23222222' d='${BUCKET_PATH}'/%3E%3Cg transform='translate(232,186) scale(1.5) translate(-232,-186)'%3E%3Cpath fill='${fill}' d='${DROP_PATH}'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") 2 20, crosshair`;
};

let canvasRect = canvasBox.getBoundingClientRect();

window.addEventListener('resize', () => {
  canvasRect = canvasBox.getBoundingClientRect();
});

const history = [];
let isPainting = false;
const painted = new Set();
let baseColor = getSwatchColor(document.querySelector('.swatch.active'));
let activeColor = baseColor;

const opacitySwatches = document.querySelectorAll('[class^="swatch-"]');

const shadeColor = (hex, factor) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if (factor >= 0) {
    return `rgb(${Math.round(r + (255 - r) * factor)},${Math.round(g + (255 - g) * factor)},${Math.round(b + (255 - b) * factor)})`;
  } else {
    const d = 1 + factor;
    return `rgb(${Math.round(r * d)},${Math.round(g * d)},${Math.round(b * d)})`;
  }
};

// positive = lighten (mix white), negative = darken (mix black)
// order: lightest → lighter → base → darker → darkest
const SHADES = [-0.6, -0.35, 0, 0.2, 0.45];

const updateOpacityPalette = (hex) => {
  opacitySwatches.forEach((swatch, i) => {
    swatch.style.setProperty('--opacity-color', shadeColor(hex, SHADES[i]));
  });
};

const BASE_SHADE_INDEX = SHADES.indexOf(0);

updateOpacityPalette(baseColor);
opacitySwatches[BASE_SHADE_INDEX].classList.add('active');

document.getElementById('palette').addEventListener('click', (e) => {
  const swatch = e.target.closest('.swatch');
  if (!swatch) return;
  swatches.forEach(s => s.classList.remove('active'));
  swatch.classList.add('active');
  opacitySwatches.forEach(s => s.classList.remove('active'));
  opacitySwatches[BASE_SHADE_INDEX].classList.add('active');
  baseColor = getSwatchColor(swatch);
  activeColor = baseColor;
  grid.style.cursor = buildCursor(baseColor);
  updateOpacityPalette(baseColor);
});

document.getElementById('opacity-palette').addEventListener('click', (e) => {
  const swatch = e.target.closest('[class^="swatch-"]');
  if (!swatch) return;
  opacitySwatches.forEach(s => s.classList.remove('active'));
  swatch.classList.add('active');
  const i = [...opacitySwatches].indexOf(swatch);
  activeColor = shadeColor(baseColor, SHADES[i]);
  grid.style.cursor = buildCursor(baseColor);
});

const paintCell = (clientX, clientY) => {
  if (clientX < canvasRect.left || clientX > canvasRect.right ||
      clientY < canvasRect.top  || clientY > canvasRect.bottom) return;

  const x = Math.floor(clientX / CELL) * CELL;
  const y = Math.floor(clientY / CELL) * CELL;
  const key = `${x},${y}`;

  if (painted.has(key)) return;
  painted.add(key);

  const cell = document.createElement('div');
  cell.className = 'pixel';
  cell.style.cssText = `left:${x}px;top:${y}px;background:${activeColor}`;
  grid.appendChild(cell);
  history.push(cell);

  if (history.length === 1) saveBtnEl.disabled = false;
};

grid.addEventListener('mousedown', (e) => {
  isPainting = true;
  painted.clear();
  paintCell(e.clientX, e.clientY);
});

grid.addEventListener('mousemove', (e) => {
  const { clientX, clientY } = e;
  const inside = clientX >= canvasRect.left && clientX <= canvasRect.right &&
                 clientY >= canvasRect.top  && clientY <= canvasRect.bottom;

  grid.style.cursor = inside ? buildCursor(activeColor) : '';
  if (isPainting) paintCell(clientX, clientY);
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
    canvasBox.classList.remove('image-hidden');
    eyeToggleBtn.classList.add('eye-open');
  };
  input.click();
});

eyeToggleBtn.addEventListener('click', () => {
  const hidden = canvasBox.classList.toggle('image-hidden');
  eyeToggleBtn.classList.toggle('eye-open', !hidden);
});

clearBtn.addEventListener('click', () => {
  history.forEach(cell => cell.remove());
  history.length = 0;
  saveBtnEl.disabled = true;
});

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

document.addEventListener('keydown', (e) => {
  if ((isMac ? e.metaKey : e.ctrlKey) && e.key === 'z') {
    e.preventDefault();
    const last = history.pop();
    if (last) last.remove();
    if (history.length === 0) saveBtnEl.disabled = true;
  }
});
