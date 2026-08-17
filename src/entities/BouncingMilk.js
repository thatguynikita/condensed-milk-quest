import { BOUNCING_MILK } from '../config.js';
import { rectsOverlap } from '../level/collision.js';

export class BouncingMilk {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.width = BOUNCING_MILK.width;
    this.height = BOUNCING_MILK.height;
    this.vx = vx;
    this.vy = vy;
    this.gravity = BOUNCING_MILK.gravity;
    this.collectableDelay = BOUNCING_MILK.collectableDelayFrames;
    this.collected = false;
  }

  // `player` is only used as a respawn anchor if this pickup falls out of the world.
  update(platforms, player) {
    if (this.collected) return;
    if (this.collectableDelay > 0) this.collectableDelay--;

    this.vy += this.gravity;
    if (this.vy > BOUNCING_MILK.maxFallSpeed) this.vy = BOUNCING_MILK.maxFallSpeed;
    this.x += this.vx;
    this.y += this.vy;

    let grounded = false;
    for (let p of platforms) {
      if (rectsOverlap({ x: this.x, y: this.y, w: this.width, h: this.height }, p)) {
        if (this.vy > 0 && this.y - this.vy + this.height <= p.y + 15) {
          this.y = p.y - this.height;
          this.vy = -this.vy * BOUNCING_MILK.bounceDamping;
          if (Math.abs(this.vy) < BOUNCING_MILK.restVelocityThreshold) {
            this.vy = 0;
            grounded = true;
          }
        }
      }
    }
    if (grounded) this.vx *= BOUNCING_MILK.groundFriction;

    if (this.y > BOUNCING_MILK.respawnBelowY) {
      this.y = player.y - BOUNCING_MILK.respawnAboveOffset;
      this.vy = 0;
      this.vx = 0;
      this.x = player.x + (Math.random() - 0.5) * 200;
    }
  }

  draw(ctx) {
    if (this.collected) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.collectableDelay > 0 && Math.floor(Date.now() / 100) % 2 === 0) ctx.globalAlpha = 0.5;

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
