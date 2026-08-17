import { CACTUS_ENEMY } from '../config.js';

export class CactusEnemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = CACTUS_ENEMY.width;
    this.height = CACTUS_ENEMY.height;
    this.stompable = true;
    this.dead = false;
  }

  update() {
    if (this.dead) return;
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, 5);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(this.x + 5, this.y, 4, this.height);
    ctx.fillRect(this.x + 21, this.y, 4, this.height);
    ctx.fillStyle = '#bef264';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(this.x - 4, this.y + 10 + i * 10, 4, 2);
      ctx.fillRect(this.x + this.width, this.y + 5 + i * 10, 4, 2);
    }
    ctx.fillStyle = 'black';
    ctx.fillRect(this.x + 8, this.y + 12, 4, 4);
    ctx.fillRect(this.x + 18, this.y + 12, 4, 4);
    ctx.fillRect(this.x + 12, this.y + 22, 6, 4);
  }
}
