#!/usr/bin/env node
/**
 * Imports real sound recordings in place of the synthesized placeholders.
 *
 *   npm run sounds:import -- [folder]        (default: ~/Downloads/oyun-treni-sesler)
 *
 * Name each file after its sound id, with any audio extension:
 *   cat.mp3, dog.wav, cow.m4a, roar.ogg ...   (ids: see src/services/soundAssets.ts)
 *
 * Every file is cleaned up the same way so they all feel alike in the game:
 *  - silence at the start and end is cut (the sound plays right on tap),
 *  - it is shortened to a few seconds with a soft fade-out,
 *  - loudness is evened out (no sound much louder than another, no clipping),
 *  - saved as mono 44.1 kHz WAV over the placeholder, so no code changes.
 * Imported files are listed in assets/sounds/final.json, which the placeholder
 * generator respects (it never overwrites them), and marked ✅ in the README.
 *
 * Needs ffmpeg (brew install ffmpeg).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOUNDS = join(ROOT, 'assets', 'sounds');
const FINAL_LIST = join(SOUNDS, 'final.json');
const AUDIO_EXT = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.oga', '.flac', '.aif', '.aiff', '.caf', '.webm']);

/** Longest a sound may be, in seconds. Kids tap a lot: short is better. */
const DEFAULT_MAX = 2.5;
const MAX_SECONDS = { whale: 4, rooster: 3.5, elephant: 3, donkey: 3, monkey: 3, dolphin: 3, horse: 3, roar: 3 };
/**
 * Target average loudness (dB), matching the game's other sounds (about -6 to
 * -11 dB), and the peak ceiling. Short peaks (a bark's attack) may be squeezed
 * by up to MAX_LIMITING dB by the limiter so the sound still reaches the target.
 */
const TARGET_MEAN = -12;
const PEAK_CEILING = -1;
const MAX_LIMITING = 6;
/** Below this level (relative to the loudest moment) counts as silence when trimming the ends. */
const SILENCE_DB = -50;

const input = resolve(process.argv[2] ?? join(homedir(), 'Downloads', 'oyun-treni-sesler'));

function ffmpeg(args) {
  return execFileSync('ffmpeg', ['-hide_banner', '-nostdin', '-y', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
}
/** Average and peak level in dB (ffmpeg prints them on stderr). */
function analyze(file) {
  const { stderr } = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], {
    encoding: 'utf8',
  });
  const mean = Number(/mean_volume: (-?[\d.]+) dB/.exec(stderr)?.[1]);
  const max = Number(/max_volume: (-?[\d.]+) dB/.exec(stderr)?.[1]);
  return { mean, max };
}
function duration(file) {
  return Number(
    execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim(),
  );
}

// id -> relative path, read from the one table that knows the files.
function soundTable() {
  const src = readFileSync(join(ROOT, 'src', 'services', 'soundAssets.ts'), 'utf8');
  const table = {};
  for (const m of src.matchAll(/^\s*(\w+):\s*require\('\.\.\/\.\.\/assets\/sounds\/([^']+)'\)/gm)) table[m[1]] = m[2];
  return table;
}

function main() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  } catch {
    console.error('ffmpeg not found. Install it with: brew install ffmpeg');
    process.exit(1);
  }
  if (!existsSync(input)) {
    console.error(`Folder not found: ${input}\nPut the recordings there (named cat.mp3, dog.wav, ...) or pass a folder.`);
    process.exit(1);
  }

  const table = soundTable();
  const files = readdirSync(input).filter((f) => AUDIO_EXT.has(extname(f).toLowerCase()));
  const unknown = files.filter((f) => !table[basename(f, extname(f))]);
  const todo = files.filter((f) => table[basename(f, extname(f))]);
  if (todo.length === 0) {
    console.error(`No matching files in ${input}. Name them after a sound id, e.g. cat.mp3.`);
    console.error(`Ids: ${Object.keys(table).join(', ')}`);
    process.exit(1);
  }

  const finals = new Set(existsSync(FINAL_LIST) ? JSON.parse(readFileSync(FINAL_LIST, 'utf8')) : []);
  const work = mkdtempSync(join(tmpdir(), 'oyun-treni-sounds-'));
  console.log(`Importing ${todo.length} sound(s) from ${input}\n`);

  try {
    for (const f of todo) {
      const id = basename(f, extname(f));
      const rel = table[id];
      if (!rel.endsWith('.wav')) {
        console.log(`  skip ${f}: ${rel} is not a .wav slot`);
        continue;
      }
      const src = join(input, f);
      const trimmed = join(work, `${id}-trim.wav`);
      // 1) mono 44.1k, peak raised to 0 dB first (so "silence" is relative to
      //    the recording, even a quiet one), then silence cut at both ends
      //    (the reverse trick trims the tail).
      const pre = -analyze(src).max;
      const silence = `silenceremove=start_periods=1:start_threshold=${SILENCE_DB}dB:start_silence=0.02:detection=peak`;
      ffmpeg(['-i', src, '-ac', '1', '-ar', '44100', '-af', `volume=${pre.toFixed(2)}dB,${silence},areverse,${silence},areverse`, trimmed]);
      const full = duration(trimmed);
      if (!(full > 0.05)) {
        console.log(`  ✗ ${f}: nothing left after trimming silence (is it very quiet?)`);
        continue;
      }
      // 2) shorten, fade, even out loudness.
      const max = MAX_SECONDS[id] ?? DEFAULT_MAX;
      const len = Math.min(full, max);
      const fade = Math.min(0.25, len / 4);
      const level = analyze(trimmed);
      const gain = Math.min(TARGET_MEAN - level.mean, PEAK_CEILING - level.max + MAX_LIMITING);
      const out = join(SOUNDS, rel);
      ffmpeg([
        '-i', trimmed,
        '-af', `atrim=0:${len.toFixed(3)},afade=t=in:d=0.008,afade=t=out:st=${(len - fade).toFixed(3)}:d=${fade.toFixed(3)},volume=${gain.toFixed(2)}dB,alimiter=limit=0.89:level=false`,
        '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', out,
      ]);
      finals.add(rel);
      const cut = full > max ? ` (cut from ${full.toFixed(1)}s)` : '';
      console.log(`  ✓ ${id.padEnd(10)} → ${rel.padEnd(26)} ${len.toFixed(1)}s${cut}, gain ${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }

  writeFileSync(FINAL_LIST, JSON.stringify([...finals].sort(), null, 2) + '\n');

  // Mark the imported files ✅ in the sounds README.
  const readmePath = join(SOUNDS, 'README.md');
  let readme = readFileSync(readmePath, 'utf8');
  for (const rel of finals) {
    const name = basename(rel);
    readme = readme.replace(new RegExp(`^(\\| \`${name.replace('.', '\\.')}\` \\|.*)🟨 \\|$`, 'm'), '$1✅ |');
  }
  writeFileSync(readmePath, readme);

  if (unknown.length) console.log(`\nIgnored (no sound with that id): ${unknown.join(', ')}`);
  console.log('\nDone. Metro reloads the app; listen in the animal quiz.');
}

main();
