const grid = document.getElementById('grid');
const CELL = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-size'));

const getSwatchColor = (swatch) => getComputedStyle(swatch).backgroundColor;

let activeColor = getSwatchColor(document.querySelector('.swatch.active'));

const history = [];
let isPainting = false;
const painted = new Set();

const swatches = document.querySelectorAll('.swatch');
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

const isNearRedo = (clientX, clientY) => {
  const box = redoBtn.getBoundingClientRect();
  const MARGIN = 24;
  return clientX >= box.left - MARGIN && clientX <= box.right + MARGIN &&
         clientY >= box.top - MARGIN && clientY <= box.bottom + MARGIN;
};

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
