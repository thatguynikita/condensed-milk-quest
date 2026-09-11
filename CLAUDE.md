# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A browser platformer ("Котик и Сгущенка" / "Cat and Condensed Milk") built with vanilla JS and the Canvas 2D API — no game engine. Bundled with Vite, styled with Tailwind CSS v4, RU/EN bilingual, with a Firebase-backed weekly leaderboard. Played standalone at cat.nikita.sh and also embedded as an iframe inside [nikita.sh](https://github.com/thatguynikita/nikita.sh)'s terminal-themed portfolio (a sibling repo) — layout/sizing changes should keep working inside an iframe, not just full-page.

## Commands

```bash
npm install
cp .env.example .env   # fill in Firebase config — see docs/FIREBASE-SETUP.md
npm run dev             # Vite dev server
npm run build            # production build to dist/
npm run preview           # serve the dist/ build locally
npm run lint                # ESLint (flat config, eslint.config.js)
npm run format                # Prettier, writes in place
npm run test                    # Vitest, runs everything in tests/
npm run deploy                    # build, then upload dist/ to S3 (AWS or Yandex)
```

Run a single test file: `npx vitest run tests/level.test.js`. Run by name pattern: `npx vitest run -t "pattern"`.

**Run `npm run format` before every commit.** Several files predated Prettier being added and had drifted from it; don't let that happen again.

Without a valid `.env`, the game still runs fine — `initLeaderboard()` catches Firebase init failures and the leaderboard just silently no-ops.

CI (`.github/workflows/ci.yml`) runs lint + test + build on every push/PR — it doesn't deploy. `npm run deploy` (see `scripts/deploy.mjs`) shells out to the AWS CLI (`aws s3api`) and is meant to be run manually. It targets any S3-compatible storage — AWS S3 and Yandex Object Storage differ only by `S3_ENDPOINT` (blank means AWS). The target bucket is never hardcoded, only `S3_BUCKET` (local `.env`) or `--bucket`. The script deliberately does more than `aws s3 sync` would: explicit per-file content types (charset included), per-file `Cache-Control`, `index.html` uploaded last and skipped if any asset failed, and a prune step that deletes bucket keys no longer in `dist/` (skipped when deploying a subset of files).

## Architecture

`src/main.js` is the composition root: it owns the `requestAnimationFrame` game loop, all `keydown`/`keyup`/`resize` listeners, and instantiates `player`/`level`/`butterflies`. Those entity instances are **not** kept in shared state — `main.js` passes them explicitly into whatever function needs them (`player.update(level)`, `draw(ctx, canvas, level, player, butterflies)`, etc.).

`src/state.js` is the one intentional shared-mutable-state module: game phase (`gameState`), `camera`, `keys`, pause/run timers, `scoreState`. Other modules `import { state } from '../state.js'` directly rather than having it threaded through as a parameter — treat it as the single source of truth for that category of session state.

`src/config.js` holds tunable gameplay constants (physics, level-generation ranges, timers, counts). Purely cosmetic pixel-art numbers (sprite coordinates inside each entity's `draw()`) are deliberately left inline instead — that split (balance knobs in config, art in the draw calls) is intentional, keep it when adding entities.

Collision math is centralized in `src/level/collision.js`'s `rectsOverlap(a, b)`, which takes `{x, y, w, h}` shaped rects. Platform objects already use `w`/`h` naturally; entity instances use `width`/`height`, so call sites normalize with a small `{x, y, w: e.width, h: e.height}` wrapper (see the `rect()` helper in `main.js`) — don't reintroduce the ad-hoc inline AABB checks this replaced.

Other module boundaries:

- `src/entities/*.js` — one file per game object (`Player`, `DogEnemy`, `CactusEnemy`, `CondensedMilk`, `BouncingMilk`, `Butterfly`)
- `src/level/Level.js` — procedural level generation + world rendering
- `src/render/draw.js` — per-frame draw orchestration (sky, clouds, world, entities)
- `src/ui/hud.js`, `src/ui/menus.js`, `src/ui/touchControls.js` — HUD, start/pause/win overlays + language/sound toggles, mobile touch bindings
- `src/i18n/translations.js` — RU/EN copy plus `t()`/`getLang()`/`setLang()`; `lang` is lazily read from `localStorage` on first use (not at module load) so importing the module has no side effects
- `src/audio/synths.js` — Tone.js setup; every exported trigger function (`triggerSlurp`, `playHitSound`, etc.) self-guards on whether audio is initialized, so callers never need to check first
- `src/net/leaderboard.js` — Firebase init (config from `import.meta.env.VITE_FIREBASE_*`), score read/write, leaderboard rendering. Player names are untrusted input — rendered via `textContent`, never `innerHTML`; keep it that way

## Firebase / leaderboard

Firebase Web SDK config values are meant to be public (Firebase ships them in every web app bundle) — they're read from `VITE_FIREBASE_*` env vars for cleanliness, not because they're secret. Actual access control is `firestore.rules` (validates the leaderboard's `create` path: name length, positive/bounded time, roughly-now date, no extra fields, no update/delete) plus API key restrictions on the Firebase project itself. `firestore.rules` is version-controlled here but **not auto-deployed** — no Firebase CLI project is linked, so changes to it need to be pasted into Firebase Console → Firestore Database → Rules by hand. Full from-scratch setup (project creation, API key restrictions, deploying the rules) is in `docs/FIREBASE-SETUP.md`.

## Tests

Vitest suite in `tests/` covers pure logic only: `collision.test.js` (AABB overlap cases), `level.test.js` (`generateLevel()` invariants — exact `totalMilks` collectible count, positive platform dimensions, reachable flagpole), `translations.test.js` (RU/EN key-set parity). No DOM/canvas tests.
