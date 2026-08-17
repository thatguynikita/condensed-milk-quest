import { state } from '../state.js';

const clouds = [
  { x: 100, y: 100, scale: 1 },
  { x: 500, y: 50, scale: 1.5 },
  { x: 900, y: 150, scale: 0.8 },
  { x: 1400, y: 80, scale: 1.2 },
  { x: 2000, y: 120, scale: 1 },
  { x: 2500, y: 60, scale: 1.3 },
];

function drawClouds(ctx, camX) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let c of clouds) {
    const cx = (c.x - camX * 0.3) % 3000;
    const drawX = cx < -200 ? cx + 3000 : cx;
    ctx.beginPath();
    ctx.arc(drawX, c.y, 30 * c.scale, 0, Math.PI * 2);
    ctx.arc(drawX + 30 * c.scale, c.y - 10 * c.scale, 35 * c.scale, 0, Math.PI * 2);
    ctx.arc(drawX + 60 * c.scale, c.y, 30 * c.scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function draw(ctx, canvas, level, player, butterflies) {
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (state.gameState === 'START') return;
  ctx.save();
  drawClouds(ctx, state.camera.x);
  ctx.translate(-state.camera.x, 0);
  level.draw(ctx);
  player.draw(ctx, level);
  for (let b of butterflies) b.draw(ctx);
  ctx.restore();
}
