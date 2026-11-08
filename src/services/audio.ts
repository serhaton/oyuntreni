import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';
import * as Speech from 'expo-speech';
import { AppState, type AppStateStatus } from 'react-native';

import { LANGUAGES, type LanguageCode } from '@/i18n/languages';

import { MUSIC_ASSETS, SOUND_ASSETS, VOICE_CLIPS, type SoundId } from './soundAssets';

/**
 * Audio service: the ONLY place the app plays sounds, music or speech.
 *
 *  - Effects (taps, animals, vehicles): preloaded players, played from the start.
 *  - Music: one looping track, automatically "ducked" (turned down) while
 *    the voice is speaking so instructions are always clear.
 *  - Voice: recorded clip if one exists for (language, clipId), otherwise
 *    on-device text-to-speech (tr-TR / en-US). Components don't care which.
 *
 * Components call e.g. `audio.playSfx('pop')` or `audio.say(text)`.
 * <AudioBridge> keeps language and parent settings in sync.
 */

/** Short effect ids (kept for readability at call sites; same as SoundId). */
export type SfxId = SoundId;

const VOLUME = {
  sfx: 0.9,
  music: 0.35,
  /** Music volume while the voice speaks. */
  musicDucked: 0.08,
} as const;

/** Speech tuned for small children: a bit slower, a bit brighter. */
const SPEECH = { rate: 0.85, pitch: 1.1 } as const;

const DUCK_FADE_MS = 250;

/**
 * By default expo-audio deactivates the iOS audio session ~100 ms after a
 * sound finishes when nothing else is playing. Speech shares that session, so
 * a short effect ending mid-sentence ("pop" just before "Cat is on the
 * train!") cut the sentence off on real devices. Our players keep the session
 * active instead (we mix with other apps, so this doesn't disturb them).
 */
const PLAYER_OPTIONS = { keepAudioSessionActive: true } as const;

// ---------------------------------------------------------------------------
// Voice providers (TTS now; recorded clips when available)
// ---------------------------------------------------------------------------

interface VoiceProvider {
  speak(text: string, language: LanguageCode, clipId?: string): Promise<void>;
  stop(): void;
}

/**
 * Longest a sentence could plausibly take, as a safety net: if the speech
 * engine never reports "done" (it can happen), we still continue and un-duck
 * the music instead of waiting forever.
 */
const maxSpeechMs = (text: string) => 1000 + text.length * 120;

const ttsVoice: VoiceProvider = {
  async speak(text, language) {
    await new Promise<void>((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        clearTimeout(safety);
        resolve();
      };
      const safety = setTimeout(finish, maxSpeechMs(text));
      try {
        Speech.speak(text, {
          // Only the language is given (never a voice id): iOS then uses the
          // voice chosen for that language in Settings > Accessibility >
          // Spoken Content, including a downloaded "Enhanced" one. Passing a
          // voice id makes speak() throw on devices where that voice isn't
          // actually usable.
          language: LANGUAGES[language].speechLocale,
          rate: SPEECH.rate,
          pitch: SPEECH.pitch,
          // Use our audio session so speech follows our "play in silent mode" setting.
          useApplicationAudioSession: true,
          onDone: finish,
          onStopped: finish,
          onError: finish,
        });
      } catch (e) {
        console.warn('[audio] speech failed', e);
        finish();
      }
    });
  },
  stop() {
    Speech.stop().catch(() => {});
  },
};

let clipPlayer: AudioPlayer | null = null;
let clipFinish: (() => void) | null = null;

const clipVoice: VoiceProvider = {
  async speak(_text, language, clipId) {
    const source = clipId ? VOICE_CLIPS[language]?.[clipId] : undefined;
    if (source == null) return;
    clipPlayer ??= createAudioPlayer(null, PLAYER_OPTIONS);
    const player = clipPlayer;
    player.replace(source);
    await new Promise<void>((resolve) => {
      clipFinish = resolve;
      const sub = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
        if (status.didJustFinish) {
          sub.remove();
          clipFinish = null;
          resolve();
        }
      });
      player.play();
    });
  },
  stop() {
    clipPlayer?.pause();
    clipFinish?.();
    clipFinish = null;
  },
};

