/**
 * Generates PLACEHOLDER sound effects and music by synthesis, so the game is
 * fully audible before real recordings exist.
 *
 *   node scripts/generate-placeholder-sounds.mjs
 *
 * Writes mono 16-bit WAV files into assets/sounds/<group>/<name>.wav.
 * Replace any file with a real royalty-free recording later (see
 * assets/sounds/README.md). Re-running this script overwrites the files, so
 * only run it again for sounds that are still placeholders.
 */
import { Buffer } from 'node:buffer';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

// ---------- tiny synth toolkit -------------------------------------------

/** Deterministic pseudo-random numbers so regenerated files are identical. */
let seed = 1234567;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;

const buffer = (seconds) => new Float32Array(Math.ceil(seconds * RATE));

/** Adds a tone. freq can be a number or (t, i) => Hz. wave: sine|triangle|square|saw. */
function tone(buf, { start = 0, dur, freq, wave = 'sine', vol = 0.5, attack = 0.005, release = 0.05, harmonics = null }) {
  const s0 = Math.floor(start * RATE);
  const n = Math.floor(dur * RATE);
  let phase = 0;
  for (let i = 0; i < n && s0 + i < buf.length; i++) {
    const t = i / RATE;
    const f = typeof freq === 'function' ? freq(t, i) : freq;
    phase += f / RATE;
    const p = phase % 1;
    let v;
    if (harmonics) {
      v = 0;
      harmonics.forEach((h, k) => (v += h * Math.sin(2 * Math.PI * p * (k + 1))));
    } else if (wave === 'sine') v = Math.sin(2 * Math.PI * p);
    else if (wave === 'triangle') v = 1 - 4 * Math.abs(p - 0.5);
    else if (wave === 'square') v = p < 0.5 ? 0.7 : -0.7;
    else v = 2 * p - 1; // saw
    const env = Math.min(1, t / attack) * Math.min(1, (dur - t) / release);
    buf[s0 + i] += v * vol * Math.max(0, env);
  }
}

/** Adds filtered noise. cutoff (0..1, one-pole lowpass) can be a function of t. */
function hiss(buf, { start = 0, dur, vol = 0.5, cutoff = 0.3, env = null, highpass = false }) {
  const s0 = Math.floor(start * RATE);
  const n = Math.floor(dur * RATE);
  let lp = 0;
  for (let i = 0; i < n && s0 + i < buf.length; i++) {
    const t = i / RATE;
    const c = typeof cutoff === 'function' ? cutoff(t) : cutoff;
    const x = noise();
    lp += c * (x - lp);
    const v = highpass ? x - lp : lp;
    const e = env ? env(t, dur) : Math.min(1, t / 0.005) * Math.min(1, (dur - t) / 0.05);
    buf[s0 + i] += v * vol * Math.max(0, e);
  }
}

const expEnv = (k) => (t, dur) => Math.min(1, t / 0.003) * Math.exp(-k * t) * Math.min(1, (dur - t) / 0.02);

function normalize(buf, peak = 0.8) {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  if (max > 0) for (let i = 0; i < buf.length; i++) buf[i] = (buf[i] / max) * peak;
  return buf;
}

function writeWav(relPath, buf, peak) {
  normalize(buf, peak);
  const data = Buffer.alloc(buf.length * 2);
  buf.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  const file = join(OUT, relPath);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.concat([header, data]));
  console.log(`  ${relPath}  (${(buf.length / RATE).toFixed(2)}s)`);
}

// ---------- effects --------------------------------------------------------
const sounds = {};

sounds['sfx/pop.wav'] = () => {
  const b = buffer(0.12);
  tone(b, { dur: 0.12, freq: (t) => 900 * Math.exp(-14 * t) + 250, vol: 0.9, release: 0.08 });
  return b;
};

sounds['sfx/boing.wav'] = () => {
  const b = buffer(0.55);
  tone(b, { dur: 0.55, freq: (t) => 260 + 160 * Math.sin(2 * Math.PI * 11 * t) * Math.exp(-4 * t) + 120 * t, wave: 'triangle', vol: 0.8, release: 0.25 });
  return b;
};

sounds['sfx/giggle.wav'] = () => {
  const b = buffer(0.75);
  [0, 0.12, 0.24, 0.36, 0.5].forEach((s, k) => {
    const base = 820 - k * 50;
    tone(b, { start: s, dur: 0.09, freq: (t) => base + 120 * Math.sin(2 * Math.PI * 30 * t), harmonics: [1, 0.4, 0.2], vol: 0.7, attack: 0.01, release: 0.04 });
    hiss(b, { start: s, dur: 0.05, vol: 0.08, cutoff: 0.5 });
  });
  return b;
};

