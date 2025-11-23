import { TILE_SIZE, DIRECTIONS, SPEEDS, TILE_TYPES, COLORS } from '../constants.js';

export class Pacman {
  constructor(startX, startY) {
    this.tileX = startX;
    this.tileY = startY;
    this.offsetX = 0;
    this.offsetY = 0;
    this.direction = DIRECTIONS.NONE;
    this.nextDirection = DIRECTIONS.NONE;
    this.speed = SPEEDS.PACMAN;
    this.state = 'alive'; // alive, dying, dead

    this.element = null; // SVG element
    this.mouthOpen = 0.35; // 0 to 1 (classic pizza shape ~45 degrees)
    this.mouthSpeed = 3; // Animation speed (was 10, too fast)
    this.mouthDir = 1; // Opening or closing
  }

  init(svgContainer) {
    // Create Pacman SVG Group
    this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.element.setAttribute('id', 'pacman');

    // Body (Yellow Circle) - We'll use a path for the mouth
    this.body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.body.setAttribute('fill', COLORS.PACMAN);
    this.element.appendChild(this.body);

    svgContainer.appendChild(this.element);
    this.updateVisuals();
  }

  setDirection(dir) {
    this.nextDirection = dir;
  }

  update(dt, grid) {
    if (this.state === 'dying') {
      this.mouthOpen += this.mouthSpeed * dt * 0.5;
      if (this.mouthOpen > 1) this.mouthOpen = 1; // Max open
      this.updateVisuals();
      return;
    }

    if (this.state !== 'alive') return;

    // 1. Try to change direction if at center of tile
    if (this.nextDirection !== DIRECTIONS.NONE && this.nextDirection !== this.direction) {
      if (this.canMove(this.nextDirection, grid)) {
        // Only turn if we are close to the center
        if (Math.abs(this.offsetX) < 0.1 && Math.abs(this.offsetY) < 0.1) {
          this.direction = this.nextDirection;
          this.offsetX = 0;
          this.offsetY = 0;
          this.nextDirection = DIRECTIONS.NONE;
        }
      }
    }

    // 2. Move in current direction
    if (this.direction !== DIRECTIONS.NONE) {
      const dist = this.speed * dt;

      if (this.canMove(this.direction, grid)) {
        if (this.direction === DIRECTIONS.LEFT) this.offsetX -= dist;
        if (this.direction === DIRECTIONS.RIGHT) this.offsetX += dist;
        if (this.direction === DIRECTIONS.UP) this.offsetY -= dist;
        if (this.direction === DIRECTIONS.DOWN) this.offsetY += dist;
      } else {
        // Hit wall, ease to center instead of instant snap
        // Use exponential ease-out for smooth deceleration
        const easeSpeed = 10; // Higher = faster ease
        this.offsetX += (0 - this.offsetX) * easeSpeed * dt;
        this.offsetY += (0 - this.offsetY) * easeSpeed * dt;

        // Snap to exactly 0 when very close to avoid floating point drift
        if (Math.abs(this.offsetX) < 0.01) this.offsetX = 0;
        if (Math.abs(this.offsetY) < 0.01) this.offsetY = 0;
      }

      // 3. Handle Tile Crossing
      if (this.offsetX > 0.5) {
        this.tileX++;
        this.offsetX -= 1;
      }
      if (this.offsetX < -0.5) {
        this.tileX--;
        this.offsetX += 1;
      }
      if (this.offsetY > 0.5) { this.tileY++; this.offsetY -= 1; }
      if (this.offsetY < -0.5) { this.tileY--; this.offsetY += 1; }

      // Tunnel Wrapping
      if (this.tileX < 0) {
        this.tileX = grid[0].length - 1;
      } else if (this.tileX >= grid[0].length) {
        this.tileX = 0;
      }
    }

    // 4. Animate Mouth
    if (this.direction !== DIRECTIONS.NONE) {
      this.mouthOpen += this.mouthSpeed * dt * this.mouthDir;

      if (this.mouthOpen >= 0.4) { // Classic pizza shape
        this.mouthOpen = 0.4;
        this.mouthDir = -1;
      }
      if (this.mouthOpen <= 0.05) { // Slightly open
        this.mouthOpen = 0.05;
        this.mouthDir = 1;
      }
    } else {
      // Close mouth if stopped
      this.mouthOpen = 0.05;
    }

    this.updateVisuals();
  }

