import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';

/**
 * Fonts are bundled with the app (no network needed). Fredoka is round and
 * friendly and covers the Turkish letters (Ç Ğ İ Ö Ş Ü).
 */
export const fontAssets = {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
};

export const fonts = {
  regular: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
} as const;

/** Base font sizes in design points (scale with `s()`). */
export const fontSizes = {
  sm: 16,
  md: 22,
  lg: 32,
  xl: 48,
  title: 64,
} as const;
