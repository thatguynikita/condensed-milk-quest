import './styles/main.css';

import { state, getElapsedSeconds } from './state.js';
import { PLAYER, CAMERA, BUTTERFLY_COUNT } from './config.js';
import { Player } from './entities/Player.js';
import { Level } from './level/Level.js';
import { Butterfly } from './entities/Butterfly.js';
import { rectsOverlap } from './level/collision.js';
import { setScoreState, renderTimer } from './ui/hud.js';
import { initMenus, togglePause, triggerEnding, gameWin } from './ui/menus.js';
import { initTouchControls } from './ui/touchControls.js';
import { draw } from './render/draw.js';
import { triggerSlurp, playStompSound } from './audio/synths.js';
import { initLeaderboard } from './net/leaderboard.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') state.keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') state.keys.right = true;
  if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') state.keys.up = true;
  if (e.code === 'Escape') togglePause();
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') state.keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') state.keys.right = false;
  if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') state.keys.up = false;
});

initTouchControls();

const player = new Player(PLAYER.startX, PLAYER.startY);
const level = new Level();
const butterflies = [];
for (let i = 0; i < BUTTERFLY_COUNT; i++) butterflies.push(new Butterfly(Math.random() * 2000));

function rect(entity) {
  return { x: entity.x, y: entity.y, w: entity.width, h: entity.height };
}

function update() {
  if (state.gameState === 'PLAYING' || state.gameState === 'ENDING') {
    if (state.gameState === 'PLAYING') {
      renderTimer(getElapsedSeconds());
    }

    if (state.gameState === 'ENDING') {
      state.keys.right = true;
      state.keys.left = false;
      state.keys.up = false;

      const hX = level.house.x;
      level.doorOpen = player.x > hX + 20 && player.x < hX + 110;

      if (player.x >= hX + 100) {
        player.vx = 0;
        state.keys.right = false;
        player.invisible = true;

        if (!level.winTriggered) {
          level.winTriggered = true;
          level.doorOpen = false;
          setTimeout(gameWin, 1000);
        }
      }
    }

    player.update(level);

    for (let m of level.milks) {
      if (!m.collected && rectsOverlap(rect(player), rect(m))) {
        m.collected = true;
        level.milksCollected++;
        setScoreState(level.milksCollected >= level.totalMilks ? 'ready' : 'normal', level);
        triggerSlurp();
      }
    }

    for (let i = level.enemies.length - 1; i >= 0; i--) {
      let e = level.enemies[i];
      e.update();

      if (!e.dead && !player.invisible && rectsOverlap(rect(player), rect(e))) {
        if (e.stompable && player.vy > 0 && player.y + player.height - player.vy <= e.y + 15) {
          e.dead = true;
          player.vy = PLAYER.stompBounceVy;
          player.jumpsLeft = PLAYER.stompJumpsLeft;
          playStompSound();
        } else if (state.gameState === 'PLAYING') {
          player.takeDamage(level, () => setScoreState('normal', level));
        }
      }
    }

    for (let i = level.bouncingMilks.length - 1; i >= 0; i--) {
      let bm = level.bouncingMilks[i];
      bm.update(level.platforms, player);
      if (!bm.collected && bm.collectableDelay <= 0 && rectsOverlap(rect(player), rect(bm))) {
        bm.collected = true;
        level.milksCollected++;
        setScoreState(level.milksCollected >= level.totalMilks ? 'ready' : 'normal', level);
        triggerSlurp();
        level.bouncingMilks.splice(i, 1);
      }
    }

    if (state.gameState === 'PLAYING' && level.flagpole) {
      const flagRect = {
        x: level.flagpole.x - 20,
        y: level.flagpole.y,
        w: level.flagpole.w + 40,
        h: level.flagpole.h,
      };
      if (rectsOverlap(rect(player), flagRect)) {
        if (level.milksCollected >= level.totalMilks) {
          triggerEnding();
        } else {
          setScoreState('blocked', level);
        }
      } else if (level.milksCollected < level.totalMilks && state.scoreState === 'blocked') {
        setScoreState('normal', level);
      }
    }

    const targetCamX = player.x - canvas.width / 2 + player.width / 2;
    state.camera.x += (Math.max(0, targetCamX) - state.camera.x) * CAMERA.lerp;
    for (let b of butterflies) b.update(state.camera, canvas.width);
  }
}

function gameLoop() {
  update();
  draw(ctx, canvas, level, player, butterflies);
  requestAnimationFrame(gameLoop);
}

initMenus(player, level);
initLeaderboard();
gameLoop();
