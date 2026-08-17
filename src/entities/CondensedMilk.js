import { CONDENSED_MILK } from '../config.js';

export class CondensedMilk {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = CONDENSED_MILK.width;
    this.height = CONDENSED_MILK.height;
    this.collected = false;
    this.hoverOffset = Math.random() * Math.PI * 2;
  }

  draw(ctx) {
    if (this.collected) return;
    const hoverY = this.y + Math.sin(Date.now() / 300 + this.hoverOffset) * 5;
    ctx.save();
    ctx.translate(this.x, hoverY);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, 24, 32);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 4, 24, 24);
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(12, 12);
    ctx.lineTo(24, 4);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.lineTo(12, 20);
    ctx.lineTo(24, 28);
    ctx.fill();
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(4, 15, 16, 3);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, 24, 3);
    ctx.fillRect(0, 29, 24, 3);
    ctx.restore();
  }
}
