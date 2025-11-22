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
      const key = btn.getAttribute('data-key');

      // Handle Touch/Click
      const handleInput = (e) => {
        e.preventDefault(); // Prevent default browser behavior (zooming, scrolling)

        // Simulate KeyDown
        this.handleKeyDown({ code: key });

        // For visual feedback or momentary actions, we might want KeyUp too?
        // For movement (lastDirection), KeyDown is enough.
        // For Pause (Escape), KeyDown triggers the event.

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
