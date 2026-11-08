import { useCallback } from 'react';

import { useTranslation, type TranslationKey, type TranslationParams } from '@/i18n';
import { audio } from '@/services/audio';

/**
 * Speak a translated sentence in the current language:
 *   const say = useSay();
 *   say('speech.tryAgain');
 *   say('speech.traceLetter', { letter: 'A' });
 *
 * The translation key doubles as the recorded-clip id (plus params), so a
 * real voice recording added later is picked up automatically.
 */
export function useSay() {
  const { t, language } = useTranslation();
  return useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      const clipId = params ? `${key}|${Object.values(params).join('|')}` : key;
      return audio.say(t(key, params), { clipId, language });
    },
    [t, language],
  );
}
