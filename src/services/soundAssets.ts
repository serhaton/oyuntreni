/**
 * Every sound file the game uses, by id. This is the ONLY place that knows
 * file paths: to swap a placeholder for a real recording, drop the new file
 * into assets/sounds/ and update the matching line here (e.g. if the new
 * file is .mp3 instead of .wav). See assets/sounds/README.md.
 *
 * Metro needs static require() calls, which is why this is a literal table.
 */
export const SOUND_ASSETS = {
  // UI / effects
  pop: require('../../assets/sounds/sfx/pop.wav'),
  boing: require('../../assets/sounds/sfx/boing.wav'),
  giggle: require('../../assets/sounds/sfx/giggle.wav'),
  rustle: require('../../assets/sounds/sfx/rustle.wav'),
  sparkle: require('../../assets/sounds/sfx/sparkle.wav'),
  applause: require('../../assets/sounds/sfx/applause.wav'),
  softTryAgain: require('../../assets/sounds/sfx/soft-try-again.wav'),
  whoosh: require('../../assets/sounds/sfx/whoosh.wav'),
  confetti: require('../../assets/sounds/sfx/confetti.wav'),
  sticker: require('../../assets/sounds/sfx/sticker.wav'),

  // Train
  whistle: require('../../assets/sounds/train/whistle.wav'),
  chug: require('../../assets/sounds/train/chug.wav'),

  // Animals
  cat: require('../../assets/sounds/animals/cat.wav'),
  dog: require('../../assets/sounds/animals/dog.wav'),
  cow: require('../../assets/sounds/animals/cow.wav'),
  duck: require('../../assets/sounds/animals/duck.wav'),
  monkey: require('../../assets/sounds/animals/monkey.wav'),
  bee: require('../../assets/sounds/animals/bee.wav'),
  rabbit: require('../../assets/sounds/animals/rabbit.wav'),
  ant: require('../../assets/sounds/animals/ant.wav'),
  chick: require('../../assets/sounds/animals/chick.wav'),
  donkey: require('../../assets/sounds/animals/donkey.wav'),
  elephant: require('../../assets/sounds/animals/elephant.wav'),
  frog: require('../../assets/sounds/animals/frog.wav'),
  rooster: require('../../assets/sounds/animals/rooster.wav'),
  roar: require('../../assets/sounds/animals/roar.wav'),
  horse: require('../../assets/sounds/animals/horse.wav'),
  sheep: require('../../assets/sounds/animals/sheep.wav'),
  dolphin: require('../../assets/sounds/animals/dolphin.wav'),
  whale: require('../../assets/sounds/animals/whale.wav'),

  // Toys
  xylophone: require('../../assets/sounds/toys/xylophone.wav'),
  drum: require('../../assets/sounds/toys/drum.wav'),
  robot: require('../../assets/sounds/toys/robot.wav'),

  // Vehicles
  shipHorn: require('../../assets/sounds/vehicles/ship-horn.wav'),
  carHorn: require('../../assets/sounds/vehicles/car-horn.wav'),
  airplane: require('../../assets/sounds/vehicles/airplane.wav'),
  fireTruck: require('../../assets/sounds/vehicles/fire-truck.wav'),
} as const;

export type SoundId = keyof typeof SOUND_ASSETS;

export const MUSIC_ASSETS = {
  theme: require('../../assets/sounds/music/theme-loop.wav'),
} as const;

export type MusicId = keyof typeof MUSIC_ASSETS;

/**
 * Recorded voice clips, per language, by clip id (e.g. 'letter.K').
 * Empty for now: everything is spoken with on-device text-to-speech. When a
 * recording exists for a clip, the audio service plays it instead of TTS.
 * Example:  tr: { 'speech.welcome': require('../../assets/voice/tr/welcome.m4a') }
 */
export const VOICE_CLIPS: Record<string, Record<string, number>> = {
  tr: {},
  en: {},
};
