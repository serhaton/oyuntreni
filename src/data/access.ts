import { PREMIUM } from '@/config/premium';
import type { LanguageCode } from '@/i18n/languages';
import type { StationDef, StationType } from '@/stations/types';

import { LETTERS } from './letters';

/**
 * Which stations are free to play without the premium purchase.
 * Letters A–F (in each language's own alphabet) and numbers 1–10 are free;
 * the rest of the letters and numbers, and all animal and vehicle quizzes,
 * need premium.
 */
export function isStationFree(station: StationDef, language: LanguageCode): boolean {
  switch (station.type) {
    case 'letter': {
      const alphabet = LETTERS[language];
      const last = alphabet.findIndex((l) => l.upper === PREMIUM.freeUntilLetter);
      return alphabet.indexOf(station.letter) <= last;
    }
    case 'number':
      return station.number.value <= PREMIUM.freeUntilNumber;
    case 'animal':
    case 'vehicle':
      return false;
  }
}

/** Station types that are entirely premium (their whole category card is locked). */
export function isTypeFullyLocked(type: StationType): boolean {
  return type === 'animal' || type === 'vehicle';
}

/** Can this station be played right now? */
export function canPlay(station: StationDef, language: LanguageCode, premium: boolean): boolean {
  return premium || isStationFree(station, language);
}
