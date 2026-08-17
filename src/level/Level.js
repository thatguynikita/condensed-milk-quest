import { LEVEL } from '../config.js';
import { DogEnemy } from '../entities/DogEnemy.js';
import { CactusEnemy } from '../entities/CactusEnemy.js';
import { CondensedMilk } from '../entities/CondensedMilk.js';

function rand(min, max) {
  return min + Math.random() * (max - min);
}

export class Level {
  constructor() {
    this.platforms = [];
    this.milks = [];
    this.totalMilks = LEVEL.totalMilks;
    this.milksCollected = 0;
    this.enemies = [];
    this.bouncingMilks = [];
    this.flagpole = null;
    this.house = null;
    this.doorOpen = false;
    this.winTriggered = false;
  }

  generateLevel() {
    this.platforms = [];
    this.milks = [];
    this.milksCollected = 0;
    this.enemies = [];
    this.bouncingMilks = [];
    const levelLength = LEVEL.length;

    let currX = LEVEL.groundStartX;
    while (currX < levelLength) {
      let w = rand(...LEVEL.groundWidthRange);
      if (currX + w > levelLength) w = levelLength - currX + 500;
      this.platforms.push({ x: currX, y: 500, w: w, h: 200, isGround: true });
      let gap = rand(...LEVEL.groundGapRange);
      currX += w + gap;
    }

    currX = LEVEL.floatingStartX;
    while (currX < levelLength - 500) {
      let w = rand(...LEVEL.floatingWidthRange);
      let y = rand(...LEVEL.floatingYRange);
      this.platforms.push({ x: currX, y: y, w: w, h: 20 });
      if (Math.random() > 0.55) {
        let w2 = 80 + Math.random() * 100;
        let y2 = y - (100 + Math.random() * 40);
        this.platforms.push({ x: currX + Math.random() * (w - w2), y: y2, w: w2, h: 20 });
        if (Math.random() > 0.7) {
          let w3 = 60 + Math.random() * 80;
          let y3 = y2 - (100 + Math.random() * 40);
          this.platforms.push({ x: currX + Math.random() * (w2 - w3 / 2), y: y3, w: w3, h: 20 });
        }
      }
      let gap = rand(...LEVEL.floatingGapRange);
      currX += w + gap;
    }

    let validPlatforms = this.platforms.filter((p) => p.x > LEVEL.milkMinPlatformX);
    validPlatforms.sort((a, b) => a.x - b.x);
    let numMilksToSpawn = Math.min(this.totalMilks, validPlatforms.length);
    let step = validPlatforms.length / numMilksToSpawn;

    for (let i = 0; i < numMilksToSpawn; i++) {
      let pIndex = Math.floor(i * step);
      if (pIndex >= validPlatforms.length) pIndex = validPlatforms.length - 1;
      let p = validPlatforms[pIndex];
      let milkX = p.x + p.w / 2 - 12;
      let maxOffset = p.w / 2 - 24;
      if (maxOffset > 0) milkX += (Math.random() - 0.5) * maxOffset;
      this.milks.push(new CondensedMilk(milkX, p.y - 32));
    }

    let safePlatforms = [];
    for (let p of validPlatforms) {
      if (p.x < LEVEL.safePlatformMinX) continue;

      let hasClearance = true;
      for (let other of this.platforms) {
        if (other === p || other.isGround) continue;
        if (other.y < p.y && other.y > p.y - LEVEL.safePlatformClearance) {
          if (other.x < p.x + p.w && other.x + other.w > p.x) {
            hasClearance = false;
            break;
          }
        }
      }
      if (hasClearance) safePlatforms.push(p);
    }

    let currentEnemyX = LEVEL.enemyStartX;
    const levelEndX = LEVEL.enemyEndX;

    while (currentEnemyX < levelEndX) {
      let overlappingPlatforms = safePlatforms.filter(
        (p) => currentEnemyX >= p.x + 20 && currentEnemyX <= p.x + p.w - 60
      );

      if (overlappingPlatforms.length > 0) {
        let p = overlappingPlatforms[Math.floor(Math.random() * overlappingPlatforms.length)];

        if (Math.random() > 0.5) {
          this.enemies.push(new DogEnemy(currentEnemyX, p.y - 34, p.x, p.x + p.w));
        } else {
          this.enemies.push(new CactusEnemy(currentEnemyX, p.y - 40));
        }

        currentEnemyX += rand(...LEVEL.enemySpacingRange);
      } else {
        currentEnemyX += 50;
      }
    }

    // ФИНАЛ УРОВНЯ
    const finalX = LEVEL.finalGroundX;
    this.platforms.push({ x: finalX - 200, y: 500, w: LEVEL.finalGroundWidth, h: 200, isGround: true });

    let stairStartX = finalX;
    for (let i = 1; i <= LEVEL.stairSteps; i++) {
      this.platforms.push({
        x: stairStartX + (i - 1) * LEVEL.stairStepSize,
        y: 500 - i * LEVEL.stairStepSize,
        w: LEVEL.stairStepSize,
        h: i * LEVEL.stairStepSize,
        isBlock: true,
      });
    }

    this.flagpole = {
      x: stairStartX + LEVEL.stairSteps * LEVEL.stairStepSize + LEVEL.flagpoleOffsetFromStairs,
      y: 100,
      w: 8,
      h: 400,
    };
    this.house = {
      x: this.flagpole.x + LEVEL.houseOffsetFromFlagpole,
      y: 200,
      w: 240,
      h: 300,
    };
  }

