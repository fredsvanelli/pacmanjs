import { TILE_SIZE, DIRECTIONS, SPEEDS, TILE_TYPES, COLORS } from '../constants.js';

export class Ghost {
  constructor(type, startX, startY, color) {
    this.type = type; // 'blinky', 'pinky', 'inky', 'clyde'
    this.startX = startX;
    this.startY = startY;
    this.tileX = startX;
    this.tileY = startY;
    this.offsetX = 0;
    this.offsetY = 0;
    this.direction = DIRECTIONS.NONE; // Default start direction
    this.nextDirection = DIRECTIONS.NONE;
    this.speed = SPEEDS.GHOST;
    this.state = 'scatter'; // Start in scatter mode
    this.color = color;
    this.scatterTarget = null; // {x, y}

    this.element = null;
    this.body = null;
    this.eyes = null;
    this.pupils = null;

    this.frightenedTimeout = null;
  }

  init(svgContainer) {
    this.element = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.element.setAttribute('id', `ghost-${this.type}`);

    // Body (Top circle + Bottom wavy)
    this.body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    this.body.setAttribute('fill', this.color);
    this.element.appendChild(this.body);

    // Eyes Group
    this.eyes = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    // Left Eye
    const eyeL = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    eyeL.setAttribute('cx', -4);
    eyeL.setAttribute('cy', -2);
    eyeL.setAttribute('r', 3);
    eyeL.setAttribute('fill', COLORS.GHOST_EYES);
    this.eyes.appendChild(eyeL);

    // Right Eye
    const eyeR = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    eyeR.setAttribute('cx', 4);
    eyeR.setAttribute('cy', -2);
    eyeR.setAttribute('r', 3);
    eyeR.setAttribute('fill', COLORS.GHOST_EYES);
    this.eyes.appendChild(eyeR);

    // Pupils Group
    this.pupils = document.createElementNS('http://www.w3.org/2000/svg', 'g');

    const pupilL = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pupilL.setAttribute('cx', -4);
    pupilL.setAttribute('cy', -2);
    pupilL.setAttribute('r', 1.5);
    pupilL.setAttribute('fill', COLORS.GHOST_PUPIL);
    this.pupils.appendChild(pupilL);

    const pupilR = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pupilR.setAttribute('cx', 4);
    pupilR.setAttribute('cy', -2);
    pupilR.setAttribute('r', 1.5);
    pupilR.setAttribute('fill', COLORS.GHOST_PUPIL);
    this.pupils.appendChild(pupilR);

    this.eyes.appendChild(this.pupils);
    this.element.appendChild(this.eyes);

    svgContainer.appendChild(this.element);
    this.updateVisuals();
  }

