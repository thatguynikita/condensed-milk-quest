// Tunable gameplay constants. Purely cosmetic pixel-art numbers stay inline
// in each entity's draw() method — this file is for things that affect feel/balance.

export const PLAYER = {
  startX: 100,
  startY: 300,
  width: 40,
  height: 36,
  speed: 8,
  jumpPower: -19,
  gravity: 1.2,
  maxFallSpeed: 24,
  jumpsPerLanding: 2,
  invulnerableFrames: 90,
  stunFrames: 15,
  hitKnockbackVy: -10,
  hitKnockbackVx: 8,
  stompBounceVy: -14,
  stompJumpsLeft: 1,
  maxMilksDroppedOnHit: 3,
  respawnBelowY: 1000,
};

export const BOUNCING_MILK = {
  width: 24,
  height: 32,
  gravity: 0.8,
  maxFallSpeed: 15,
  bounceDamping: 0.5,
  restVelocityThreshold: 2,
  groundFriction: 0.8,
  collectableDelayFrames: 45,
  respawnBelowY: 1000,
  respawnAboveOffset: 400,
};

export const CONDENSED_MILK = { width: 24, height: 32 };

export const DOG_ENEMY = { width: 54, height: 34, speed: 2.5 };

export const CACTUS_ENEMY = { width: 30, height: 40 };

export const LEVEL = {
  totalMilks: 30,
  length: 12000,
  groundStartX: -500,
  groundWidthRange: [500, 1500],
  groundGapRange: [100, 200],
  floatingStartX: 400,
  floatingWidthRange: [100, 300],
  floatingYRange: [380, 440],
  floatingGapRange: [100, 250],
  milkMinPlatformX: 300,
  safePlatformMinX: 1000,
  safePlatformClearance: 180,
  enemyStartX: 1200,
  enemyEndX: 11500,
  enemySpacingRange: [150, 350],
  finalGroundX: 11800,
  finalGroundWidth: 2000,
  stairSteps: 8,
  stairStepSize: 40,
  flagpoleOffsetFromStairs: 250,
  houseOffsetFromFlagpole: 200,
};

export const CAMERA = { lerp: 0.1 };

export const BUTTERFLY_COUNT = 25;

export const AUDIO = {
  bpm: 130,
  melodyVolume: -34,
  bassVolume: -30,
  meowVolume: -28,
  slurpVolume: -18,
  meowTriggerThreshold: 0.6, // Math.random() > this triggers the ambient meow each loop (~40% chance)
  slurpMinIntervalSeconds: 0.25,
};

export const STORAGE_KEYS = {
  muted: 'cnc_muted',
  lang: 'cnc_lang',
};