  canMove(dir, grid) {
    let nextX = this.tileX;
    let nextY = this.tileY;

    if (dir === DIRECTIONS.LEFT) nextX--;
    if (dir === DIRECTIONS.RIGHT) nextX++;
    if (dir === DIRECTIONS.UP) nextY--;
    if (dir === DIRECTIONS.DOWN) nextY++;

    // Check bounds
    // Allow tunnel: Row 10 is tunnel
    if (nextY === 10 && (nextX < 0 || nextX >= grid[0].length)) {
      return true;
    }

    if (nextY < 0 || nextY >= grid.length || nextX < 0 || nextX >= grid[0].length) {
      return false; // Out of bounds (unless tunnel, handle later)
    }

    const tile = grid[nextY][nextX];
    return tile !== TILE_TYPES.WALL && tile !== TILE_TYPES.GHOST_HOUSE;
  }

  updateVisuals() {
    if (!this.element) return;

    // Position
    const px = (this.tileX + this.offsetX + 0.5) * TILE_SIZE;
    const py = (this.tileY + this.offsetY + 0.5) * TILE_SIZE;
    this.element.setAttribute('transform', `translate(${px}, ${py})`);

    // Rotation based on direction
    let rotation = 0;
    if (this.direction === DIRECTIONS.LEFT) rotation = 180;
    if (this.direction === DIRECTIONS.UP) rotation = 270;
    if (this.direction === DIRECTIONS.DOWN) rotation = 90;

    // Draw Pacman with mouth
    // A simple way is to draw a circle with a wedge cut out.
    // We can use SVG path arc command.
    // Radius = TILE_SIZE / 2 - 2 (padding)
    const r = TILE_SIZE / 2 - 2;
    // Calculate angles for the mouth
    // mouthOpen is 0 (closed) to 0.25 (normal open).
    // For death, we go up to 1 (full circle).

    let angle = 0;
    if (this.state === 'dying') {
      // Dying animation: mouth opens until it consumes the whole circle
      // Map 0..1 to 0..PI
      angle = this.mouthOpen * Math.PI;
    } else {
      // Normal animation: 0..0.25 maps to 0..PI/4
      angle = this.mouthOpen * Math.PI;
    }

    // Clamp angle to almost 2PI to avoid rendering issues if full
    if (angle > Math.PI - 0.01) angle = Math.PI - 0.01;

    const startAngle = angle;
    const endAngle = 2 * Math.PI - angle;

    const x1 = r * Math.cos(startAngle);
    const y1 = r * Math.sin(startAngle);
    const x2 = r * Math.cos(endAngle);
    const y2 = r * Math.sin(endAngle);

    // Path: Move to center, Line to start, Arc to end, Close
    // Large arc flag is 1 if angle > 180
    // Here angle is the "cut out" half-angle?
    // No, startAngle is angle from 0.
    // If angle is small (0.1), start is 0.1, end is 2PI - 0.1. Arc is large (almost full).
    // If angle is large (PI), start is PI, end is PI. Arc is 0.

    const arcSweep = endAngle - startAngle;
    const largeArc = arcSweep > Math.PI ? 1 : 0;

    // If dying and fully open (angle near PI), the arc becomes tiny.
    // Eventually we want it to disappear.

    let d = `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    if (this.state === 'dying' && this.mouthOpen >= 0.95) {
      d = ''; // Disappear
    }

    this.body.setAttribute('d', d);
    this.body.setAttribute('transform', `rotate(${rotation})`);
  }
}
