import { useCallback } from 'react';

import { useLanguage } from './LanguageProvider';
import type { Dictionary, TranslationKey, TranslationParams } from './types';

/** Looks up a dotted key ('ui.play') in a dictionary and fills {placeholders}. */
export function translate(
  dictionary: Dictionary,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  let node: unknown = dictionary;
  for (const part of key.split('.')) {
    node = (node as Record<string, unknown> | undefined)?.[part];
  }
  if (typeof node !== 'string') {
    // Only reachable if the dictionaries and types drift apart; show the key instead of crashing.
    console.warn(`[i18n] missing translation for "${key}"`);
    return key;
  }
  if (!params) return node;
  return node.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/**
 * const { t, language } = useTranslation();
 * <Text>{t('ui.play')}</Text>
 */
export function useTranslation() {
  const { dictionary, language, definition } = useLanguage();
  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(dictionary, key, params),
    [dictionary],
  );
  return { t, language, speechLocale: definition.speechLocale };
}
