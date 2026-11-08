import type { CatalogId } from '../catalog';

/** One letter of a language's alphabet, with its example word and passenger. */
export interface LetterEntry {
  /** Uppercase form as written in this language (e.g. 'İ' in Turkish). */
  upper: string;
  /** Lowercase form (e.g. 'i'; Turkish 'I' pairs with 'ı'). */
  lower: string;
  /** Example word, as spoken and shown to the child (e.g. 'Kedi'). */
  word: string;
  /** Who boards the train when this letter is traced (src/data/catalog.ts). */
  passenger: CatalogId;
  /**
   * How text-to-speech should say the letter's name, when saying the bare
   * character sounds wrong (e.g. Turkish 'Ğ' → 'yumuşak ge'). Optional.
   */
  spokenName?: string;
}
