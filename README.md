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

A small browser platformer in vanilla JS and the Canvas 2D API — no game
engine. Playable standalone or embedded as an iframe "app" inside
[nikita.sh](https://github.com/thatguynikita/nikita.sh)'s terminal-themed
portfolio.

- Collect 30 cans of condensed milk, dodge dogs and cacti, race to the flag
- Russian and English, switchable from the menu
- Pause menu and on-screen touch controls for mobile
- Weekly leaderboard, backed by Firebase

## Stack

Vite, Tailwind CSS v4 for the menus and HUD, Tone.js for the chiptune audio,
Firebase (Firestore + anonymous Auth) for the leaderboard. Vitest, ESLint and
Prettier for checks.

## Architecture

| Path                                  | What's there                                             |
| ------------------------------------- | -------------------------------------------------------- |
| `index.html`                          | DOM skeleton: canvas, menus, touch controls              |
| `src/main.js`                         | Game loop, input handling, wiring — the composition root |
| `src/state.js`                        | Shared runtime state (game phase, camera, keys, timers)  |
| `src/config.js`                       | Gameplay constants (physics, level generation, timers)   |
| `src/entities/`                       | One file per game object                                 |
| `src/level/`                          | Procedural level generation, rendering, collision        |
| `src/render/`, `src/ui/`              | Per-frame drawing; HUD, menus, touch controls            |
| `src/i18n/`, `src/audio/`, `src/net/` | RU/EN copy, Tone.js synths, Firebase leaderboard         |
| `tests/`                              | Vitest unit tests                                        |

## Local development

```bash
npm install
cp .env.example .env   # Firebase config — see below
npm run dev
```

The leaderboard needs a Firebase project with Firestore and Anonymous Auth.
The config values are the public Web SDK kind — access is enforced by
Firestore rules, not by secrecy — but they live in `.env` so they aren't
committed. Without them the game runs fine; the leaderboard is just disabled.
Setup from scratch: [`docs/FIREBASE-SETUP.md`](docs/FIREBASE-SETUP.md).

## Scripts

| Command                           | What it does                                      |
| --------------------------------- | ------------------------------------------------- |
| `npm run dev`                     | Vite dev server                                   |
| `npm run build`                   | Production build to `dist/`                       |
| `npm run preview`                 | Serve `dist/` locally                             |
| `npm run lint` / `npm run format` | ESLint / Prettier                                 |
| `npm run test`                    | Vitest                                            |
| `npm run deploy`                  | Build and upload `dist/` to S3-compatible storage |

## Deploy

### S3 / Yandex Object Storage

```bash
npm run deploy -- --dry-run   # preview, no network calls
npm run deploy                 # build + upload
```

Needs the AWS CLI, plus `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION` and AWS
credentials in `.env` (see `.env.example`). AWS S3 and Yandex differ only by
endpoint — leave `S3_ENDPOINT` blank for AWS. A full deploy also removes
bucket files no longer in `dist/`; passing filenames
(`npm run deploy -- index.html`) uploads just those.

### Cloudflare Pages

No CLI — Cloudflare builds from the repo. **Workers & Pages → Create
application → Connect with GitHub**, then:

| field          | value                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Project name   | `condensed-milk-quest` (must match `name` in `wrangler.json`)              |
| Build command  | `npm run build`                                                            |
| Deploy command | `npx wrangler deploy`                                                      |
| Variables      | the `VITE_*` values from `.env.example`, or the leaderboard stays disabled |

`public/_headers` sets the same cache headers as the S3 deploy. The site is at
`condensed-milk-quest.<account>.workers.dev` until you attach a domain.

## License

[MIT](LICENSE).