const hasClip = (language: LanguageCode, clipId?: string) =>
  clipId != null && VOICE_CLIPS[language]?.[clipId] != null;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/**
 * Native players outlive this JS module when it is re-evaluated (Fast Refresh
 * during development). Without cleanup, every re-evaluation started ANOTHER
 * looping music track on top of the old one. So the live players are tracked
 * on globalThis, and leftovers from a previous evaluation are released here.
 */
interface LivePlayers {
  music: AudioPlayer | null;
  sfx: AudioPlayer[];
  appStateSub: { remove: () => void } | null;
}
const g = globalThis as typeof globalThis & { __oyunTreniAudio?: LivePlayers };
if (g.__oyunTreniAudio) {
  const old = g.__oyunTreniAudio;
  try {
    old.music?.pause();
    old.music?.release();
    old.sfx.forEach((p) => p.release());
    old.appStateSub?.remove();
  } catch {
    // Already released: nothing to do.
  }
}
const live: LivePlayers = { music: null, sfx: [], appStateSub: null };
g.__oyunTreniAudio = live;

let initialized = false;
let sfxEnabled = true;
let musicEnabled = true;
let language: LanguageCode = 'en';

/** Up to two players per effect, so quick repeated taps can overlap. */
const sfxPlayers = new Map<SoundId, AudioPlayer[]>();
/** Last start time per effect, to drop accidental double triggers. */
const lastPlayed = new Map<SoundId, number>();
const SFX_MIN_GAP_MS = 80;
let music: AudioPlayer | null = null;
let musicWanted = false;

function newSfxPlayer(id: SoundId): AudioPlayer {
  const player = createAudioPlayer(SOUND_ASSETS[id], PLAYER_OPTIONS);
  // Rewind as soon as a sound ends, so the next play() starts instantly.
  // (Rewinding at play time is async and delays the start; a sound that then
  // begins after a sentence has started cuts the speech off on iOS.)
  player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
    if (status.didJustFinish) player.seekTo(0).catch(() => {});
  });
  live.sfx.push(player);
  return player;
}
let speechToken = 0;
/** The sentence being spoken right now (null when silent). */
let speaking: Promise<void> | null = null;
let fadeTimer: ReturnType<typeof setInterval> | null = null;

function getSfxPlayer(id: SoundId): AudioPlayer {
  let list = sfxPlayers.get(id);
  if (!list) {
    list = [newSfxPlayer(id)];
    sfxPlayers.set(id, list);
  }
  const free = list.find((p) => !p.playing);
  if (free) return free;
  if (list.length < 2) {
    const extra = newSfxPlayer(id);
    list.push(extra);
    return extra;
  }
  return list[0];
}

function fadeMusicTo(target: number) {
  if (!music) return;
  if (fadeTimer) clearInterval(fadeTimer);
  const player = music;
  const steps = 10;
  const from = player.volume;
  let i = 0;
  fadeTimer = setInterval(() => {
    i++;
    player.volume = from + ((target - from) * i) / steps;
    if (i >= steps && fadeTimer) {
      clearInterval(fadeTimer);
      fadeTimer = null;
    }
  }, DUCK_FADE_MS / steps);
}

