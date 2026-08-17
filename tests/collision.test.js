import { describe, it, expect } from 'vitest';
import { rectsOverlap } from '../src/level/collision.js';

describe('rectsOverlap', () => {
  it('detects overlapping rects', () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
  });

  it('detects non-overlapping rects', () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 10, h: 10 })).toBe(false);
  });

  it('treats exactly touching edges as non-overlapping', () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });

  it('detects one rect fully containing another', () => {
    expect(rectsOverlap({ x: 0, y: 0, w: 100, h: 100 }, { x: 40, y: 40, w: 5, h: 5 })).toBe(true);
  });
});