  update(dt, grid, pacman) {
    let distToMove = this.speed * dt;

    // We handle movement in steps to ensure we hit the center exactly
    while (distToMove > 0) {
      // 1. Calculate distance to center of current tile
      // If moving LEFT, center is at offsetX = 0. We are at offsetX. Dist is offsetX (if > 0) or 1+offsetX (if < 0?? No).
      // Simpler: We are at offsetX. Center is 0.
      // If moving RIGHT (dir=1), we are moving towards +0.5? No, center is 0.
      // Let's stick to the -0.5 to 0.5 convention.

      let distToCenter = 0;
      if (this.direction === DIRECTIONS.LEFT) distToCenter = this.offsetX - 0; // We are at +0.1, center 0. Dist 0.1.
      if (this.direction === DIRECTIONS.RIGHT) distToCenter = 0 - this.offsetX; // We are at -0.1, center 0. Dist 0.1.
      if (this.direction === DIRECTIONS.UP) distToCenter = this.offsetY - 0;
      if (this.direction === DIRECTIONS.DOWN) distToCenter = 0 - this.offsetY;

      // If we are already past center (e.g. moving away from it), distToCenter is negative.
      // In that case, we are moving towards the edge (0.5).
      // But we only make decisions at the center.
      // So if we are moving AWAY from center, we are moving towards the NEXT tile's center.
      // Distance to next center is (0.5 - current) + 0.5 = 1.0 - current?

      // Let's simplify.
      // If we are "at center" (close enough), we decide.
      // If we are NOT at center, we move TOWARDS center (or away from it if we passed it).
      // Actually, the standard way is:
      // If we cross 0 during this move, we stop at 0, decide, then continue.

      let moved = false;

      // Check if we cross zero
      if (this.direction === DIRECTIONS.LEFT && this.offsetX > 0 && (this.offsetX - distToMove) <= 0) {
        distToMove -= this.offsetX; // Consume dist
        this.offsetX = 0;
        this.decideDirection(grid, pacman);
        moved = true;
      } else if (this.direction === DIRECTIONS.RIGHT && this.offsetX < 0 && (this.offsetX + distToMove) >= 0) {
        distToMove -= (-this.offsetX);
        this.offsetX = 0;
        this.decideDirection(grid, pacman);
        moved = true;
      } else if (this.direction === DIRECTIONS.UP && this.offsetY > 0 && (this.offsetY - distToMove) <= 0) {
        distToMove -= this.offsetY;
        this.offsetY = 0;
        this.decideDirection(grid, pacman);
        moved = true;
      } else if (this.direction === DIRECTIONS.DOWN && this.offsetY < 0 && (this.offsetY + distToMove) >= 0) {
        distToMove -= (-this.offsetY);
        this.offsetY = 0;
        this.decideDirection(grid, pacman);
        moved = true;
      }

      if (moved) {
        // We snapped to center and decided. Continue loop with remaining dist.
        if (this.direction === DIRECTIONS.NONE) break; // Stopped
        continue;
      }

      // If we didn't cross center (or are moving away from it), just move.
      // But wait, if we are moving away from center, we might cross the tile boundary.

      if (this.direction === DIRECTIONS.LEFT) this.offsetX -= distToMove;
      else if (this.direction === DIRECTIONS.RIGHT) this.offsetX += distToMove;
      else if (this.direction === DIRECTIONS.UP) this.offsetY -= distToMove;
      else if (this.direction === DIRECTIONS.DOWN) this.offsetY += distToMove;
      else {
        // Not moving, try to decide (start up)
        this.decideDirection(grid, pacman);
        if (this.direction === DIRECTIONS.NONE) break; // Still stuck
        continue; // Try moving with new dir
      }

      distToMove = 0; // Done
    }

    // Handle Tile Crossing (Wrap/Update Tile)
    if (this.offsetX > 0.5) { this.tileX++; this.offsetX -= 1; }
    if (this.offsetX < -0.5) { this.tileX--; this.offsetX += 1; }
    if (this.offsetY > 0.5) { this.tileY++; this.offsetY -= 1; }
    if (this.offsetY < -0.5) { this.tileY--; this.offsetY += 1; }

    // Tunnel Wrapping
    if (this.tileX < 0) this.tileX = grid[0].length - 1;
    else if (this.tileX >= grid[0].length) this.tileX = 0;

    // Check Eaten State Arrival (Revive)
    if (this.state === 'eaten' && this.tileX === 10 && this.tileY === 10) {
      this.reset();
    }

    // Check Exiting House Completion
    if (this.state === 'exiting_house' && this.tileX === 10 && this.tileY === 8) {
      this.state = 'scatter'; // Or global mode
      this.direction = DIRECTIONS.LEFT; // Force a direction to start
    }

    this.updateVisuals();
  }

  decideDirection(grid, pacman) {
    // Override for Exiting House: Hardcoded Path
    if (this.state === 'exiting_house') {
      // Target is (10, 8)
      if (this.tileX < 10) this.direction = DIRECTIONS.RIGHT;
      else if (this.tileX > 10) this.direction = DIRECTIONS.LEFT;
      else if (this.tileY > 8) this.direction = DIRECTIONS.UP;
      else this.direction = DIRECTIONS.LEFT; // Should be out by now
      return;
    }

    const validDirs = this.getValidDirections(grid);

    if (validDirs.length > 0) {
      // 2. General Logic
      let candidates = validDirs.filter(d => d !== this.getOppositeDirection(this.direction));
      if (candidates.length === 0) candidates = validDirs; // Dead end

      if (this.state === 'frightened') {
        this.direction = candidates[Math.floor(Math.random() * candidates.length)];
      } else {
        let target = { x: pacman.tileX, y: pacman.tileY };
        // Target center of house to revive
        if (this.state === 'eaten') target = { x: 10, y: 10 };

        let bestDir = candidates[0];
        let minDist = Infinity;

        candidates.forEach(dir => {
          let nx = this.tileX;
          let ny = this.tileY;
          if (dir === DIRECTIONS.LEFT) nx--;
          if (dir === DIRECTIONS.RIGHT) nx++;
          if (dir === DIRECTIONS.UP) ny--;
          if (dir === DIRECTIONS.DOWN) ny++;

          const dist = Math.sqrt((nx - target.x) ** 2 + (ny - target.y) ** 2);
          if (dist < minDist) {
            minDist = dist;
            bestDir = dir;
          }
        });
        this.direction = bestDir;
      }
    } else {
      this.direction = DIRECTIONS.NONE;
    }
  }

