import { useEffect } from 'react';

import { useLanguage } from '@/i18n';
import { audio } from '@/services/audio';
import { loadSettings } from '@/services/settings';

/**
 * Invisible component that connects the audio service to the rest of the
 * app: starts it once, applies the parent's sound settings, starts the
 * background music and keeps the voice language in sync.
 */
export function AudioBridge() {
  const { language } = useLanguage();

  useEffect(() => {
    audio.setLanguage(language);
  }, [language]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await audio.init();
      const settings = await loadSettings();
      if (cancelled) return;
      audio.setSfxEnabled(settings.sfxEnabled);
      audio.setMusicEnabled(settings.musicEnabled);
      audio.startMusic();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
