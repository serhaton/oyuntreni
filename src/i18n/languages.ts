import { en } from './en';
import { tr } from './tr';
import type { LanguageDefinition } from './types';

/**
 * Registry of supported languages.
 *
 * To add a new language (e.g. German):
 *   1. Create `src/i18n/de.ts` typed as `Dictionary`.
 *   2. Add a `de` entry here.
 *   3. Add its letter data file (`src/data/letters.de.ts`, coming in stage 6).
 * Everything else (language button, speech, persistence) picks it up automatically.
 */
export const LANGUAGES = {
  tr: { dictionary: tr, speechLocale: 'tr-TR', flag: 'tr' },
  en: { dictionary: en, speechLocale: 'en-US', flag: 'us' },
} as const satisfies Record<string, LanguageDefinition>;

export type LanguageCode = keyof typeof LANGUAGES;

/** Order in which the language button cycles through languages. */
export const LANGUAGE_CODES = Object.keys(LANGUAGES) as LanguageCode[];

/** Used if the device language isn't one we support. */
export const FALLBACK_LANGUAGE: LanguageCode = 'en';

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === 'string' && value in LANGUAGES;
}
