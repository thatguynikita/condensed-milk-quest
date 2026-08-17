const COLORS = ['#bae6fd', '#7dd3fc', '#e0f2fe', '#ffffff', '#f0f9ff'];

export class Butterfly {
  constructor(startX) {
    this.x = startX;
    this.y = Math.random() * 400 + 20;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.size = Math.random() * 2 + 1.5;
    this.wingSpeed = Math.random() * 0.3 + 0.15;
    this.wingPhase = Math.random() * Math.PI * 2;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.time = Math.random() * 1000;
  }

  update(camera, canvasWidth) {
    this.time += 0.05;
    this.vx += (Math.random() - 0.5) * 0.3;
    this.vy += (Math.random() - 0.5) * 0.3;
    if (this.vx > 1.5) this.vx = 1.5;
    if (this.vx < -1.5) this.vx = -1.5;
    if (this.vy > 1.5) this.vy = 1.5;
    if (this.vy < -1.5) this.vy = -1.5;
    this.x += this.vx;
    this.y += this.vy + Math.sin(this.time) * 0.5;
    if (this.y < 20) this.vy += 0.2;
    if (this.y > 450) this.vy -= 0.2;
    const buffer = 800;
    if (this.x < camera.x - buffer) this.x = camera.x + canvasWidth + buffer;
    if (this.x > camera.x + canvasWidth + buffer) this.x = camera.x - buffer;
    this.wingPhase += this.wingSpeed;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const wingWidth = Math.abs(Math.sin(this.wingPhase)) * this.size * 2;
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(-wingWidth / 2 - 0.5, 0, wingWidth / 2, this.size, Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(wingWidth / 2 + 0.5, 0, wingWidth / 2, this.size, -Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
