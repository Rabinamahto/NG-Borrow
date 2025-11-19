Local Firebase Emulator setup

1) Prereqs
- Node.js and npm installed
- `firebase-tools` installed globally (you already ran `npm install -g firebase-tools`)

2) Start emulators
From project root run:

```bash
npm run emulators:start
```

This will start Auth (9099), Firestore (8080), Storage (9199) and Emulator UI (4000).

3) Start dev server
In a separate terminal run:

```bash
npm run dev
```

4) App behaviour
- `src/firebase.js` connects the client to the emulators when `NODE_ENV !== 'production'`.
- Posts/uploads will use local emulators (no billing required).

5) Emulator UI
Open http://127.0.0.1:4000 to view emulator UI (auth users, firestore data, storage files).

6) Notes
- If you need persistent emulator data, use `firebase emulators:start --export-on-exit ./emulator-data` and `--import=./emulator-data` options.
- The emulator suite is only for development and local testing; don't use it in production.
