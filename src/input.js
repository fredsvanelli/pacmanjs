import { DIRECTIONS } from './constants.js';

export class InputHandler {
  constructor() {
    this.keys = {};
    this.lastDirection = DIRECTIONS.NONE;

    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));

    this.setupMobileControls();
  }

  setupMobileControls() {
    const buttons = document.querySelectorAll('.d-btn, .action-btn');

    buttons.forEach(btn => {
      // Handle Touch/Click
      const handleInput = (e) => {
        e.preventDefault(); // Prevent default browser behavior (zooming, scrolling)

        // Read data-key at click time (not setup time) so it works when dynamically changed
        const key = btn.getAttribute('data-key');

        // Simulate KeyDown
        this.handleKeyDown({ code: key });

        // Simulate KeyUp after a short delay for button press effect logic if needed
        setTimeout(() => {
          this.handleKeyUp({ code: key });
        }, 100);
      };

      btn.addEventListener('touchstart', handleInput, { passive: false });
      btn.addEventListener('mousedown', handleInput);
    });
  }

  handleKeyDown(e) {
    this.keys[e.code] = true;

    switch (e.code) {
      case 'ArrowUp': this.lastDirection = DIRECTIONS.UP; break;
      case 'ArrowDown': this.lastDirection = DIRECTIONS.DOWN; break;
      case 'ArrowLeft': this.lastDirection = DIRECTIONS.LEFT; break;
      case 'ArrowRight': this.lastDirection = DIRECTIONS.RIGHT; break;
      case 'Escape':
      case 'Enter':
        window.dispatchEvent(new CustomEvent('game-input', { detail: e.code }));
        break;
    }
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  getDirection() {
    return this.lastDirection;
  }
}
