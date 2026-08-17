import { DOG_ENEMY } from '../config.js';

export class DogEnemy {
  constructor(x, y, minX, maxX) {
    this.x = x;
    this.y = y;
    this.width = DOG_ENEMY.width;
    this.height = DOG_ENEMY.height;
    this.minX = minX;
    this.maxX = maxX;
    this.vx = DOG_ENEMY.speed;
    this.dead = false;
    this.stompable = true;
  }

  update() {
    if (this.dead) return;
    this.x += this.vx;
    if (this.x > this.maxX - this.width) {
      this.x = this.maxX - this.width;
      this.vx = -this.vx;
    }
    if (this.x < this.minX) {
      this.x = this.minX;
      this.vx = -this.vx;
    }
  }

  draw(ctx) {
    if (this.dead) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    let facingRight = this.vx > 0;
    if (!facingRight) {
      ctx.translate(this.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    let tailBob = Math.sin(Date.now() / 100) * 5;
    ctx.moveTo(4, 12);
    ctx.lineTo(-8, 4 + tailBob);
    ctx.stroke();

    ctx.fillStyle = '#290f02';
    let legOffset = Math.sin(Date.now() / 80) * 4;
    ctx.beginPath();
    ctx.roundRect(6 + legOffset, 22, 6, 12, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(28 - legOffset, 22, 6, 12, 3);
    ctx.fill();

    ctx.fillStyle = '#5c2305';
    ctx.beginPath();
    ctx.roundRect(2, 8, 36, 18, 8);
    ctx.fill();

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(14 - legOffset, 22, 6, 12, 3);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(36 + legOffset, 22, 6, 12, 3);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.fillRect(32, 6, 6, 20);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(35, 26, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#5c2305';
    ctx.beginPath();
    ctx.roundRect(36, 2, 18, 16, 6);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(54, 6, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#290f02';
    ctx.beginPath();
    ctx.moveTo(38, 16);
    ctx.lineTo(52, 16);
    ctx.lineTo(46, 22);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(48, 16);
    ctx.lineTo(52, 16);
    ctx.lineTo(50, 20);
    ctx.fill();

    ctx.fillStyle = '#290f02';
    ctx.beginPath();
    ctx.roundRect(38, 0, 8, 16, 4);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(48, 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(49, 8, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(44, 4);
    ctx.lineTo(51, 6);
    ctx.stroke();

    ctx.restore();
  }
}