function onAppStateChange(state: AppStateStatus) {
  if (state === 'active') {
    if (musicWanted && musicEnabled) music?.play();
  } else {
    music?.pause();
    audio.stopSpeech();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Length of a sound in ms (once loaded; a typical length until then). */
function soundDurationMs(id: SoundId): number {
  const seconds = getSfxPlayer(id).duration;
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 1500;
}

/** Plays a sound from the start (dropping repeats within SFX_MIN_GAP_MS). */
function playSound(id: SoundId) {
  const now = Date.now();
  if (now - (lastPlayed.get(id) ?? 0) < SFX_MIN_GAP_MS) return;
  lastPlayed.set(id, now);
  try {
    const player = getSfxPlayer(id);
    player.volume = VOLUME.sfx;
    if (player.currentTime > 0) {
      // Not rewound yet (e.g. the same sound again while it was still
      // playing): rewind FIRST. seekTo is async; calling play() right away on
      // a finished player plays from the end (silence).
      player
        .seekTo(0)
        .then(() => player.play())
        .catch(() => player.play());
    } else {
      player.play();
    }
  } catch (e) {
    console.warn(`[audio] could not play "${id}"`, e);
  }
}

export const audio = {
  /** Call once at startup (done by <AudioBridge>). Safe to call again. */
  async init() {
    if (initialized) return;
    initialized = true;
    try {
      await setAudioModeAsync({
        // Kids can't read: spoken instructions must work even with the silent switch on.
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
      });
    } catch (e) {
      console.warn('[audio] setAudioModeAsync failed', e);
    }
    // Preload every effect so the first tap already has sound.
    (Object.keys(SOUND_ASSETS) as SoundId[]).forEach((id) => getSfxPlayer(id));
    live.appStateSub = AppState.addEventListener('change', onAppStateChange);
  },

  // --- effects ------------------------------------------------------------
  /** Play an effect from the start (no-op if effects are turned off). */
  playSfx(id: SoundId) {
    if (!sfxEnabled) return;
    playSound(id);
  },

  /**
   * Play a sound that IS the question (e.g. "which animal makes this sound?").
   * It plays even with effects turned off — otherwise the quiz can't be played.
   * Returns the sound's length in ms.
   */
  playQuestionSound(id: SoundId): number {
    playSound(id);
    return soundDurationMs(id);
  },

  setSfxEnabled(enabled: boolean) {
    sfxEnabled = enabled;
  },

  // --- music --------------------------------------------------------------
  startMusic() {
    musicWanted = true;
    if (!musicEnabled) return;
    if (!music) {
      music = createAudioPlayer(MUSIC_ASSETS.theme, PLAYER_OPTIONS);
      music.loop = true;
      music.volume = VOLUME.music;
      live.music = music;
    }
    if (music.playing) return; // never start the same track twice
    music.play();
  },

  stopMusic() {
    musicWanted = false;
    music?.pause();
  },

  setMusicEnabled(enabled: boolean) {
    musicEnabled = enabled;
    if (!enabled) music?.pause();
    else if (musicWanted) audio.startMusic();
  },

  // --- voice --------------------------------------------------------------
  /** Language used by `say()` when none is passed (kept in sync by <AudioBridge>). */
  setLanguage(code: LanguageCode) {
    language = code;
  },

  /**
   * Speak a sentence to the child. Interrupts whatever is being said (kids
   * tap a lot; we never want a backlog of sentences). Music ducks meanwhile.
   * Resolves when finished (or interrupted).
   *
   * @param options.clipId  id of a recorded clip to prefer over TTS
   * @param options.language speak in this language instead of the current one
   */
  async say(text: string, options: { clipId?: string; language?: LanguageCode } = {}) {
    const lang = options.language ?? language;
    const token = ++speechToken;
    ttsVoice.stop();
    clipVoice.stop();
    if (musicEnabled) fadeMusicTo(VOLUME.musicDucked);
    const provider = hasClip(lang, options.clipId) ? clipVoice : ttsVoice;
    const current = provider.speak(text, lang, options.clipId);
    speaking = current;
    try {
      await current;
    } finally {
      if (speaking === current) speaking = null;
      // Only the latest sentence restores the music (an interrupted one must not).
      if (token === speechToken && musicEnabled) fadeMusicTo(VOLUME.music);
    }
  },

  /**
   * Resolves when the current sentence has finished (at most `maxMs` later), so
   * a sound can follow it instead of cutting it off.
   */
  async waitForSpeech(maxMs = 3000) {
    if (!speaking) return;
    await Promise.race([speaking, new Promise<void>((resolve) => setTimeout(resolve, maxMs))]);
  },

  stopSpeech() {
    speechToken++;
    ttsVoice.stop();
    clipVoice.stop();
    if (musicEnabled) fadeMusicTo(VOLUME.music);
  },
};
