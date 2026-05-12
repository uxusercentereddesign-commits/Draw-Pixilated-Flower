const grid = document.getElementById('grid');
const CELL = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-size'));
const COLOR = getComputedStyle(document.documentElement).getPropertyValue('--box-color').trim();

const history = [];

grid.addEventListener('click', (e) => {
  const rect = grid.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / CELL) * CELL;
  const y = Math.floor((e.clientY - rect.top) / CELL) * CELL;

  const cell = document.createElement('div');
  cell.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${CELL}px;height:${CELL}px;background:${COLOR};pointer-events:none;`;
  grid.appendChild(cell);
  history.push(cell);
});

document.addEventListener('keydown', (e) => {
  if (e.metaKey && e.key === 'z') {
    e.preventDefault();
    const last = history.pop();
    if (last) last.remove();
  }
});