  draw(ctx) {
    for (let p of this.platforms) {
      if (p.isBlock) {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        for (let by = p.y; by < p.y + p.h; by += 40) {
          ctx.strokeRect(p.x, by, 40, 40);
          ctx.fillStyle = '#fcd34d';
          ctx.fillRect(p.x + 4, by + 4, 6, 6);
        }
      } else {
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(p.x, p.y, p.w, 15);
        ctx.fillStyle = '#713f12';
        for (let i = 0; i < p.w; i += 40) {
          if (i + 20 < p.w) ctx.fillRect(p.x + i + 10, p.y + 25, 10, 10);
          if (i + 35 < p.w) ctx.fillRect(p.x + i + 25, p.y + 40, 10, 10);
        }
      }
    }
    for (let m of this.milks) m.draw(ctx);
    for (let e of this.enemies) e.draw(ctx);
    for (let bm of this.bouncingMilks) bm.draw(ctx);

    if (this.flagpole) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(this.flagpole.x, this.flagpole.y, this.flagpole.w, this.flagpole.h);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(this.flagpole.x + 4, this.flagpole.y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      let flagWave = Math.sin(Date.now() / 200) * 5;
      ctx.moveTo(this.flagpole.x, this.flagpole.y + 20);
      ctx.lineTo(this.flagpole.x - 70, this.flagpole.y + 20 + flagWave);
      ctx.lineTo(this.flagpole.x - 30, this.flagpole.y + 45);
      ctx.lineTo(this.flagpole.x - 70, this.flagpole.y + 70 - flagWave);
      ctx.lineTo(this.flagpole.x, this.flagpole.y + 70);
      ctx.fill();

      ctx.save();
      const hX = this.house.x;
      const hY = this.house.y;
      const groundY = hY + this.house.h;

      ctx.fillStyle = '#92400e';
      for (let f = -150; f < 400; f += 40) {
        ctx.beginPath();
        ctx.moveTo(hX + f, groundY);
        ctx.lineTo(hX + f, groundY - 60);
        ctx.lineTo(hX + f + 10, groundY - 75);
        ctx.lineTo(hX + f + 20, groundY - 60);
        ctx.lineTo(hX + f + 20, groundY);
        ctx.fill();
      }
      ctx.fillRect(hX - 150, groundY - 50, 550, 10);
      ctx.fillRect(hX - 150, groundY - 25, 550, 10);

      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(hX + 40, hY + 120, 160, 180);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 4;
      ctx.strokeRect(hX + 40, hY + 120, 160, 180);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(hX + 10, hY + 120);
      ctx.lineTo(hX + 120, hY + 20);
      ctx.lineTo(hX + 230, hY + 120);
      ctx.fill();
      ctx.strokeStyle = '#b91c1c';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(hX + 90, hY + 220, 60, 80, 10);
      ctx.fill();

      if (!this.doorOpen) {
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(hX + 90, hY + 220, 60, 80, 10);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(hX + 140, hY + 260, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.roundRect(hX + 70, hY + 225, 20, 75, 5);
        ctx.fill();
      }

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect(hX + 55, hY + 160, 30, 40, 5);
      ctx.roundRect(hX + 155, hY + 160, 30, 40, 5);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hX + 68, hY + 160, 4, 40);
      ctx.fillRect(hX + 55, hY + 178, 30, 4);
      ctx.fillRect(hX + 168, hY + 160, 4, 40);
      ctx.fillRect(hX + 155, hY + 178, 30, 4);

      for (let fl = -100; fl < 350; fl += 60) {
        if (fl > 50 && fl < 170) continue;
        let fx = hX + fl;
        let fy = groundY;

        ctx.fillStyle = '#22c55e';
        ctx.fillRect(fx - 2, fy - 20, 4, 20);
        ctx.beginPath();
        ctx.ellipse(fx - 6, fy - 10, 6, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(fx + 6, fy - 14, 6, 3, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = fl % 120 === 0 ? '#f472b6' : '#a78bfa';
        ctx.beginPath();
        ctx.arc(fx, fy - 25, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(fx - 8, fy - 20, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(fx + 8, fy - 20, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(fx, fy - 15, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(fx, fy - 20, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}
