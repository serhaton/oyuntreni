# Sound files

Every sound below currently exists as a **synthesized placeholder** (🟨), made by
`node scripts/generate-placeholder-sounds.mjs`. Replace them with royalty-free
recordings (e.g. CC0) whenever you find good ones.

## How to replace a sound
Easiest: put the recordings in one folder, each named after its id with any
audio extension (`cat.mp3`, `dog.wav`, `roar.m4a`, ...), then run

    npm run sounds:import -- ~/Downloads/oyun-treni-sesler

(needs ffmpeg). It cuts the silence at both ends, shortens to a few seconds with
a fade-out, evens out the loudness, writes mono 44.1 kHz WAV over the
placeholder, lists it in `final.json` (the placeholder generator never
overwrites those) and marks it ✅ below. Run it again any time to swap a sound.

By hand: put the file in the same folder, update its line in
`src/services/soundAssets.ts` if the name or extension changed, and mark it ✅.

Where to find recordings: Pixabay Sounds (free for commercial use, no credit
needed) or anything CC0 / public domain. Keep the license page link for your records.

Tips: pick a clean recording of just the animal (no music, wind or people
talking); the import script takes the first few seconds. The music must loop
seamlessly (WAV loops more cleanly than MP3/AAC).

Status: 🟨 placeholder · ✅ final

## UI / effects (`sfx/`)
| File | Id | Used for | Status |
|---|---|---|---|
| `pop.wav` | `pop` | default tap on any object | 🟨 |
| `boing.wav` | `boing` | clouds, bouncy objects | 🟨 |
| `giggle.wav` | `giggle` | tapping the sun (cute little laugh) | 🟨 |
| `rustle.wav` | `rustle` | tapping a tree (leaves) | 🟨 |
| `sparkle.wav` | `sparkle` | letter glows / star burst | 🟨 |
| `applause.wav` | `applause` | success moments | 🟨 |
| `soft-try-again.wav` | `softTryAgain` | gentle "let's try again" (never negative) | 🟨 |
| `whoosh.wav` | `whoosh` | transitions, item flying into a wagon | 🟨 |
| `confetti.wav` | `confetti` | celebration burst | 🟨 |
| `sticker.wav` | `sticker` | new sticker earned | 🟨 |

## Train (`train/`)
| File | Id | Used for | Status |
|---|---|---|---|
| `whistle.wav` | `whistle` | tap on the train, arriving at a station | 🟨 |
| `chug.wav` | `chug` | "choo choo" when the train speeds up | 🟨 |

## Animals (`animals/`)
| File | Id | Animal | Status |
|---|---|---|---|
| `cat.wav` | `cat` | meow | ✅ |
| `dog.wav` | `dog` | woof | ✅ |
| `cow.wav` | `cow` | moo | ✅ |
| `duck.wav` | `duck` | quack | ✅ |
| `monkey.wav` | `monkey` | ooh-ooh-aah | ✅ |
| `bee.wav` | `bee` | buzz (TR: Arı) | ✅ |
| `rabbit.wav` | `rabbit` | sniff / hop | 🟨 |
| `ant.wav` | `ant` | tiny squeak (EN: Ant) | 🟨 |
| `chick.wav` | `chick` | peep peep | ✅ |
| `donkey.wav` | `donkey` | hee-haw | ✅ |
| `elephant.wav` | `elephant` | trumpet | ✅ |
| `frog.wav` | `frog` | ribbit | ✅ |
| `rooster.wav` | `rooster` | cock-a-doodle-doo | ✅ |
| `roar.wav` | `roar` | friendly roar (lion, tiger, jaguar, bear) | ✅ |
| `horse.wav` | `horse` | neigh (also zebra) | ✅ |
| `sheep.wav` | `sheep` | baa | ✅ |
| `dolphin.wav` | `dolphin` | clicks + whistle (also narwhal) | ✅ |
| `whale.wav` | `whale` | whale song | ✅ |

Passengers without their own sound (giraffe, deer, llama...) play `giggle`;
which sound each passenger uses is set in `src/data/catalog.ts`.

## Toys (`toys/`)
| File | Id | Toy | Status |
|---|---|---|---|
| `xylophone.wav` | `xylophone` | little melody | 🟨 |
| `drum.wav` | `drum` | boom-boom (number stations) | 🟨 |
| `robot.wav` | `robot` | beep-boop (number stations) | 🟨 |

## Vehicles (`vehicles/`)
| File | Id | Vehicle | Status |
|---|---|---|---|
| `car-horn.wav` | `carHorn` | car, bus, van | 🟨 |
| `ship-horn.wav` | `shipHorn` | ferry (Vapur) | 🟨 |
| `airplane.wav` | `airplane` | airplane | 🟨 |
| `fire-truck.wav` | `fireTruck` | fire truck siren | 🟨 |

## Music (`music/`)
| File | Id | Used for | Status |
|---|---|---|---|
| `theme-loop.wav` | `theme` | cheerful soft background loop (auto-ducked during speech) | 🟨 |

## Voice
Voice-over uses on-device text-to-speech (tr-TR / en-US) for now. Recorded
clips can be added per language in `VOICE_CLIPS` (`src/services/soundAssets.ts`),
keyed by the sentence's translation key (e.g. `speech.welcome`); the audio
service then plays the recording instead of TTS automatically.
