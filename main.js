const grid = document.getElementById('grid');
const canvasBox = document.getElementById('canvas-box');
const paintCursorEl = document.getElementById('paint-cursor');
const redoBtn = document.querySelector('.redo');
const eyeToggleBtn = document.querySelector('.eye-toggle');
const saveBtnEl = document.querySelector('.save-btn');
const uploadBtn = document.querySelector('.upload-btn');
const swatches = document.querySelectorAll('.swatch');

const CELL = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-size'));
const rootStyle = getComputedStyle(document.documentElement);

const getSwatchColor = (swatch) => {
  const index = [...swatches].indexOf(swatch) + 1;
  return rootStyle.getPropertyValue(`--color-${index}`).trim();
};

// Cache rects — these elements never move during a session
let canvasRect = canvasBox.getBoundingClientRect();
let btnRects = [redoBtn, eyeToggleBtn, saveBtnEl].map(b => b.getBoundingClientRect());

window.addEventListener('resize', () => {
  canvasRect = canvasBox.getBoundingClientRect();
  btnRects = [redoBtn, eyeToggleBtn, saveBtnEl].map(b => b.getBoundingClientRect());
});

const history = [];
let isPainting = false;
const painted = new Set();
let activeColor = getSwatchColor(document.querySelector('.swatch.active'));

document.getElementById('palette').addEventListener('click', (e) => {
  const swatch = e.target.closest('.swatch');
  if (!swatch) return;
  swatches.forEach(s => s.classList.remove('active'));
  swatch.classList.add('active');
  activeColor = getSwatchColor(swatch);
});

const MARGIN = 24;
const isNearAnyBtn = (x, y) => btnRects.some(r =>
  x >= r.left - MARGIN && x <= r.right + MARGIN &&
  y >= r.top - MARGIN && y <= r.bottom + MARGIN
);

const paintCell = (clientX, clientY) => {
  if (clientX < canvasRect.left || clientX > canvasRect.right ||
      clientY < canvasRect.top  || clientY > canvasRect.bottom) return;

  const x = canvasRect.left + Math.floor((clientX - canvasRect.left) / CELL) * CELL;
  const y = canvasRect.top  + Math.floor((clientY - canvasRect.top)  / CELL) * CELL;
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
  const nearBtn = isNearAnyBtn(clientX, clientY);

  grid.classList.toggle('on-canvas', inside);
  paintCursorEl.style.transform = `translate(${clientX - 4}px, ${clientY - 20}px) scaleX(-1)`;
  paintCursorEl.classList.toggle('visible', inside && !nearBtn);

  if (isPainting) paintCell(clientX, clientY);
});

document.addEventListener('mouseup', () => {
  isPainting = false;
  painted.clear();
});

saveBtnEl.disabled = true;

saveBtnEl.addEventListener('click', () => {
  if (history.length === 0) return;
  const size = Math.round(canvasRect.width);
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext('2d');

  grid.querySelectorAll('.pixel').forEach(cell => {
    const x = parseFloat(cell.style.left) - canvasRect.left;
    const y = parseFloat(cell.style.top) - canvasRect.top;
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    ctx.fillStyle = cell.style.background;
    ctx.fillRect(x, y, CELL, CELL);
  });

  const a = document.createElement('a');
  a.download = 'drawing.png';
  a.href = offscreen.toDataURL('image/png');
  a.click();
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
    eyeToggleBtn.querySelector('i').className = 'ph-bold ph-eye';
  };
  input.click();
});

eyeToggleBtn.addEventListener('click', () => {
  const hidden = canvasBox.classList.toggle('image-hidden');
  eyeToggleBtn.querySelector('i').className = hidden ? 'ph-bold ph-eye-slash' : 'ph-bold ph-eye';
});

redoBtn.addEventListener('click', () => {
  history.forEach(cell => cell.remove());
  history.length = 0;
  saveBtnEl.disabled = true;
});

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
    e.preventDefault();
    const last = history.pop();
    if (last) last.remove();
    if (history.length === 0) saveBtnEl.disabled = true;
  }
});
