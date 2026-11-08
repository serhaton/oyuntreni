import { getLocales } from 'expo-localization';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { loadSettings, updateSettings } from '@/services/settings';

import {
  FALLBACK_LANGUAGE,
  LANGUAGE_CODES,
  LANGUAGES,
  isLanguageCode,
  type LanguageCode,
} from './languages';
import type { Dictionary, LanguageDefinition } from './types';

interface LanguageContextValue {
  /** Current language code, e.g. 'tr'. */
  language: LanguageCode;
  /** Full definition of the current language (dictionary, voice, flag). */
  definition: LanguageDefinition;
  dictionary: Dictionary;
  /** Switch to a specific language (persisted). */
  setLanguage: (code: LanguageCode) => void;
  /** Switch to the next language in the list (used by the big flag button). */
  cycleLanguage: () => LanguageCode;
  /** False until the saved language has been loaded from storage. */
  ready: boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Picks the first device language we support, e.g. a Turkish iPhone -> 'tr'. */
function detectDeviceLanguage(): LanguageCode {
  for (const locale of getLocales()) {
    if (isLanguageCode(locale.languageCode)) return locale.languageCode;
  }
  return FALLBACK_LANGUAGE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start with the device language so the very first frame is already correct.
  const [language, setLanguageState] = useState<LanguageCode>(detectDeviceLanguage);
  const [ready, setReady] = useState(false);

  // Then apply the language a parent explicitly chose earlier, if any.
  useEffect(() => {
    let cancelled = false;
    loadSettings().then((settings) => {
      if (cancelled) return;
      if (isLanguageCode(settings.language)) setLanguageState(settings.language);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    void updateSettings({ language: code });
  }, []);

  const cycleLanguage = useCallback(() => {
    const next = LANGUAGE_CODES[(LANGUAGE_CODES.indexOf(language) + 1) % LANGUAGE_CODES.length];
    setLanguage(next);
    return next;
  }, [language, setLanguage]);

  const value = useMemo<LanguageContextValue>(() => {
    const definition: LanguageDefinition = LANGUAGES[language];
    return {
      language,
      definition,
      dictionary: definition.dictionary,
      setLanguage,
      cycleLanguage,
      ready,
    };
  }, [language, setLanguage, cycleLanguage, ready]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
