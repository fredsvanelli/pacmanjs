import { GAME_STATES, LEVEL_1_LAYOUT, TILE_SIZE, TILE_TYPES, DIRECTIONS } from './constants.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { Pacman } from './entities/pacman.js';
import { Ghost } from './entities/ghost.js';
import { COLORS } from './constants.js';

export class Game {
  constructor() {
    this.state = GAME_STATES.INIT;
    this.lastTime = 0;
    this.renderer = new Renderer();
    this.input = new InputHandler();

    // Game Data
    this.grid = [];
    this.score = 0;
    this.highScore = 0;
    this.lives = 3;
    this.level = 1;

    // Mode Scheduler
    // Simple schedule: Scatter 7s, Chase 20s, Scatter 7s, Chase 20s, Scatter 5s, Chase forever
    this.modeSchedule = [
      { mode: 'scatter', duration: 7 },
      { mode: 'chase', duration: 20 },
      { mode: 'scatter', duration: 7 },
      { mode: 'chase', duration: 20 },
      { mode: 'scatter', duration: 5 },
      { mode: 'chase', duration: 999999 }
    ];
    this.globalMode = this.modeSchedule[0].mode; // Initialize correctly
    this.modeTimer = 0;
    this.modeIndex = 0;

    window.addEventListener('game-input', (e) => this.handleInput(e.detail));
  }

  start() {
    this.init();
    requestAnimationFrame((t) => {
      this.lastTime = t;
      this.gameLoop(t);
    });
  }

  init() {
    console.log('Initializing Game...');
    this.loadHighScore();
    this.setupLevel();
    this.setState(GAME_STATES.READY);

    // Reset Mode
    this.modeIndex = 0;
    this.modeTimer = 0;
    this.globalMode = this.modeSchedule[0].mode;
  }

