import { describe, it, expect } from 'vitest';
import { Level } from '../src/level/Level.js';

describe('Level.generateLevel', () => {
  it('spawns exactly totalMilks collectibles', () => {
    const level = new Level();
    level.generateLevel();
    expect(level.milks.length).toBe(level.totalMilks);
  });

  it('produces at least one ground platform, and a flagpole/house reachable from the platforms', () => {
    const level = new Level();
    level.generateLevel();
    expect(level.platforms.some((p) => p.isGround)).toBe(true);
    expect(level.flagpole).not.toBeNull();
    expect(level.house).not.toBeNull();
    const maxPlatformX = Math.max(...level.platforms.map((p) => p.x + p.w));
    expect(level.flagpole.x).toBeLessThanOrEqual(maxPlatformX);
  });

  it('every platform has positive width and height', () => {
    const level = new Level();
    level.generateLevel();
    for (const p of level.platforms) {
      expect(p.w).toBeGreaterThan(0);
      expect(p.h).toBeGreaterThan(0);
    }
  });

  it('resets state cleanly across repeated generations', () => {
    const level = new Level();
    level.generateLevel();
    level.milksCollected = 15;
    level.generateLevel();
    expect(level.milksCollected).toBe(0);
    expect(level.bouncingMilks).toHaveLength(0);
  });
});
