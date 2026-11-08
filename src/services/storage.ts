import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tiny typed JSON wrapper around AsyncStorage. Everything is stored on the
 * device only; nothing is ever sent anywhere.
 *
 * Errors are swallowed on purpose: a storage hiccup must never crash the game
 * for a child. Callers fall back to defaults.
 */
const PREFIX = '@oyun-treni/';

export async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw == null ? null : (JSON.parse(raw) as T);
  } catch (e) {
    console.warn(`[storage] failed to load "${key}"`, e);
    return null;
  }
}

export async function saveJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn(`[storage] failed to save "${key}"`, e);
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch (e) {
    console.warn(`[storage] failed to remove "${key}"`, e);
  }
}
