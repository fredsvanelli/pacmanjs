import { TILE_SIZE, TILE_TYPES, COLORS } from './constants.js';

export class Renderer {
  constructor() {
    this.svg = document.getElementById('game-board');
    this.scoreEl = document.getElementById('score-display');
    this.highScoreEl = document.getElementById('high-score-display');
    this.overlays = {
      ready: document.getElementById('overlay-ready'),
      paused: document.getElementById('overlay-paused'),
      gameover: document.getElementById('overlay-gameover'),
      levelComplete: document.getElementById('overlay-level-complete')
    };
  }

  initBoard(grid) {
    const rows = grid.length;
    const cols = grid[0].length;

    this.svg.setAttribute('width', cols * TILE_SIZE);
    this.svg.setAttribute('height', rows * TILE_SIZE);
    this.svg.setAttribute('viewBox', `0 0 ${cols * TILE_SIZE} ${rows * TILE_SIZE}`);
    this.svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    this.svg.innerHTML = ''; // Clear existing

    // Render static elements (walls, pellets)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const type = grid[y][x];
        if (type === TILE_TYPES.WALL) {
          this.createWall(x, y);
        } else if (type === TILE_TYPES.PELLET) {
          this.createPellet(x, y);
        } else if (type === TILE_TYPES.POWER_PELLET) {
          this.createPowerPellet(x, y);
        }
        // Ghost house door could be a special wall
        if (type === TILE_TYPES.GHOST_HOUSE) {
          // Optional: render door
        }
      }
    }
  }

  createWall(x, y) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x * TILE_SIZE);
    rect.setAttribute('y', y * TILE_SIZE);
    rect.setAttribute('width', TILE_SIZE);
    rect.setAttribute('height', TILE_SIZE);
    rect.setAttribute('fill', COLORS.WALL);
    // Simple stroke for grid look
    rect.setAttribute('stroke', '#000');
    rect.setAttribute('stroke-width', '1');
    this.svg.appendChild(rect);
  }

  createPellet(x, y) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const cx = (x + 0.5) * TILE_SIZE;
    const cy = (y + 0.5) * TILE_SIZE;
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', 3);
    circle.setAttribute('fill', COLORS.PELLET);
    circle.setAttribute('id', `pellet-${x}-${y}`);
    this.svg.appendChild(circle);
  }

  createPowerPellet(x, y) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const cx = (x + 0.5) * TILE_SIZE;
    const cy = (y + 0.5) * TILE_SIZE;
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', 7);
    circle.setAttribute('fill', COLORS.POWER_PELLET);
    circle.setAttribute('id', `power-${x}-${y}`);

    // Pulse animation
    const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    animate.setAttribute('attributeName', 'r');
    animate.setAttribute('values', '7;9;7');
    animate.setAttribute('dur', '0.5s');
    animate.setAttribute('repeatCount', 'indefinite');
    circle.appendChild(animate);

    this.svg.appendChild(circle);
  }

  updateScore(score) {
    this.scoreEl.textContent = score;
  }

  removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  updateHighScore(score) {
    this.highScoreEl.textContent = score;
  }

  updateLives(lives) {
    const container = document.getElementById('lives-display');
    container.innerHTML = '';
    for (let i = 0; i < lives; i++) {
      // Simple Pacman Icon SVG
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '20');
      svg.setAttribute('height', '20');
      svg.setAttribute('viewBox', '0 0 24 24');

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '12');
      circle.setAttribute('cy', '12');
      circle.setAttribute('r', '10');
      circle.setAttribute('fill', '#FFFF00');

      // Mouth wedge (simple path)
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M 12 12 L 22 12 L 22 22 Z'); // Rough wedge
      path.setAttribute('fill', '#000'); // Background color to "cut"

      svg.appendChild(circle);
      // svg.appendChild(path); // Actually, better to draw the pacman shape directly like in entity

      // Let's just use a yellow circle for now for simplicity

      container.appendChild(svg);
    }
  }

  updateOverlay(state) {
    // Hide all first
    Object.values(this.overlays).forEach(el => el.classList.add('hidden'));

    if (state === 'READY') this.overlays.ready.classList.remove('hidden');
    if (state === 'PAUSED') this.overlays.paused.classList.remove('hidden');
    if (state === 'GAME_OVER') this.overlays.gameover.classList.remove('hidden');
    if (state === 'LEVEL_COMPLETE') this.overlays.levelComplete.classList.remove('hidden');
  }
}
