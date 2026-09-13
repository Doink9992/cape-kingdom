import { KEYMAP } from './Constants.js';

class InputManager {
  constructor() {
    this.keys = new Set();
    this.pressedThisFrame = new Set();
    this.releasedThisFrame = new Set();
    this.touch = { left: false, right: false, down: false, jump: false, run: false };
    this._bind();
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) this.pressedThisFrame.add(e.code);
      this.keys.add(e.code);
      if (this._isGameKey(e.code)) e.preventDefault();
    }, { passive: false });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      this.releasedThisFrame.add(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
    });

    this._bindTouchButton('tc-left', 'left');
    this._bindTouchButton('tc-right', 'right');
    this._bindTouchButton('tc-down', 'down');
    this._bindTouchButton('tc-jump', 'jump');
    this._bindTouchButton('tc-run', 'run');

    if ('ontouchstart' in window) {
      document.body.classList.add('touch');
    }
  }

  _bindTouchButton(id, action) {
    const el = document.getElementById(id);
    if (!el) return;
    const on = (e) => { e.preventDefault(); this.touch[action] = true; };
    const off = (e) => { e.preventDefault(); this.touch[action] = false; };
    el.addEventListener('touchstart', on, { passive: false });
    el.addEventListener('touchend', off, { passive: false });
    el.addEventListener('touchcancel', off, { passive: false });
    el.addEventListener('mousedown', on);
    el.addEventListener('mouseup', off);
    el.addEventListener('mouseleave', off);
  }

  _isGameKey(code) {
    return Object.values(KEYMAP).some((codes) => codes.includes(code));
  }

  isDown(action) {
    const codes = KEYMAP[action] || [];
    if (codes.some((c) => this.keys.has(c))) return true;
    return !!this.touch[action];
  }

  wasPressed(action) {
    const codes = KEYMAP[action] || [];
    return codes.some((c) => this.pressedThisFrame.has(c));
  }

  wasReleased(action) {
    const codes = KEYMAP[action] || [];
    return codes.some((c) => this.releasedThisFrame.has(c));
  }

  endFrame() {
    this.pressedThisFrame.clear();
    this.releasedThisFrame.clear();
  }
}

export const Input = new InputManager();
