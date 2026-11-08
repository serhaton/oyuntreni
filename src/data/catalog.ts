import type { SoundId } from '@/services/soundAssets';

/**
 * Everything that can ride the train: animals, toys, vehicles, food.
 * Shared by all languages — names live in the i18n dictionaries under
 * `catalog.<id>`, so adding a language never touches this file.
 *
 * To add a new passenger:
 *   1. Add an entry here (pick an emoji placeholder and, if possible, a sound).
 *   2. Add its name to every dictionary (src/i18n/tr.ts, en.ts) under `catalog`.
 *   3. Optionally draw it in Skia and register it in src/components/art/characters.
 */
export type CatalogKind = 'animal' | 'toy' | 'vehicle' | 'food';

export interface CatalogItem {
  kind: CatalogKind;
  /** Temporary look until a Skia drawing exists for this item. */
  emoji: string;
  /** Sound played when the item is tapped or boards the train. */
  sound?: SoundId;
}

export const CATALOG = {
  // Animals
  ant: { kind: 'animal', emoji: '🐜', sound: 'ant' },
  bear: { kind: 'animal', emoji: '🐻', sound: 'roar' },
  bee: { kind: 'animal', emoji: '🐝', sound: 'bee' },
  camel: { kind: 'animal', emoji: '🐫' },
  cat: { kind: 'animal', emoji: '🐱', sound: 'cat' },
  chick: { kind: 'animal', emoji: '🐤', sound: 'chick' },
  chimpanzee: { kind: 'animal', emoji: '🐒', sound: 'monkey' },
  cow: { kind: 'animal', emoji: '🐮', sound: 'cow' },
  deer: { kind: 'animal', emoji: '🦌' },
  dog: { kind: 'animal', emoji: '🐶', sound: 'dog' },
  dolphin: { kind: 'animal', emoji: '🐬', sound: 'dolphin' },
  donkey: { kind: 'animal', emoji: '🫏', sound: 'donkey' },
  duck: { kind: 'animal', emoji: '🦆', sound: 'duck' },
  elephant: { kind: 'animal', emoji: '🐘', sound: 'elephant' },
  fish: { kind: 'animal', emoji: '🐟', sound: 'pop' },
  frog: { kind: 'animal', emoji: '🐸', sound: 'frog' },
  giraffe: { kind: 'animal', emoji: '🦒' },
  horse: { kind: 'animal', emoji: '🐴', sound: 'horse' },
  iguana: { kind: 'animal', emoji: '🦎' },
  jaguar: { kind: 'animal', emoji: '🐆', sound: 'roar' },
  jellyfish: { kind: 'animal', emoji: '🪼', sound: 'boing' },
  kangaroo: { kind: 'animal', emoji: '🦘', sound: 'boing' },
  lion: { kind: 'animal', emoji: '🦁', sound: 'roar' },
  llama: { kind: 'animal', emoji: '🦙' },
  lobster: { kind: 'animal', emoji: '🦞', sound: 'pop' },
  monkey: { kind: 'animal', emoji: '🐵', sound: 'monkey' },
  narwhal: { kind: 'animal', emoji: '🐳', sound: 'dolphin' },
  octopus: { kind: 'animal', emoji: '🐙', sound: 'pop' },
  penguin: { kind: 'animal', emoji: '🐧' },
  rabbit: { kind: 'animal', emoji: '🐰', sound: 'rabbit' },
  raccoon: { kind: 'animal', emoji: '🦝' },
  rooster: { kind: 'animal', emoji: '🐓', sound: 'rooster' },
  sheep: { kind: 'animal', emoji: '🐑', sound: 'sheep' },
  squirrel: { kind: 'animal', emoji: '🐿️', sound: 'ant' },
  tiger: { kind: 'animal', emoji: '🐯', sound: 'roar' },
  whale: { kind: 'animal', emoji: '🐋', sound: 'whale' },
  zebra: { kind: 'animal', emoji: '🦓', sound: 'horse' },

  // Toys
  ball: { kind: 'toy', emoji: '⚽', sound: 'boing' },
  drum: { kind: 'toy', emoji: '🥁', sound: 'drum' },
  kite: { kind: 'toy', emoji: '🪁', sound: 'whoosh' },
  queen: { kind: 'toy', emoji: '👸', sound: 'sparkle' },
  robot: { kind: 'toy', emoji: '🤖', sound: 'robot' },
  teddy: { kind: 'toy', emoji: '🧸', sound: 'giggle' },
  unicorn: { kind: 'toy', emoji: '🦄', sound: 'sparkle' },
  xylophone: { kind: 'toy', emoji: '🎹', sound: 'xylophone' },
  yoyo: { kind: 'toy', emoji: '🪀', sound: 'boing' },

  // Vehicles
  airplane: { kind: 'vehicle', emoji: '✈️', sound: 'airplane' },
  bus: { kind: 'vehicle', emoji: '🚌', sound: 'carHorn' },
  car: { kind: 'vehicle', emoji: '🚗', sound: 'carHorn' },
  ferry: { kind: 'vehicle', emoji: '⛴️', sound: 'shipHorn' },
  fireTruck: { kind: 'vehicle', emoji: '🚒', sound: 'fireTruck' },
  van: { kind: 'vehicle', emoji: '🚐', sound: 'carHorn' },

  // Food
  grapes: { kind: 'food', emoji: '🍇', sound: 'pop' },
  pomegranate: { kind: 'food', emoji: '🔴', sound: 'pop' }, // drawn in Skia (no pomegranate emoji exists)
  strawberry: { kind: 'food', emoji: '🍓', sound: 'pop' },
} as const satisfies Record<string, CatalogItem>;

export type CatalogId = keyof typeof CATALOG;

export function getCatalogItem(id: CatalogId): CatalogItem {
  return CATALOG[id];
}

/** Sound for an item, with a cheerful default for items without their own. */
export function catalogSound(id: CatalogId): SoundId {
  const item: CatalogItem = CATALOG[id];
  return item.sound ?? (item.kind === 'animal' ? 'giggle' : 'pop');
}

export const CATALOG_IDS = Object.keys(CATALOG) as CatalogId[];
