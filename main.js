const grid = document.getElementById('grid');
const CELL = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-size'));

const rootStyle = getComputedStyle(document.documentElement);
const getSwatchColor = (swatch) => {
  const index = [...document.querySelectorAll('.swatch')].indexOf(swatch) + 1;
  return rootStyle.getPropertyValue(`--color-${index}`).trim();
};

const history = [];
let isPainting = false;
const painted = new Set();

const swatches = document.querySelectorAll('.swatch');
let activeColor = getSwatchColor(document.querySelector('.swatch.active'));

document.getElementById('palette').addEventListener('click', (e) => {
  const swatch = e.target.closest('.swatch');
  if (!swatch) return;
  swatches.forEach(s => s.classList.remove('active'));
  swatch.classList.add('active');
  activeColor = getSwatchColor(swatch);
});

const canvasBox = document.getElementById('canvas-box');
const paintCursorEl = document.getElementById('paint-cursor');
const redoBtn = document.querySelector('.redo');

const isInsideCanvas = (clientX, clientY) => {
  const box = canvasBox.getBoundingClientRect();
  return clientX >= box.left && clientX <= box.right && clientY >= box.top && clientY <= box.bottom;
};

const isNearButton = (clientX, clientY, btn) => {
  const box = btn.getBoundingClientRect();
  const MARGIN = 24;
  return clientX >= box.left - MARGIN && clientX <= box.right + MARGIN &&
         clientY >= box.top - MARGIN && clientY <= box.bottom + MARGIN;
};

const isNearRedo = (clientX, clientY) =>
  isNearButton(clientX, clientY, redoBtn) ||
  isNearButton(clientX, clientY, document.querySelector('.eye-toggle'));

const paintCell = (clientX, clientY) => {
  const box = canvasBox.getBoundingClientRect();
  if (clientX < box.left || clientX > box.right || clientY < box.top || clientY > box.bottom) return;

  const rect = grid.getBoundingClientRect();
  const x = Math.floor((clientX - rect.left) / CELL) * CELL;
  const y = Math.floor((clientY - rect.top) / CELL) * CELL;
  const key = `${x},${y}`;

  if (painted.has(key)) return;
  painted.add(key);

  const cell = document.createElement('div');
  cell.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${CELL}px;height:${CELL}px;background:${activeColor};pointer-events:none;`;
  grid.appendChild(cell);
  history.push(cell);
};

grid.addEventListener('mousedown', (e) => {
  isPainting = true;
  painted.clear();
  paintCell(e.clientX, e.clientY);
});

grid.addEventListener('mousemove', (e) => {
  const inside = isInsideCanvas(e.clientX, e.clientY);
  const nearRedo = isNearRedo(e.clientX, e.clientY);
  grid.classList.toggle('on-canvas', inside);
  paintCursorEl.style.display = inside && !nearRedo ? 'block' : 'none';
  paintCursorEl.style.left = e.clientX + 'px';
  paintCursorEl.style.top = e.clientY + 'px';
  if (!isPainting) return;
  paintCell(e.clientX, e.clientY);
});

document.addEventListener('mouseup', () => {
  isPainting = false;
  painted.clear();
});

const eyeToggleBtn = document.querySelector('.eye-toggle');
eyeToggleBtn.addEventListener('click', () => {
  const hidden = canvasBox.classList.toggle('image-hidden');
  eyeToggleBtn.querySelector('i').className = hidden ? 'ph-bold ph-eye-slash' : 'ph-bold ph-eye';
});

redoBtn.addEventListener('click', () => {
  history.forEach(cell => cell.remove());
  history.length = 0;
});

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
    e.preventDefault();
    const last = history.pop();
    if (last) last.remove();
  }
});
