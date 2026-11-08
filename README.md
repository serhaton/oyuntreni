# Oyun Treni / Play Train

A bilingual (Turkish + English) educational iOS game for 4–5 year olds. A friendly
train travels from station to station; at each one the child traces a letter or
number, counts toys onto the train, or finds the animal or vehicle that makes a
sound. Passengers board the train, full trains are celebrated, and every
passenger becomes a sticker in the album.

No ads, no in-app purchases, no links out, no data collection. Works fully offline.

## Run it

```sh
npm install
npx expo start          # then scan the QR code with Expo Go (iPhone / iPad)
```

- iOS only, landscape. On an **iPad in Expo Go**, rotate the device yourself:
  Expo Go supports iPad multitasking, so it can't lock the orientation. A real
  build (`requireFullScreen` + landscape in `app.json`) is landscape-locked.
- On the simulator: `npx expo start`, then press `i`.

## Checks

```sh
npm test               # data + i18n + tracing checks (run after changing content)
npx tsc --noEmit       # types
npx eslint app src scripts
```

- `test:data` — alphabets, example words, glyphs, catalog, quizzes, translations.
- `test:i18n` — no user-facing text hard-coded outside `src/i18n`.
- `test:tracing` — simulates thousands of finger traces (good, wobbly, wrong
  direction, too short...) against every letter and number, on phone and tablet sizes.

Helpers: `npm run glyphs:preview -- out.svg` (draw all letter strokes),
`npm run sounds:generate` (placeholder sounds), `npm run icon:generate` (app icon).

Dev-only previews: `/celebration?demo=1`, `/parents?unlocked=1`.

## Project layout

```
app/                 screens (expo-router): home, map/ (category menu + lines),
                     station/[id], celebration, album, parents
src/stations/        one module per station type: letter, number, animal, vehicle
                     (+ choice/ shared by the quizzes); registered in stations/index.tsx
src/data/            content: glyphs (stroke data), letters/ (per language),
                     numbers, quizzes, catalog (all passengers), categories, scenery
src/i18n/            tr.ts / en.ts dictionaries, language registry and provider
src/services/        audio (sfx, music, TTS behind one API), progress, settings, haptics
src/components/      Train, TracingCanvas, Sprite, ParallaxBackground, scenery, art/...
src/hooks/           useDeviceLayout (the one phone/tablet switch), useTracing, ...
src/config/          tracing difficulty (tolerances, all in one place)
assets/sounds/       sound files + README listing what's needed
scripts/             tests, previews and generators
```

## Adding content

- **A passenger**: add it to `src/data/catalog.ts` and its name to every
  dictionary under `catalog`; optional Skia drawing in `src/components/art/characters`.
- **A letter word**: edit `src/data/letters/letters.<lang>.ts`.
- **A number**: add digit glyphs (if new) and an entry in `src/data/numbers.ts`.
- **An animal / vehicle question**: `src/data/quizzes.ts`.
- **A language**: a new dictionary in `src/i18n`, an entry in `src/i18n/languages.ts`,
  a letters file in `src/data/letters/`, and its alphabet in `scripts/validate-data.ts`.
  `npm test` and TypeScript point out anything missing.
- **A station type**: a module in `src/stations/`, its variant in `src/stations/types.ts`,
  stations in `src/data/stations.ts`, a category card in `src/data/categories.ts`.

## Sounds

All sounds are synthesized placeholders for now. Replace them with royalty-free
recordings using the same file names — see `assets/sounds/README.md`. Voice-over
uses on-device text-to-speech (tr-TR / en-US); recorded clips can be dropped in
via `VOICE_CLIPS` in `src/services/soundAssets.ts`.

## Full version (in-app purchase)

Free: letters up to **F** (upper and lower case, per language) and numbers **1–10**.
Everything else, including the animal and vehicle quizzes, needs the one-time
non-consumable purchase `com.oyuntreni.app.premium` (see `src/config/premium.ts`;
rules in `src/data/access.ts`).

- A child tapping a locked station sees a padlock and hears "ask a grown-up".
  Buying and restoring are only reachable behind the parent gate (`app/unlock.tsx`,
  and the settings screen).
- `src/services/purchases.ts` has two stores. **Expo Go** uses a simulated test
  store: purchases succeed after a short delay, and settings has "Test: lock the
  full version again". **Development and release builds** use StoreKit through
  `expo-iap` (needs `npx expo run:ios` or an EAS build; it does not run in Expo Go).
- The unlocked state is cached on the device, so the game works offline. The App
  Store is checked at start-up and can only turn premium on.

App Store Connect setup: an active Paid Apps agreement (with banking and tax),
an app record for `com.oyuntreni.app`, a **Non-Consumable** product with the ID
above, and a Sandbox tester account for testing real purchases on a device.
