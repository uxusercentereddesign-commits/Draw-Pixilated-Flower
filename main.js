const grid = document.getElementById('grid');
const CELL = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-size'));

const getSwatchColor = (swatch) => getComputedStyle(swatch).backgroundColor;

let activeColor = getSwatchColor(document.querySelector('.swatch'));

const history = [];
let isPainting = false;
const painted = new Set();

// const swatches = document.querySelectorAll('.swatch');
// swatches.forEach(swatch => {
//   swatch.addEventListener('click', () => {
//     swatches.forEach(s => s.classList.remove('active'));
//     swatch.classList.add('active');
//     activeColor = getSwatchColor(swatch);
//   });
// });

const swatches = document.querySelectorAll('.swatch');
document.getElementById('palette').addEventListener('click', (e) => {
  const swatch = e.target.closest('.swatch');
  if (!swatch) return;
  swatches.forEach(s => s.classList.remove('active'));
  swatch.classList.add('active');
  activeColor = getSwatchColor(swatch);
});

const paintCell = (clientX, clientY) => {
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
  if (!isPainting) return;
  paintCell(e.clientX, e.clientY);
});

document.addEventListener('mouseup', () => {
  isPainting = false;
  painted.clear();
});

document.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === 'z') {
    e.preventDefault();
    const last = history.pop();
    if (last) last.remove();
  }
});
