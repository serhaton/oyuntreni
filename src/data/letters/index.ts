import type { LanguageCode } from '@/i18n/languages';

import { LETTERS_EN } from './letters.en';
import { LETTERS_TR } from './letters.tr';
import type { LetterEntry } from './types';

export type { LetterEntry } from './types';

/**
 * Alphabet per language. TypeScript requires an entry for every language in
 * src/i18n/languages.ts, so a new language can't be forgotten here.
 */
export const LETTERS: Record<LanguageCode, LetterEntry[]> = {
  tr: LETTERS_TR,
  en: LETTERS_EN,
};

/** Index of the letter inside the word, for highlighting (e.g. 'ğ' in 'Kurbağa'). */
export function letterIndexInWord(entry: LetterEntry, locale: string): number {
  const word = entry.word.toLocaleLowerCase(locale);
  return word.indexOf(entry.lower.toLocaleLowerCase(locale));
}
