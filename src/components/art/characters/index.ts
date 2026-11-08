import type { ComponentType } from 'react';

import type { CatalogId } from '@/data/catalog';

import { AntArt } from './Ant';
import { BeeArt } from './Bee';
import { CarArt } from './Car';
import { CatArt } from './Cat';
import { DuckArt } from './Duck';
import { MonkeyArt } from './Monkey';
import { PomegranateArt } from './Pomegranate';
import { RabbitArt } from './Rabbit';
import type { CharacterArtProps } from './types';

export type { CharacterArtProps } from './types';

/**
 * Skia drawings, by catalog id. Items not listed here fall back to their
 * emoji placeholder automatically. To replace a placeholder: draw the
 * character (copy one of these files as a template) and add it here.
 * Later, a real illustration can be dropped in the same way.
 */
export const CHARACTER_ART: Partial<Record<CatalogId, ComponentType<CharacterArtProps>>> = {
  ant: AntArt,
  bee: BeeArt,
  car: CarArt,
  cat: CatArt,
  duck: DuckArt,
  monkey: MonkeyArt,
  pomegranate: PomegranateArt,
  rabbit: RabbitArt,
};
