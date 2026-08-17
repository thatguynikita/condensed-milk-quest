import { PLAYER } from '../config.js';
import { rectsOverlap } from '../level/collision.js';
import { BouncingMilk } from './BouncingMilk.js';
import { playHitSound } from '../audio/synths.js';
import { state } from '../state.js';

export class Player {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.width = PLAYER.width;
    this.height = PLAYER.height;
    this.reset();
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
    this.speed = PLAYER.speed;
    this.jumpPower = PLAYER.jumpPower;
    this.gravity = PLAYER.gravity;
    this.grounded = false;
    this.facingRight = true;
    this.walkCycle = 0;
    this.invulnerableTimer = 0;
    this.stunTimer = 0;
    this.jumpsLeft = PLAYER.jumpsPerLanding;
    this.prevJumpInput = false;
    this.invisible = false;
  }

  // `onMilkCountChanged` is called when a hit drops milksCollected back below
  // totalMilks, so the caller can refresh the score HUD.
  takeDamage(level, onMilkCountChanged) {
    if (this.invulnerableTimer > 0) return;

    this.invulnerableTimer = PLAYER.invulnerableFrames;
    this.stunTimer = PLAYER.stunFrames;

    let dropCount = Math.min(PLAYER.maxMilksDroppedOnHit, level.milksCollected);
    if (dropCount > 0) {
      level.milksCollected -= dropCount;

      if (level.milksCollected < level.totalMilks) {
        onMilkCountChanged();
      }

      for (let i = 0; i < dropCount; i++) {
        let vx = (Math.random() - 0.5) * 12;
        let vy = -8 - Math.random() * 6;
        level.bouncingMilks.push(new BouncingMilk(this.x + this.width / 2 - 12, this.y, vx, vy));
      }
    }

    this.vy = PLAYER.hitKnockbackVy;
    this.vx = this.facingRight ? -PLAYER.hitKnockbackVx : PLAYER.hitKnockbackVx;

    playHitSound();
  }

  update(level) {
    const keys = state.keys;

    if (this.invulnerableTimer > 0) this.invulnerableTimer--;

    if (this.stunTimer > 0) {
      this.stunTimer--;
    } else {
      if (keys.left) {
        this.vx = -this.speed;
        this.facingRight = false;
        this.walkCycle += 0.2;
      } else if (keys.right) {
        this.vx = this.speed;
        this.facingRight = true;
        this.walkCycle += 0.2;
      } else {
        this.vx = 0;
        this.walkCycle = 0;
      }

      let jumpInput = keys.up;
      if (jumpInput && !this.prevJumpInput && this.jumpsLeft > 0) {
        this.vy = this.jumpPower;
        this.grounded = false;
        this.jumpsLeft--;
      }
      this.prevJumpInput = jumpInput;
    }

    this.vy += this.gravity;
    if (this.vy > PLAYER.maxFallSpeed) this.vy = PLAYER.maxFallSpeed;

    this.x += this.vx;
    this.checkCollisions(true, level);
    this.y += this.vy;
    this.grounded = false;
    this.checkCollisions(false, level);

    if (this.y > PLAYER.respawnBelowY) {
      this.reset();
      state.camera.x = 0;
    }
    if (this.x < 0) this.x = 0;
  }

  checkCollisions(isHorizontal, level) {
    for (let plat of level.platforms) {
      if (rectsOverlap({ x: this.x, y: this.y, w: this.width, h: this.height }, plat)) {
        if (isHorizontal) {
          if (this.vx > 0) this.x = plat.x - this.width;
          else if (this.vx < 0) this.x = plat.x + plat.w;
          this.vx = 0;
        } else {
          if (this.vy > 0) {
            this.y = plat.y - this.height;
            this.grounded = true;
            this.vy = 0;
            this.jumpsLeft = PLAYER.jumpsPerLanding;
          } else if (this.vy < 0) {
            this.y = plat.y + plat.h;
            this.vy = 0;
          }
        }
      }
    }
  }

  draw(ctx, level) {
    if (this.invisible) return;
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) return;

    let fatW = level.milksCollected ? level.milksCollected * 1.2 : 0;
    let fatH = level.milksCollected ? level.milksCollected * 0.6 : 0;

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2 - fatH / 2);
    if (!this.facingRight) ctx.scale(-1, 1);

    const bob = Math.abs(Math.sin(this.walkCycle)) * 4;
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(
      -20 - fatW / 2,
      5 - bob / 2 + fatH / 4,
      12,
      4 + fatH / 6,
      Math.PI / 4 + Math.sin(this.walkCycle) * 0.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-10 - fatW / 3, 10 + Math.sin(this.walkCycle) * 3 + fatH / 2, 8, 10);
    ctx.fillRect(8 + fatW / 6, 10 - Math.sin(this.walkCycle) * 3 + fatH / 2, 8, 10);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(-18 - fatW / 2, -10 - bob - fatH / 2, 36 + fatW, 24 + fatH, 10 + fatH / 3);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(0, -5 - bob - fatH / 4, 16 + fatW / 3, 14 + fatH / 2, 8 + fatH / 4);
    ctx.fill();

    const hX = 10 + fatW / 4;
    const hY = -12 - bob - fatH / 3;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(hX, hY, 14 + fatW / 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hX - 8, hY - 10);
    ctx.lineTo(hX - 2, hY - 20 - fatW / 15);
    ctx.lineTo(hX + 4, hY - 10);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hX + 2, hY - 6);
    ctx.lineTo(hX + 12, hY - 14 - fatW / 15);
    ctx.lineTo(hX + 12, hY - 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.moveTo(hX - 6, hY - 10);
    ctx.lineTo(hX - 2, hY - 16 - fatW / 15);
    ctx.lineTo(hX + 2, hY - 10);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(hX + 4, hY - 2, 2, 0, Math.PI * 2);
    ctx.arc(hX + 10, hY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(hX + 12, hY + 4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-2, 10 - Math.sin(this.walkCycle) * 3 + fatH / 2, 6, 10);
    ctx.fillRect(12 + fatW / 3, 10 + Math.sin(this.walkCycle) * 3 + fatH / 2, 6, 10);
    ctx.restore();
  }
}
