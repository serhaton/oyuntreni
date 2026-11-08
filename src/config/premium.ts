/**
 * Freemium rules, all in one place.
 *
 * One non-consumable in-app purchase ("full game") unlocks everything.
 * Without it, only the stations below are playable. The product must be
 * created with exactly this id in App Store Connect.
 */
export const PREMIUM = {
  /** App Store Connect product id (Non-Consumable). */
  productId: 'com.oyuntreni.app.premium',
  /** Letters up to and including this one are free (per language's alphabet, e.g. TR: A B C Ç D E F). */
  freeUntilLetter: 'F',
  /** Numbers up to and including this one are free. */
  freeUntilNumber: 10,
} as const;