  getValidDirections(grid) {
    const dirs = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
    return dirs.filter(d => this.canMove(d, grid));
  }

  getChaseTarget(pacman, grid, blinky) {
    if (this.type === 'blinky') {
      return { x: pacman.tileX, y: pacman.tileY };
    }

    if (this.type === 'pinky') {
      // 4 tiles ahead
      let tx = pacman.tileX;
      let ty = pacman.tileY;
      const dir = pacman.direction;
      if (dir === DIRECTIONS.LEFT) tx -= 4;
      if (dir === DIRECTIONS.RIGHT) tx += 4;
      if (dir === DIRECTIONS.UP) ty -= 4;
      if (dir === DIRECTIONS.DOWN) ty += 4;
      return { x: tx, y: ty };
    }

    if (this.type === 'inky') {
      // Vector calculation using Blinky
      if (!blinky) return { x: pacman.tileX, y: pacman.tileY }; // Fallback

      // 2 tiles ahead of Pacman
      let tx = pacman.tileX;
      let ty = pacman.tileY;
      const dir = pacman.direction;
      if (dir === DIRECTIONS.LEFT) tx -= 2;
      if (dir === DIRECTIONS.RIGHT) tx += 2;
      if (dir === DIRECTIONS.UP) ty -= 2;
      if (dir === DIRECTIONS.DOWN) ty += 2;

      // Vector from Blinky to this point
      const vx = tx - blinky.tileX;
      const vy = ty - blinky.tileY;

      // Double the vector
      return { x: blinky.tileX + vx * 2, y: blinky.tileY + vy * 2 };
    }

    if (this.type === 'clyde') {
      // Shy: Chase if far, Scatter if close (8 tiles)
      const dist = Math.sqrt(Math.pow(this.tileX - pacman.tileX, 2) + Math.pow(this.tileY - pacman.tileY, 2));
      if (dist > 8) {
        return { x: pacman.tileX, y: pacman.tileY };
      } else {
        return this.scatterTarget || { x: 0, y: 0 };
      }
    }

    return { x: pacman.tileX, y: pacman.tileY };
  }

  isIntersection(grid) {
    // Check if there are more than 2 exits (including the one we came from)
    let exits = 0;
    if (this.canMove(DIRECTIONS.UP, grid)) exits++;
    if (this.canMove(DIRECTIONS.DOWN, grid)) exits++;
    if (this.canMove(DIRECTIONS.LEFT, grid)) exits++;
    if (this.canMove(DIRECTIONS.RIGHT, grid)) exits++;
    return exits > 2;
  }

  getOppositeDirection(dir) {
    if (dir === DIRECTIONS.UP) return DIRECTIONS.DOWN;
    if (dir === DIRECTIONS.DOWN) return DIRECTIONS.UP;
    if (dir === DIRECTIONS.LEFT) return DIRECTIONS.RIGHT;
    if (dir === DIRECTIONS.RIGHT) return DIRECTIONS.LEFT;
    return DIRECTIONS.NONE;
  }

  getPossibleDirections(grid) {
    const dirs = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
    return dirs.filter(d => this.canMove(d, grid) && d !== this.getOppositeDirection(this.direction));
  }

  setFrightened(grid) {
    if (this.state !== 'eaten' && this.state !== 'inside_house') {
      this.state = 'frightened';
      this.body.setAttribute('fill', COLORS.GHOST_FRIGHTENED);
      this.speed = SPEEDS.GHOST_FRIGHTENED;

      // Reverse direction immediately (only if not already frightened to avoid double reverse?)
      // Actually, standard Pac-Man reverses on every power pellet.
      if (this.canMove(this.getOppositeDirection(this.direction), grid)) {
        this.direction = this.getOppositeDirection(this.direction);
      }

      // Clear existing timeout if any (Reset Timer)
      if (this.frightenedTimeout) {
        clearTimeout(this.frightenedTimeout);
      }

      // Reset after 7 seconds
      this.frightenedTimeout = setTimeout(() => {
        if (this.state === 'frightened') {
          this.state = 'scatter'; // Or whatever global mode is
          this.body.setAttribute('fill', this.color);
          this.speed = SPEEDS.GHOST;
        }
        this.frightenedTimeout = null;
      }, 7000);
    }
  }

  setEaten() {
    this.state = 'eaten';
    this.body.setAttribute('fill', 'none'); // Hide body
    this.speed = SPEEDS.GHOST_EATEN;
  }