sounds['sfx/rustle.wav'] = () => {
  const b = buffer(0.6);
  hiss(b, { dur: 0.6, vol: 0.9, cutoff: 0.6, highpass: true, env: (t, d) => (0.5 + 0.5 * Math.sin(2 * Math.PI * 14 * t)) * Math.sin((Math.PI * t) / d) });
  return b;
};

sounds['sfx/sparkle.wav'] = () => {
  const b = buffer(0.8);
  [1760, 2350, 2960, 3520, 2640].forEach((f, k) => {
    tone(b, { start: k * 0.06, dur: 0.4, freq: f, vol: 0.5, attack: 0.002, release: 0.35 });
  });
  return b;
};

sounds['sfx/applause.wav'] = () => {
  const b = buffer(1.6);
  for (let k = 0; k < 90; k++) {
    const s = rand() * 1.35;
    hiss(b, { start: s, dur: 0.05, vol: 0.25 + rand() * 0.25, cutoff: 0.7, highpass: true, env: expEnv(70) });
  }
  return b;
};

sounds['sfx/soft-try-again.wav'] = () => {
  // A gentle, friendly "hm-hmm?" (rising at the end = encouraging, never "wrong").
  const b = buffer(0.7);
  tone(b, { start: 0, dur: 0.22, freq: 523, wave: 'triangle', vol: 0.5, attack: 0.03, release: 0.08 });
  tone(b, { start: 0.25, dur: 0.4, freq: (t) => 440 + 220 * t * 2.5, wave: 'triangle', vol: 0.5, attack: 0.03, release: 0.15 });
  return b;
};

sounds['sfx/whoosh.wav'] = () => {
  const b = buffer(0.5);
  hiss(b, { dur: 0.5, vol: 1, cutoff: (t) => 0.05 + 0.5 * Math.sin((Math.PI * t) / 0.5), env: (t, d) => Math.sin((Math.PI * t) / d) ** 2 });
  return b;
};

sounds['sfx/confetti.wav'] = () => {
  const b = buffer(1.0);
  for (let k = 0; k < 6; k++) {
    const s = k * 0.07 + rand() * 0.03;
    tone(b, { start: s, dur: 0.1, freq: (t) => (700 + rand() * 300) * Math.exp(-12 * t) + 200, vol: 0.6, release: 0.06 });
  }
  [2093, 2637, 3136].forEach((f, k) => tone(b, { start: 0.35 + k * 0.08, dur: 0.5, freq: f, vol: 0.35, release: 0.45 }));
  return b;
};

sounds['sfx/sticker.wav'] = () => {
  const b = buffer(0.9);
  [523, 659, 784, 1047].forEach((f, k) => tone(b, { start: k * 0.1, dur: 0.45, freq: f, wave: 'triangle', vol: 0.55, release: 0.3 }));
  return b;
};

// ---------- train ----------------------------------------------------------
sounds['train/whistle.wav'] = () => {
  const b = buffer(1.25);
  const toot = (start, dur) => {
    [740, 880, 1109].forEach((f) => tone(b, { start, dur, freq: (t) => f * (1 + 0.004 * Math.sin(2 * Math.PI * 6 * t)), vol: 0.35, attack: 0.04, release: 0.12 }));
    hiss(b, { start, dur, vol: 0.12, cutoff: 0.4 });
  };
  toot(0, 0.28);
  toot(0.38, 0.8);
  return b;
};

sounds['train/chug.wav'] = () => {
  const b = buffer(0.9);
  [0, 0.22, 0.44, 0.66].forEach((s, k) => hiss(b, { start: s, dur: 0.2, vol: k % 2 ? 0.6 : 1, cutoff: 0.12, env: expEnv(14) }));
  return b;
};

// ---------- animals --------------------------------------------------------
sounds['animals/cat.wav'] = () => {
  const b = buffer(0.75);
  tone(b, { dur: 0.75, freq: (t) => 520 + 420 * Math.sin((Math.PI * t) / 0.75) + 15 * Math.sin(2 * Math.PI * 7 * t), harmonics: [1, 0.6, 0.35, 0.2, 0.1], vol: 0.6, attack: 0.05, release: 0.2 });
  return b;
};

sounds['animals/dog.wav'] = () => {
  const b = buffer(0.6);
  [0, 0.3].forEach((s) => {
    tone(b, { start: s, dur: 0.16, freq: (t) => 420 - 900 * t, harmonics: [1, 0.8, 0.5, 0.3], vol: 0.7, attack: 0.01, release: 0.06 });
    hiss(b, { start: s, dur: 0.12, vol: 0.25, cutoff: 0.25, env: expEnv(20) });
  });
  return b;
};

