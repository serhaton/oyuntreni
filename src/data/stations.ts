import type { LanguageCode } from '@/i18n/languages';
import type { TripEntry } from '@/services/progress';
import type { StationDef, StationType } from '@/stations/types';
import { colors } from '@/theme';

import type { CatalogId } from './catalog';
import { LETTERS } from './letters';
import { NUMBERS } from './numbers';
import { ANIMAL_QUIZ, QUIZ_COLORS, VEHICLE_QUIZ, vehicleQuestionId } from './quizzes';

/**
 * Every station for a language, grouped by type (letters, numbers, animals,
 * vehicles). The category menu shows one type at a time.
 *
 * Letter stations come in pairs: uppercase then lowercase (A, a, B, b...).
 */
export function getStations(language: LanguageCode): StationDef[] {
  const stations: StationDef[] = [];
  LETTERS[language].forEach((letter, i) => {
    stations.push({ id: `letter-${i}-upper`, type: 'letter', letter, letterCase: 'upper' });
    stations.push({ id: `letter-${i}-lower`, type: 'letter', letter, letterCase: 'lower' });
  });
  NUMBERS.forEach((number) => stations.push({ id: `number-${number.value}`, type: 'number', number }));
  ANIMAL_QUIZ.forEach((animal) => stations.push({ id: `animal-${animal}`, type: 'animal', animal }));
  VEHICLE_QUIZ.forEach((question) =>
    stations.push({ id: `vehicle-${vehicleQuestionId(question)}`, type: 'vehicle', question }),
  );
  return stations;
}

/** Stations of one type, in order (e.g. all letter stations). */
export function getStationsOfType(language: LanguageCode, type: StationType): StationDef[] {
  return getStations(language).filter((s) => s.type === type);
}

/**
 * The next question for a "direct" category: a random station the child
 * hasn't solved yet, or (once all are known) any random one. Never the
 * station just played, so the same question doesn't come twice in a row.
 */
export function pickNextStation(
  language: LanguageCode,
  type: StationType,
  isCompleted: (stationId: string) => boolean,
  justPlayed?: string,
): StationDef | undefined {
  const all = getStationsOfType(language, type);
  const others = all.filter((s) => s.id !== justPlayed);
  const unknown = others.filter((s) => !isCompleted(s.id));
  const pool = unknown.length > 0 ? unknown : others.length > 0 ? others : all;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getStationById(language: LanguageCode, id: string): StationDef | undefined {
  return getStations(language).find((s) => s.id === id);
}

/**
 * Album stickers that can be earned in this language: the catalog passenger of
 * every station (letter friends differ per language, e.g. only English has Lion).
 */
export function collectibleStickers(language: LanguageCode): Set<CatalogId> {
  const ids = new Set<CatalogId>();
  for (const station of getStations(language)) {
    const passenger = stationPassenger(station);
    if (passenger.kind === 'catalog') ids.add(passenger.id);
  }
  return ids;
}

/** Text shown on a station marker (e.g. 'K', 'k' or '3'); null when it shows a picture. */
export function stationLabel(station: StationDef): string | null {
  switch (station.type) {
    case 'letter':
      return station.letterCase === 'upper' ? station.letter.upper : station.letter.lower;
    case 'number':
      return String(station.number.value);
    case 'animal':
    case 'vehicle':
      return null;
  }
}

/**
 * Who joins the trip train when this station is solved: the letter's animal,
 * the counted toy, the quiz answer, or the traced number itself.
 */
export function stationPassenger(station: StationDef): TripEntry {
  switch (station.type) {
    case 'letter':
      return { kind: 'catalog', id: station.letter.passenger };
    case 'number':
      return station.number.toy
        ? { kind: 'catalog', id: station.number.toy }
        : { kind: 'number', value: station.number.value };
    case 'animal':
      return { kind: 'catalog', id: station.animal };
    case 'vehicle': {
      const icon = stationIcon(station);
      return { kind: 'catalog', id: station.question.vehicle, tint: icon?.tint };
    }
  }
}

/** Picture shown on a station marker instead of text (animals and vehicles). */
export function stationIcon(station: StationDef): { id: CatalogId; tint?: string } | null {
  switch (station.type) {
    case 'animal':
      return { id: station.animal };
    case 'vehicle':
      return station.question.kind === 'color'
        ? { id: station.question.vehicle, tint: colors[QUIZ_COLORS[station.question.color]] }
        : { id: station.question.vehicle };
    default:
      return null;
  }
}
