// Shared mutable runtime state. This is the one intentional "global" in the
// app — session/meta state that many modules legitimately need to read or
// write (input, camera, timers, game phase). Entity instances (player,
// level, clouds, butterflies) are NOT kept here; main.js owns those and
// passes them explicitly to the functions that need them.

export const state = {
  gameState: 'START', // START | PLAYING | PAUSED | ENDING | WIN
  camera: { x: 0, y: 0 },
  keys: { left: false, right: false, up: false },
  startTime: 0,
  totalPausedMs: 0,
  pauseStartedAt: 0,
  finalTime: 0,
  playerName: '',
  overlayMode: 'start', // 'start' | 'win'
  scoreState: 'normal', // 'normal' | 'ready' | 'blocked'
};

export function getElapsedSeconds() {
  return (Date.now() - state.startTime - state.totalPausedMs) / 1000;
}
