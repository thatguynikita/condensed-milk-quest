# Котик и Сгущенка (Cat and Condensed Milk)

<p align="center">
  <a href="https://github.com/thatguynikita/condensed-milk-quest/actions/workflows/ci.yml"><img src="https://github.com/thatguynikita/condensed-milk-quest/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/thatguynikita/condensed-milk-quest" alt="License: MIT"></a>
  <a href="https://github.com/thatguynikita/nikita.sh"><img src="https://img.shields.io/badge/universe-nikita.sh-3dff8a" alt="Part of the nikita.sh universe"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Tone.js-8A2BE2" alt="Tone.js">
</p>

<p align="center"><b><a href="https://cat.nikita.sh">▶ Play it live at cat.nikita.sh</a></b></p>

<p align="center">

https://github.com/user-attachments/assets/6b9a00f7-c4ee-4529-b4a7-5e83acb0486e

</p>

A small browser platformer, playable standalone or embedded as an iframe
"app" inside [nikita.sh](https://github.com/thatguynikita/nikita.sh)'s
terminal-themed portfolio.

- Collect 30 cans of condensed milk, dodge dogs and cacti, race to the flag
- Bilingual — Russian and English, switchable from the menu
- Pause menu, plus on-screen touch controls for mobile
- Weekly leaderboard, backed by Firebase

Built with vanilla JS and the Canvas 2D API — no game engine — bundled with
[Vite](https://vitejs.dev).

## Stack

- Vanilla JS (ES modules), Canvas 2D for rendering
- [Vite](https://vitejs.dev) for dev server + build
- [Tailwind CSS v4](https://tailwindcss.com) for UI chrome (menus, HUD, buttons)
- [Tone.js](https://tonejs.github.io) for the procedurally-triggered chiptune audio
- [Firebase](https://firebase.google.com) (Firestore + anonymous Auth) for the leaderboard
- [Vitest](https://vitest.dev) for unit tests, ESLint + Prettier for linting/formatting

## Architecture

| Path                       | What's there                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `index.html`               | DOM skeleton only — canvas, menus, touch controls                                                                     |
| `src/main.js`              | Composition root: owns the game loop, input listeners, instantiates player/level/butterflies                          |
| `src/state.js`             | Shared runtime state (game phase, camera, keys, timers)                                                               |
| `src/config.js`            | Tunable gameplay constants (physics, level generation, timers)                                                        |
| `src/styles/main.css`      | Tailwind + the handful of custom CSS rules (pixel-text outline, touch-control styling, `pointer: coarse` media query) |
| `src/entities/*.js`        | One file per game object: `Player`, `DogEnemy`, `CactusEnemy`, `CondensedMilk`, `BouncingMilk`, `Butterfly`           |
| `src/level/Level.js`       | Procedural level generation + world rendering                                                                         |
| `src/level/collision.js`   | Shared AABB overlap check, used by every collision test                                                               |
| `src/render/draw.js`       | Per-frame draw orchestration (sky, clouds, world, entities)                                                           |
| `src/ui/hud.js`            | Score/timer HUD rendering                                                                                             |
| `src/ui/menus.js`          | Start/pause/win overlays, language & sound toggles, `startGame`/`gameWin`/pause-resume                                |
| `src/ui/touchControls.js`  | Mobile on-screen button bindings                                                                                      |
| `src/i18n/translations.js` | RU/EN copy + `t()`/`getLang()`/`setLang()`                                                                            |
| `src/audio/synths.js`      | Tone.js synth setup and all sound-effect triggers                                                                     |
| `src/net/leaderboard.js`   | Firebase init, score read/write, leaderboard rendering                                                                |
| `tests/`                   | Vitest unit tests (collision, level generation, i18n parity)                                                          |

Gameplay tuning knobs live in `config.js`; purely cosmetic pixel-art numbers
(sprite coordinates inside each entity's `draw()`) stay inline, since those
are art, not balance.

## Local development

```bash
npm install
cp .env.example .env   # fill in Firebase config (see below)
npm run dev
```

### Firebase config

The leaderboard needs a Firebase project (Firestore + Anonymous Auth
enabled). These are Web SDK config values, not secrets — access is
controlled by Firestore security rules and API key restrictions, not by
hiding them — but they're read from environment variables rather than
hardcoded, so `.env` isn't committed. Without a valid `.env`, the game still
runs fine; the leaderboard just silently no-ops (`initLeaderboard()`
catches init failures).

Setting one up from scratch (project creation, API key restrictions,
Firestore rules) is covered in
[`docs/FIREBASE-SETUP.md`](docs/FIREBASE-SETUP.md). If you already have the
values, just copy `.env.example` to `.env` and fill them in.

## Scripts

| Command           | What it does                    |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start the Vite dev server       |
| `npm run build`   | Production build to `dist/`     |
| `npm run preview` | Serve the `dist/` build locally |
| `npm run lint`    | ESLint                          |
| `npm run format`  | Prettier, writes in place       |
| `npm run test`    | Vitest                          |

## Deploy

```bash
npm run deploy -- --dry-run   # preview the upload, no network calls
npm run deploy                 # build + upload dist/ to S3-compatible storage
```

`scripts/deploy.mjs` shells out to the AWS CLI (`aws`, must be installed and
authenticated) and uploads everything under `dist/` via `aws s3api put-object`.
It works against **both AWS S3 and Yandex Object Storage** — they differ only
by endpoint, so leave `S3_ENDPOINT` blank for AWS and set it to
`https://storage.yandexcloud.net` for Yandex. `npm run build` runs first
automatically, so the deployed build is always fresh.

Three things the script does beyond a plain `aws s3 sync`:

- **`index.html` is uploaded last**, after every hashed asset it references, so
  it never points at an asset that isn't there yet — and it's skipped entirely
  if any asset upload failed.
- **Content types are set explicitly**, charset included (`text/html; charset=utf-8`),
  rather than guessed from the file extension.
- **`Cache-Control` is set per file**: hashed assets under `assets/` get
  `immutable` with a one-year TTL, `index.html` gets `no-cache`, everything else
  a one-day TTL.

A full deploy also prunes — once every upload succeeds, bucket keys that no
longer exist in `dist/` are deleted. Passing specific filenames
(`npm run deploy -- index.html`) uploads only those and never prunes.

The target bucket isn't hardcoded anywhere in this repo — set `S3_BUCKET` (in
your local `.env`, or exported in your shell) or pass `--bucket <name>`
explicitly. See `.env.example` for the full set of variables, and
`scripts/deploy.mjs`'s header comment for the full flag list.

## License

[MIT](LICENSE).
