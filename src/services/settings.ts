import type { LanguageCode } from '@/i18n/languages';

import { loadJSON, saveJSON } from './storage';

/**
 * Parent-controlled settings, persisted locally.
 * `language` is null until a choice is made, meaning "follow the device language".
 */
export interface Settings {
  language: LanguageCode | null;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

const KEY = 'settings';

export const DEFAULT_SETTINGS: Settings = {
  language: null,
  musicEnabled: true,
  sfxEnabled: true,
};

export async function loadSettings(): Promise<Settings> {
  const stored = await loadJSON<Partial<Settings>>(KEY);
  // Merge with defaults so newly added settings get sensible values.
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await loadSettings()), ...patch };
  await saveJSON(KEY, next);
  return next;
}