  setupLevel() {
    // Deep copy the grid layout
    this.grid = LEVEL_1_LAYOUT.map(row => [...row]);
    this.renderer.initBoard(this.grid);

    // Find Pacman Start
    let startX = 1, startY = 1;
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[0].length; x++) {
        if (this.grid[y][x] === TILE_TYPES.PACMAN_START) {
          startX = x;
          startY = y;
        }
      }
    }

    this.pacman = new Pacman(startX, startY);
    this.pacman.init(this.renderer.svg);

    // Initialize Ghosts
    this.ghosts = [];
    const ghostSpecs = [
      { type: 'blinky', tile: TILE_TYPES.GHOST_START_RED, color: COLORS.GHOST_RED, scatter: { x: this.grid[0].length - 2, y: 1 } }, // Top Right
      { type: 'pinky', tile: TILE_TYPES.GHOST_START_PINK, color: COLORS.GHOST_PINK, scatter: { x: 1, y: 1 } }, // Top Left
      { type: 'inky', tile: TILE_TYPES.GHOST_START_BLUE, color: COLORS.GHOST_BLUE, scatter: { x: this.grid[0].length - 2, y: this.grid.length - 2 } }, // Bottom Right
      { type: 'clyde', tile: TILE_TYPES.GHOST_START_ORANGE, color: COLORS.GHOST_ORANGE, scatter: { x: 1, y: this.grid.length - 2 } } // Bottom Left
    ];

    ghostSpecs.forEach(spec => {
      let gx = 10, gy = 8; // Default fallback
      for (let y = 0; y < this.grid.length; y++) {
        for (let x = 0; x < this.grid[0].length; x++) {
          if (this.grid[y][x] === spec.tile) {
            gx = x;
            gy = y;
          }
        }
      }
      const ghost = new Ghost(spec.type, gx, gy, spec.color);
      ghost.scatterTarget = spec.scatter;

      // If ghost starts inside house (Row 10), set state to exiting_house
      if (gy === 10) {
        ghost.state = 'exiting_house';
      }

      ghost.init(this.renderer.svg);
      this.ghosts.push(ghost);
    });
  }

  loadHighScore() {
    const saved = localStorage.getItem('pacman_high_score');
    if (saved) {
      this.highScore = parseInt(saved, 10);
      this.renderer.updateHighScore(this.highScore);
    }
    this.renderer.updateLives(this.lives);
  }

  setState(newState) {
    this.state = newState;
    this.renderer.updateOverlay(this.state);

    if (newState === GAME_STATES.READY) {
      setTimeout(() => {
        if (this.state === GAME_STATES.READY) {
          this.setState(GAME_STATES.PLAYING);
        }
      }, 2500);
    }
  }

  update(dt) {
    if (this.state !== GAME_STATES.PLAYING) return;

    // Update Mode Timer
    this.modeTimer += dt;
    const currentPhase = this.modeSchedule[this.modeIndex];

    if (currentPhase && this.modeTimer > currentPhase.duration) {
      this.modeIndex++;
      this.modeTimer = 0;
      if (this.modeIndex < this.modeSchedule.length) {
        this.globalMode = this.modeSchedule[this.modeIndex].mode;
        console.log('Switching to mode:', this.globalMode);

        // Reverse direction on mode switch (classic behavior)
        this.ghosts.forEach(g => {
          if (g.state === 'scatter' || g.state === 'chase') {
            g.direction = g.getOppositeDirection(g.direction);
          }
        });
      }
    }

    // Sync Ghosts with Global Mode
    this.ghosts.forEach(g => {
      if (g.state !== 'frightened' && g.state !== 'eaten' && g.state !== 'inside_house' && g.state !== 'exiting_house') {
        g.state = this.globalMode;
      }
    });

    // Handle Input
    const dir = this.input.getDirection();
    if (dir !== DIRECTIONS.NONE) {
      this.pacman.setDirection(dir);
    }

    // Always update entities
    this.pacman.update(dt, this.grid);

    // Update Ghosts
    // console.log('Updating Ghosts...');
    const blinky = this.ghosts.find(g => g.type === 'blinky');
    this.ghosts.forEach(ghost => {
      ghost.blinkyRef = blinky; // Hacky way to pass blinky ref for Inky
      ghost.update(dt, this.grid, this.pacman);
    });

    // Check Pellet Collision
    this.checkPelletCollision();

    // Check Ghost Collision
    this.checkGhostCollision();
  }

  checkPelletCollision() {
    const x = this.pacman.tileX;
    const y = this.pacman.tileY;
    const tile = this.grid[y][x];

    if (tile === TILE_TYPES.PELLET) {
      this.grid[y][x] = TILE_TYPES.EMPTY;
      this.renderer.removeElement(`pellet-${x}-${y}`);
      this.score += 10;
      this.renderer.updateScore(this.score);
    } else if (tile === TILE_TYPES.POWER_PELLET) {
      this.grid[y][x] = TILE_TYPES.EMPTY;
      this.renderer.removeElement(`power-${x}-${y}`);
      this.score += 50;
      this.renderer.updateScore(this.score);
      this.triggerFrightenedMode();
    }

    this.checkLevelComplete();
  }

  checkLevelComplete() {
    // Check if any pellets remain
    let pelletsRemain = false;
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[0].length; x++) {
        if (this.grid[y][x] === TILE_TYPES.PELLET || this.grid[y][x] === TILE_TYPES.POWER_PELLET) {
          pelletsRemain = true;
          break;
        }
      }
      if (pelletsRemain) break;
    }

    if (!pelletsRemain) {
      this.setState(GAME_STATES.LEVEL_COMPLETE);
      setTimeout(() => {
        this.nextLevel();
      }, 2000);
    }
  }

  nextLevel() {
    this.level++;
    // Increase difficulty (speed up ghosts slightly)
    // For now just reset board
    this.setupLevel(); // Refills pellets
    this.resetPositions();
    this.setState(GAME_STATES.READY);
  }

  triggerFrightenedMode() {
    this.ghosts.forEach(ghost => ghost.setFrightened(this.grid));
    // Reset frightened timer if already active (simplified)
    // In a full implementation, we'd manage a global timer here.
  }

  checkGhostCollision() {
    if (this.pacman.state !== 'alive') return;

    this.ghosts.forEach(ghost => {
      // Simple distance check (center to center)
      const dx = (this.pacman.tileX + this.pacman.offsetX) - (ghost.tileX + ghost.offsetX);
      const dy = (this.pacman.tileY + this.pacman.offsetY) - (ghost.tileY + ghost.offsetY);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.8) { // Collision threshold
        if (ghost.state === 'frightened') {
          // Eat Ghost
          ghost.setEaten();
          this.score += 200; // TODO: Combo multiplier
          this.renderer.updateScore(this.score);
        } else if (ghost.state === 'normal' || ghost.state === 'scatter' || ghost.state === 'chase') {
          // Pacman Dies
          this.handlePacmanDeath();
        }
      }
    });
  }

  handlePacmanDeath() {
    console.log('Pacman Died');
    this.pacman.state = 'dying';
    this.setState(GAME_STATES.DEATH_SEQUENCE);
    // TODO: Play animation, then reset
    setTimeout(() => {
      this.lives--;
      this.renderer.updateLives(this.lives);
      if (this.lives > 0) {
        this.resetPositions();
        this.setState(GAME_STATES.READY);
      } else {
        this.saveHighScore();
        this.setState(GAME_STATES.GAME_OVER);
      }
    }, 1500);
  }

  resetPositions() {
    // Reset Pacman
    // Find start again or store it
    // For now, just hardcode or re-scan (re-scan is safer if we didn't store)
    let startX = 1, startY = 1;
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[0].length; x++) {
        if (LEVEL_1_LAYOUT[y][x] === TILE_TYPES.PACMAN_START) { // Use original layout for start pos
          startX = x;
          startY = y;
        }
      }
    }
    this.pacman.tileX = startX;
    this.pacman.tileY = startY;
    this.pacman.offsetX = 0;
    this.pacman.offsetY = 0;
    this.pacman.direction = DIRECTIONS.NONE;
    this.pacman.nextDirection = DIRECTIONS.NONE;
    this.pacman.state = 'alive';
    this.pacman.updateVisuals();

    // Reset Ghosts
    this.ghosts.forEach(ghost => ghost.reset());
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('pacman_high_score', this.highScore);
      this.renderer.updateHighScore(this.highScore);
    }
  }

  togglePause() {
    if (this.state === GAME_STATES.PLAYING) {
      this.setState(GAME_STATES.PAUSED);
    } else if (this.state === GAME_STATES.PAUSED) {
      this.setState(GAME_STATES.PLAYING);
    }
  }

  restart() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.renderer.updateScore(this.score);
    this.renderer.updateLives(this.lives);
    this.setupLevel(); // Reset grid
    this.resetPositions();
    this.setState(GAME_STATES.READY);
  }

  handleInput(code) {
    if (code === 'Escape') {
      this.togglePause();
    } else if (code === 'Enter') {
      if (this.state === GAME_STATES.GAME_OVER) {
        this.restart();
      }
    }
  }



  gameLoop(timestamp) {
    let dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Cap dt to prevent huge jumps (e.g. tab switch)
    if (dt > 0.1) dt = 0.1;

    // Log every 60 frames (approx 1 sec)
    if (!this.frameCounter) this.frameCounter = 0;
    this.frameCounter++;
    if (this.frameCounter % 60 === 0) {
      console.log(`[GameLoop] dt=${dt.toFixed(4)} State=${this.state} Mode=${this.globalMode}`);
    }

    this.update(dt);
    requestAnimationFrame((t) => this.gameLoop(t));
  }
}
