/// <reference types="node" />
/**
 * Data sanity checks for letters, words, passengers and translations.
 *
 *   npm run test:data
 *
 * Catches mistakes when adding letters, catalog items or a new language.
 */
import { PREMIUM } from '../src/config/premium';
import { CATALOG, CATALOG_IDS } from '../src/data/catalog';
import { GLYPHS, numberGlyph } from '../src/data/glyphs';
import { LETTERS } from '../src/data/letters';
import { hasCounting, MAX_COUNT, NUMBERS } from '../src/data/numbers';
import { ANIMAL_QUIZ, CHOICE_COUNT, QUIZ_COLORS, VEHICLE_QUIZ, VEHICLE_SOUND_POOL } from '../src/data/quizzes';
import { LANGUAGES, LANGUAGE_CODES } from '../src/i18n/languages';

/** The official alphabet of each language, in order. Add one per new language. */
const ALPHABETS: Record<string, string> = {
  tr: 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ',
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
};

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

for (const lang of LANGUAGE_CODES) {
  const locale = LANGUAGES[lang].speechLocale;
  const letters = LETTERS[lang];
  const alphabet = ALPHABETS[lang];
  if (!alphabet) fail(`[${lang}] no reference alphabet in scripts/validate-data.ts`);
  else {
    const got = letters.map((l) => l.upper).join('');
    if (got !== alphabet) fail(`[${lang}] letters are "${got}", expected "${alphabet}"`);
  }

  for (const l of letters) {
    const tag = `[${lang}] ${l.upper}${l.lower}`;
    if (l.upper.toLocaleLowerCase(locale) !== l.lower) fail(`${tag}: lowercase of "${l.upper}" in ${locale} is not "${l.lower}"`);
    if (!GLYPHS[l.upper]) fail(`${tag}: no tracing glyph for "${l.upper}" in src/data/glyphs.ts`);
    if (!GLYPHS[l.lower]) fail(`${tag}: no tracing glyph for "${l.lower}" in src/data/glyphs.ts`);
    if (!(l.passenger in CATALOG)) fail(`${tag}: passenger "${l.passenger}" is not in src/data/catalog.ts`);
    const word = l.word.toLocaleLowerCase(locale);
    if (!word.includes(l.lower)) fail(`${tag}: word "${l.word}" doesn't contain "${l.lower}"`);
    else if (!word.startsWith(l.lower) && !l.spokenName) {
      fail(`${tag}: word "${l.word}" doesn't start with the letter (add a spokenName if this is intended)`);
    }
  }

  // Freemium: the "free until" letter must exist in every alphabet (else nothing would be free).
  if (!letters.some((l) => l.upper === PREMIUM.freeUntilLetter)) {
    fail(`[${lang}] PREMIUM.freeUntilLetter "${PREMIUM.freeUntilLetter}" is not in this alphabet`);
  }

  // Number stations: every station's number word, and the counting words
  // (1..MAX_COUNT) and toy phrases, must exist in every language.
  const dict = LANGUAGES[lang].dictionary;
  const words = dict.numbers as Record<string, string>;
  const needed = new Set([...Array.from({ length: MAX_COUNT }, (_, i) => i + 1), ...NUMBERS.map((n) => n.value)]);
  for (const n of needed) {
    if (!words[`n${n}`]?.trim()) fail(`[${lang}] numbers.n${n} is missing`);
  }
  for (const entry of NUMBERS) {
    if (!hasCounting(entry)) continue;
    const phrase = (dict.counting as Record<string, { one: string; other: string }>)[entry.toy];
    if (!phrase?.one?.trim() || !phrase?.other?.trim()) fail(`[${lang}] counting.${entry.toy} needs "one" and "other"`);
  }


  // Vehicle color questions need color words and "find the ..." phrases.
  for (const q of VEHICLE_QUIZ) {
    if (q.kind !== 'color') continue;
    if (!(dict.colorNames as Record<string, string>)[q.color]?.trim()) fail(`[${lang}] colorNames.${q.color} is missing`);
    if (!(dict.findObject as Record<string, string>)[q.vehicle]?.trim()) fail(`[${lang}] findObject.${q.vehicle} is missing`);
  }

  const names = LANGUAGES[lang].dictionary.catalog as Record<string, string>;
  for (const id of CATALOG_IDS) {
    if (!names[id]?.trim()) fail(`[${lang}] catalog.${id} has no name in the dictionary`);
  }
}

for (const entry of NUMBERS) {
  if (!numberGlyph(entry.value)) fail(`number ${entry.value}: a digit is missing in src/data/glyphs.ts`);
  if (entry.value < 1) fail(`number ${entry.value}: must be 1 or more`);
  if (entry.value <= MAX_COUNT && !entry.toy) fail(`number ${entry.value}: numbers up to ${MAX_COUNT} need a counting toy`);
  if (entry.toy && !(entry.toy in CATALOG)) fail(`number ${entry.value}: toy "${entry.toy}" is not in the catalog`);
}
// Listen-and-pick stations: every sound question needs a real, distinct sound.
const ownSound = (id: string) => (CATALOG as Record<string, { sound?: string }>)[id]?.sound;
for (const id of ANIMAL_QUIZ) if (!ownSound(id)) fail(`animal quiz: "${id}" has no sound in the catalog`);
if (ANIMAL_QUIZ.length < CHOICE_COUNT) fail(`animal quiz needs at least ${CHOICE_COUNT} animals`);
for (const id of VEHICLE_SOUND_POOL) if (!ownSound(id)) fail(`vehicle sound pool: "${id}" has no sound`);
const poolSounds = VEHICLE_SOUND_POOL.map(ownSound);
if (new Set(poolSounds).size !== poolSounds.length) fail('vehicle sound pool: two vehicles share a sound (they would be indistinguishable)');
if (VEHICLE_SOUND_POOL.length < CHOICE_COUNT) fail(`vehicle sound pool needs at least ${CHOICE_COUNT} vehicles`);
for (const q of VEHICLE_QUIZ) {
  if (q.kind === 'sound' && !VEHICLE_SOUND_POOL.includes(q.vehicle)) fail(`vehicle quiz: "${q.vehicle}" must be in VEHICLE_SOUND_POOL`);
  if (q.kind === 'color' && !(q.color in QUIZ_COLORS)) fail(`vehicle quiz: unknown color "${q.color}"`);
}
if (Object.keys(QUIZ_COLORS).length < CHOICE_COUNT) fail(`QUIZ_COLORS needs at least ${CHOICE_COUNT} colors`);
const values = NUMBERS.map((n) => n.value);
if (new Set(values).size !== values.length) fail('NUMBERS has duplicate values');

if (errors.length) {
  console.log(errors.map((e) => `FAIL  ${e}`).join('\n'));
  console.log(`${errors.length} data problem(s) found.`);
  process.exit(1);
}
console.log(`Data OK: ${LANGUAGE_CODES.map((l) => `${l} ${LETTERS[l].length} letters`).join(', ')}, ${NUMBERS.length} numbers, ${ANIMAL_QUIZ.length} animal + ${VEHICLE_QUIZ.length} vehicle quizzes, ${CATALOG_IDS.length} catalog items.`);