  reset() {
    this.tileX = this.startX;
    this.tileY = this.startY;
    this.offsetX = 0;
    this.offsetY = 0;
    this.direction = DIRECTIONS.NONE; // Start with no direction so update loop picks one
    this.state = this.startY === 10 ? 'exiting_house' : 'scatter';
    this.speed = SPEEDS.GHOST;
    this.body.setAttribute('fill', this.color);
    this.updateVisuals();
  }

  canMove(dir, grid) {
    let nextX = this.tileX;
    let nextY = this.tileY;

    if (dir === DIRECTIONS.LEFT) nextX--;
    if (dir === DIRECTIONS.RIGHT) nextX++;
    if (dir === DIRECTIONS.UP) nextY--;
    if (dir === DIRECTIONS.DOWN) nextY++;

    // Allow tunnel: Row 10 is tunnel
    if (nextY === 10 && (nextX < 0 || nextX >= grid[0].length)) {
      return true;
    }

    if (nextY < 0 || nextY >= grid.length || nextX < 0 || nextX >= grid[0].length) return false;

    const tile = grid[nextY][nextX];

    // Special case: Ghost House Door (usually a wall or special tile)
    // If exiting_house or eaten, we can pass through the door (Tile 10,8 is usually the spot above door, door is at 10,9?)
    // Let's check if the tile is a wall.

    if (this.state === 'exiting_house' || this.state === 'eaten') {
      // Allow moving through walls if it gets us closer to target? 
      // Or specifically the door tile.
      // Let's assume the door is at (10, 9) and (11, 9) or similar.
      // If we are at y=10 and want to go to y=8, we must pass y=9.
      if (tile === TILE_TYPES.WALL) {
        // Check if this is the door location. 
        // In our layout, the door is likely around x=10, y=9.
        if (nextY === 9 && (nextX >= 9 && nextX <= 11)) return true;
      }
    }

    // Explicitly allow passing through special tiles
    if (tile === TILE_TYPES.GHOST_HOUSE ||
      tile === TILE_TYPES.GHOST_START_RED ||
      tile === TILE_TYPES.GHOST_START_PINK ||
      tile === TILE_TYPES.GHOST_START_BLUE ||
      tile === TILE_TYPES.GHOST_START_ORANGE ||
      tile === TILE_TYPES.PACMAN_START ||
      tile === TILE_TYPES.EMPTY ||
      tile === TILE_TYPES.PELLET ||
      tile === TILE_TYPES.POWER_PELLET) {
      return true;
    }

    return tile !== TILE_TYPES.WALL;
  }

  updateVisuals() {
    if (!this.element) return;

    const px = (this.tileX + this.offsetX + 0.5) * TILE_SIZE;
    const py = (this.tileY + this.offsetY + 0.5) * TILE_SIZE;
    this.element.setAttribute('transform', `translate(${px}, ${py})`);

    // Draw Body
    // Semi-circle top, straight sides, wavy bottom
    const r = TILE_SIZE / 2 - 2;
    const bottom = r;

    // Wavy bottom: 3 bumps
    // Width is 2*r. Each bump is 2*r / 3 wide.
    const w = 2 * r;
    const bumpW = w / 3;

    let d = `M ${-r} ${bottom}`; // Start bottom left
    d += ` L ${-r} 0`; // Line to top left start of arc
    d += ` A ${r} ${r} 0 0 1 ${r} 0`; // Top arc
    d += ` L ${r} ${bottom}`; // Line to bottom right

    // Bottom waves (simplified)
    d += ` L ${r - bumpW / 2} ${bottom - 2}`;
    d += ` L ${r - bumpW} ${bottom}`;
    d += ` L ${r - 1.5 * bumpW} ${bottom - 2}`;
    d += ` L ${r - 2 * bumpW} ${bottom}`;
    d += ` L ${r - 2.5 * bumpW} ${bottom - 2}`;
    d += ` L ${-r} ${bottom}`;
    d += ` Z`;

    this.body.setAttribute('d', d);

    // Update Pupils
    let pxOff = 0, pyOff = 0;
    if (this.direction === DIRECTIONS.LEFT) pxOff = -2;
    if (this.direction === DIRECTIONS.RIGHT) pxOff = 2;
    if (this.direction === DIRECTIONS.UP) pyOff = -2;
    if (this.direction === DIRECTIONS.DOWN) pyOff = 2;

    this.pupils.setAttribute('transform', `translate(${pxOff}, ${pyOff})`);
  }
}