sounds['animals/cow.wav'] = () => {
  const b = buffer(1.3);
  tone(b, { dur: 1.3, freq: (t) => 135 - 18 * t + 3 * Math.sin(2 * Math.PI * 5 * t), harmonics: [1, 0.9, 0.7, 0.5, 0.35, 0.2], vol: 0.6, attack: 0.25, release: 0.35 });
  return b;
};

sounds['animals/duck.wav'] = () => {
  const b = buffer(0.55);
  [0, 0.27].forEach((s) => tone(b, { start: s, dur: 0.18, freq: (t) => 520 - 500 * t, wave: 'square', vol: 0.5, attack: 0.01, release: 0.05 }));
  return b;
};

sounds['animals/monkey.wav'] = () => {
  const b = buffer(1.1);
  [0, 0.22].forEach((s) => tone(b, { start: s, dur: 0.18, freq: (t) => 380 + 1600 * t, harmonics: [1, 0.5, 0.2], vol: 0.6, attack: 0.02, release: 0.05 }));
  tone(b, { start: 0.5, dur: 0.55, freq: (t) => 700 - 200 * t, harmonics: [1, 0.7, 0.4, 0.2], vol: 0.6, attack: 0.03, release: 0.2 });
  return b;
};

sounds['animals/bee.wav'] = () => {
  const b = buffer(1.0);
  tone(b, { dur: 1.0, freq: (t) => 230 + 20 * Math.sin(2 * Math.PI * 3 * t), wave: 'saw', vol: 0.5, attack: 0.1, release: 0.2 });
  return b;
};

sounds['animals/rabbit.wav'] = () => {
  const b = buffer(0.7);
  [0, 0.12, 0.24].forEach((s) => hiss(b, { start: s, dur: 0.07, vol: 0.5, cutoff: 0.6, highpass: true, env: expEnv(40) }));
  tone(b, { start: 0.42, dur: 0.15, freq: (t) => 1400 + 600 * t, vol: 0.4, release: 0.06 });
  return b;
};

sounds['animals/ant.wav'] = () => {
  const b = buffer(0.4);
  [0, 0.15].forEach((s) => tone(b, { start: s, dur: 0.08, freq: (t) => 2200 + 1500 * t, vol: 0.45, release: 0.03 }));
  return b;
};

sounds['animals/chick.wav'] = () => {
  const b = buffer(0.6);
  [0, 0.2, 0.4].forEach((s) => tone(b, { start: s, dur: 0.1, freq: (t) => 3000 - 6000 * t, vol: 0.5, attack: 0.005, release: 0.03 }));
  return b;
};

sounds['animals/donkey.wav'] = () => {
  // "Hee-haw": high wheeze then low honk, twice.
  const b = buffer(1.4);
  [0, 0.7].forEach((s) => {
    tone(b, { start: s, dur: 0.3, freq: (t) => 700 + 300 * t, harmonics: [1, 0.6, 0.4, 0.2], vol: 0.5, attack: 0.03, release: 0.05 });
    tone(b, { start: s + 0.32, dur: 0.33, freq: (t) => 260 - 60 * t, wave: 'saw', vol: 0.5, attack: 0.02, release: 0.08 });
  });
  return b;
};

sounds['animals/elephant.wav'] = () => {
  // Trumpet: brassy rising call.
  const b = buffer(1.1);
  tone(b, { dur: 1.1, freq: (t) => 330 + 260 * Math.min(1, t * 3) + 25 * Math.sin(2 * Math.PI * 9 * t), wave: 'saw', vol: 0.5, attack: 0.04, release: 0.25 });
  hiss(b, { dur: 1.0, vol: 0.12, cutoff: 0.3 });
  return b;
};

sounds['animals/frog.wav'] = () => {
  // "Ribbit ribbit": two croaks made of fast pulses.
  const b = buffer(0.8);
  [0, 0.42].forEach((s) =>
    tone(b, { start: s, dur: 0.22, freq: (t) => 190 + 60 * (Math.sin(2 * Math.PI * 45 * t) > 0 ? 1 : 0), harmonics: [1, 0.7, 0.5, 0.3], vol: 0.6, attack: 0.01, release: 0.05 }),
  );
  return b;
};

