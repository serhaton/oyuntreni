This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `app/` at the project root (NOT `src/app/` — never create `src/app/`, Expo Router would switch to it). Non-route code lives in `src/` (components, stations, data, i18n, services, theme, hooks) and is imported via the `@/` alias.
- iOS only, landscape, iPhone + iPad, must run in Expo Go (no custom native modules).
- No hard-coded user-facing strings: everything goes through `src/i18n` (`t('...')`). Phone/tablet decisions only via `useDeviceLayout`.
- Tracing rules live in `src/utils/tracingJudge.ts` (pure worklets), difficulty in `src/config/tracing.ts`. Run `npm test` (data + tracing checks) after changing glyphs, letters, catalog or translations; `npm run glyphs:preview` renders all glyphs to an SVG for a visual check.
- Content is data-driven: letters per language in `src/data/letters/`, passengers in `src/data/catalog.ts` (names in i18n `catalog.*`), Skia character art registered in `src/components/art/characters/index.ts` (missing art falls back to emoji). Station types are modules in `src/stations/` registered in `src/stations/index.tsx`.
- Skia 2.14: build paths with `Skia.PathBuilder.Make()...build()` (`SkPath` is immutable). Reanimated 4: write shared values with `.set()` (lint rule).
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
