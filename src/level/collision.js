// Axis-aligned bounding box overlap check, shared by every collision test
// in the game (player/platform, player/enemy, player/pickup, flagpole...).
// Rects use {x, y, w, h}.
export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