sounds['animals/rooster.wav'] = () => {
  // "Cock-a-doodle-doo": four rising/falling notes.
  const b = buffer(1.5);
  [
    [0, 0.14, 600, 700],
    [0.17, 0.14, 750, 850],
    [0.34, 0.16, 900, 950],
    [0.53, 0.8, 1000, 700],
  ].forEach(([s, d, f0, f1]) =>
    tone(b, { start: s, dur: d, freq: (t) => f0 + ((f1 - f0) * t) / d, harmonics: [1, 0.5, 0.3, 0.15], vol: 0.55, attack: 0.02, release: 0.06 }),
  );
  return b;
};

sounds['animals/roar.wav'] = () => {
  // Friendly cartoon roar (lion, tiger, jaguar, bear).
  const b = buffer(1.1);
  tone(b, { dur: 1.1, freq: (t) => 150 + 60 * Math.sin(Math.PI * t) + 8 * Math.sin(2 * Math.PI * 30 * t), wave: 'saw', vol: 0.5, attack: 0.1, release: 0.3 });
  hiss(b, { dur: 1.1, vol: 0.35, cutoff: 0.12, env: (t, d) => Math.sin((Math.PI * t) / d) });
  return b;
};

sounds['animals/horse.wav'] = () => {
  // Neigh: wobbly falling whinny.
  const b = buffer(1.1);
  tone(b, { dur: 1.1, freq: (t) => 900 - 450 * t + 60 * Math.sin(2 * Math.PI * 14 * t), harmonics: [1, 0.6, 0.3, 0.15], vol: 0.55, attack: 0.03, release: 0.25 });
  return b;
};

sounds['animals/sheep.wav'] = () => {
  // "Baa": bleat with a fast vibrato.
  const b = buffer(0.9);
  tone(b, { dur: 0.9, freq: (t) => 420 + 40 * Math.sin(2 * Math.PI * 22 * t), harmonics: [1, 0.8, 0.6, 0.4, 0.2], vol: 0.55, attack: 0.04, release: 0.25 });
  return b;
};

sounds['animals/dolphin.wav'] = () => {
  // Clicks and a happy whistle.
  const b = buffer(1.0);
  for (let k = 0; k < 6; k++) hiss(b, { start: k * 0.05, dur: 0.02, vol: 0.5, cutoff: 0.8, highpass: true, env: expEnv(200) });
  tone(b, { start: 0.35, dur: 0.6, freq: (t) => 2200 + 1200 * Math.sin(Math.PI * t * 1.6), vol: 0.45, attack: 0.02, release: 0.15 });
  return b;
};

sounds['animals/whale.wav'] = () => {
  // Long, gentle whale song.
  const b = buffer(1.8);
  tone(b, { dur: 1.8, freq: (t) => 220 + 120 * Math.sin(Math.PI * t / 1.8) + 10 * Math.sin(2 * Math.PI * 3 * t), harmonics: [1, 0.3], vol: 0.55, attack: 0.3, release: 0.5 });
  return b;
};

// ---------- toys -----------------------------------------------------------
sounds['toys/xylophone.wav'] = () => {
  const b = buffer(1.2);
  [784, 880, 988, 1175, 1319].forEach((f, k) =>
    tone(b, { start: k * 0.12, dur: 0.55, freq: f, harmonics: [1, 0, 0.3, 0, 0.1], vol: 0.5, attack: 0.002, release: 0.5 }),
  );
  return b;
};

sounds['toys/drum.wav'] = () => {
  // Boom-boom-ba-boom.
  const b = buffer(1.0);
  [0, 0.22, 0.44, 0.55].forEach((s, k) => {
    tone(b, { start: s, dur: 0.25, freq: (t) => 140 * Math.exp(-6 * t) + 55, vol: k === 2 ? 0.5 : 0.8, attack: 0.002, release: 0.15 });
    hiss(b, { start: s, dur: 0.06, vol: 0.2, cutoff: 0.3, env: expEnv(60) });
  });
  return b;
};

sounds['toys/robot.wav'] = () => {
  // Beep-boop-beep.
  const b = buffer(0.8);
  [
    [0, 880],
    [0.18, 660],
    [0.36, 990],
    [0.5, 1320],
  ].forEach(([s, f]) => tone(b, { start: s, dur: 0.12, freq: f, wave: 'square', vol: 0.35, attack: 0.005, release: 0.02 }));
  return b;
};

// ---------- vehicles -------------------------------------------------------
sounds['vehicles/ship-horn.wav'] = () => {
  const b = buffer(1.6);
  [98, 147].forEach((f) => tone(b, { dur: 1.5, freq: f, wave: 'saw', vol: 0.4, attack: 0.08, release: 0.3 }));
  return b;
};

