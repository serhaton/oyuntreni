import type { tr } from './tr';

/** The shape every language dictionary must follow (derived from Turkish). */
export type Dictionary = typeof tr;

/**
 * All valid dotted keys of a dictionary, e.g. 'ui.play' | 'speech.welcome'.
 * Gives autocomplete and compile-time errors for typos in `t('...')`.
 */
type Paths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Paths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = Paths<Dictionary>;

/** Values that can fill {placeholders} in a translation. */
export type TranslationParams = Record<string, string | number>;

/** Identifier of a flag drawing (see components/Flag.tsx). */
export type FlagId = 'tr' | 'us';

export interface LanguageDefinition {
  /** Dictionary with all UI and speech strings. */
  dictionary: Dictionary;
  /** BCP-47 voice locale for text-to-speech, e.g. 'tr-TR'. */
  speechLocale: string;
  /** Flag drawn on the language button. */
  flag: FlagId;
}
