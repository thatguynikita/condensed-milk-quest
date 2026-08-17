import { state } from '../state.js';

function bindTouch(id, key) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      state.keys[key] = true;
    });
    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      state.keys[key] = false;
    });
    el.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      state.keys[key] = false;
    });
  }
}

export function initTouchControls() {
  bindTouch('btn-left', 'left');
  bindTouch('btn-right', 'right');
  bindTouch('btn-jump', 'up');
}