sounds['vehicles/car-horn.wav'] = () => {
  const b = buffer(0.75);
  [0, 0.4].forEach((s) => {
    tone(b, { start: s, dur: 0.28, freq: 392, wave: 'square', vol: 0.4, release: 0.03 });
    tone(b, { start: s, dur: 0.28, freq: 494, wave: 'square', vol: 0.4, release: 0.03 });
  });
  return b;
};

sounds['vehicles/airplane.wav'] = () => {
  const b = buffer(2.0);
  hiss(b, { dur: 2.0, vol: 1, cutoff: (t) => 0.04 + 0.12 * (t / 2), env: (t, d) => Math.sin((Math.PI * t) / d) });
  tone(b, { dur: 2.0, freq: (t) => 90 + 40 * (t / 2), harmonics: [1, 0.5, 0.25], vol: 0.25, attack: 0.5, release: 0.6 });
  return b;
};

sounds['vehicles/fire-truck.wav'] = () => {
  const b = buffer(2.0);
  tone(b, { dur: 2.0, freq: (t) => 760 + 190 * Math.sin(2 * Math.PI * 1.5 * t), harmonics: [1, 0.35, 0.15], vol: 0.6, attack: 0.08, release: 0.2 });
  return b;
};

// ---------- music ----------------------------------------------------------
sounds['music/theme-loop.wav'] = () => {
  // Cheerful, soft 8-bar loop at 112 BPM in C major. The loop length is an
  // exact number of beats, so it repeats seamlessly.
  const bpm = 112;
  const beat = 60 / bpm;
  const bars = 8;
  const b = buffer(bars * 4 * beat);
  const midi = (n) => 440 * 2 ** ((n - 69) / 12);
  // Chords per bar (root notes): C G Am F | C G F C
  const roots = [48, 43, 45, 41, 48, 43, 41, 48];
  const triads = { 48: [60, 64, 67], 43: [59, 62, 67], 45: [60, 64, 69], 41: [60, 65, 69] };
  // Melody: [beat offset within the loop, MIDI note, length in beats]
  const melody = [
    [0, 72, 1], [1, 76, 1], [2, 79, 1.5], [3.5, 76, 0.5],
    [4, 74, 1], [5, 71, 1], [6, 74, 2],
    [8, 72, 1], [9, 76, 1], [10, 81, 1.5], [11.5, 79, 0.5],
    [12, 77, 1], [13, 76, 1], [14, 74, 2],
    [16, 72, 1], [17, 76, 1], [18, 79, 1.5], [19.5, 81, 0.5],
    [20, 79, 1], [21, 76, 1], [22, 74, 2],
    [24, 77, 1], [25, 76, 1], [26, 74, 1], [27, 71, 1],
    [28, 72, 3],
  ];
  roots.forEach((r, bar) => {
    const s = bar * 4 * beat;
    // Bass on beats 1 and 3, soft chord stabs on 2 and 4.
    tone(b, { start: s, dur: beat * 1.8, freq: midi(r - 12 + 12), wave: 'sine', vol: 0.35, attack: 0.01, release: 0.2 });
    tone(b, { start: s + 2 * beat, dur: beat * 1.8, freq: midi(r + 7), wave: 'sine', vol: 0.25, attack: 0.01, release: 0.2 });
    [1, 3].forEach((bt) =>
      triads[r].forEach((n) => tone(b, { start: s + bt * beat, dur: beat * 0.6, freq: midi(n), wave: 'triangle', vol: 0.07, attack: 0.01, release: 0.2 })),
    );
    // Gentle shaker on every off-beat.
    for (let k = 0; k < 4; k++) hiss(b, { start: s + (k + 0.5) * beat, dur: 0.06, vol: 0.05, cutoff: 0.8, highpass: true, env: expEnv(60) });
  });
  melody.forEach(([at, n, len]) =>
    tone(b, { start: at * beat, dur: len * beat * 0.92, freq: (t) => midi(n) * (1 + 0.003 * Math.sin(2 * Math.PI * 5 * t)), wave: 'triangle', vol: 0.28, attack: 0.015, release: 0.12 }),
  );
  return b;
};

// ---------- write ----------------------------------------------------------
console.log('Generating placeholder sounds into assets/sounds/ ...');
// Real recordings (imported with `npm run sounds:import`) are never overwritten.
const finalList = join(OUT, 'final.json');
const finals = new Set(existsSync(finalList) ? JSON.parse(readFileSync(finalList, 'utf8')) : []);
for (const [path, make] of Object.entries(sounds)) {
  if (finals.has(path)) {
    console.log(`  ${path}  (real recording, kept)`);
    continue;
  }
  writeWav(path, make(), path.startsWith('music/') ? 0.6 : 0.85);
}
console.log('Done.');
