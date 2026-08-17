# Firebase setup

The leaderboard (`src/net/leaderboard.js`) needs a Firebase project with
Firestore and Anonymous Authentication. This walks through setting one up
from scratch, and locking it down the way this project expects.

## 1. Create the project and enable services

1. [Firebase Console](https://console.firebase.google.com) → **Add project**.
2. **Build → Firestore Database → Create database** (production mode is fine —
   access is controlled by rules, see step 4).
3. **Build → Authentication → Sign-in method → Anonymous → Enable**. This is
   the only auth method the app uses — `signInAnonymously()` runs on every
   page load so `request.auth != null` is true for reads/writes without any
   login UI.

## 2. Register a web app, get the config

**Project settings → General → Your apps → Add app → Web**. Firebase gives
you a config object:

```js
{
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
  measurementId: "...",
}
```

Copy `.env.example` to `.env` and fill each `VITE_FIREBASE_*` variable in
from this object. `VITE_LEADERBOARD_NAMESPACE` isn't a Firebase value — it's
just the path segment the leaderboard collection lives under
(`artifacts/{namespace}/public/data/leaderboard`); any string works, it
just needs to match between environments if you ever have more than one.

These config values are meant to be public — Firebase ships them in every
web app's bundle by design, and they don't grant access on their own. What
actually gates access is step 3 (which APIs/sites the key can be used from)
and step 4 (what Firestore allows once someone's using it).

## 3. Restrict the API key

**Without this, the key can be copy-pasted into any other site or used
against any other API enabled on the same Google Cloud project.**
[Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) →
open the key named **"Browser key (auto created by Firebase)"**:

- **Application restrictions → HTTP referrers (web sites)**, add:

  ```
  https://cat.nikita.sh/*
  https://nikita.sh/*
  http://localhost:5173/*
  ```

  The third one is for local dev (`npm run dev`'s default port — adjust if
  yours differs). Without it, the leaderboard just silently no-ops locally;
  it doesn't break anything else, since `initLeaderboard()` catches init
  failures. Add it only if you want the leaderboard testable locally.

- **API restrictions → Restrict key**, select:
  - Identity Toolkit API
  - Token Service API
  - Cloud Firestore API (if it's not in the list, confirm it's enabled
    under APIs & Services → Library first — Firebase usually enables it
    automatically when you turn on Firestore in step 1)

If you ever need to rotate this key (e.g. an old value leaked into git
history), re-adding a web app in the _same_ project reuses the same
`apiKey` — it's scoped to the project, not the individual app registration.
To get an actually different value, use **Regenerate Key** on this same
credential instead.

## 4. Deploy the Firestore security rules

Paste [`firestore.rules`](../firestore.rules) into **Firestore Database →
Rules** and **Publish**. This project has no Firebase CLI project linked
(no `firebase.json`/`.firebaserc`), so there's no `firebase deploy` — the
Console is the only way to apply it right now. See that file's comments for
what it actually validates (name length, positive time, append-only, etc.).

## 5. Verify

```bash
npm run dev
```

Play through, check the leaderboard section on the start screen loads
(shows "No records yet" on a fresh project, not a network-error message).
Finish a run and confirm your score appears. If the leaderboard silently
shows nothing and stays on "Loading...", check the browser console — a
referrer-restriction or rules mismatch usually shows up there as a
Firestore permission error.
