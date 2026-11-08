import { useCallback, useState } from 'react';

import { catalogSound } from '@/data/catalog';
import { ANIMAL_QUIZ, CHOICE_COUNT, pickOthers, shuffle } from '@/data/quizzes';
import { audio } from '@/services/audio';

import { ChoiceStation, type ChoiceOption } from '../choice/ChoiceStation';
import type { AnimalStationDef, StationModuleProps } from '../types';

/**
 * Animal station: "Moo!" — which animal makes this sound? Three big cards
 * (the answer + two other animals, in random order); the right animal hops
 * into the train's wagon.
 */
export function AnimalStation({ station, onSolved, onDone }: StationModuleProps<AnimalStationDef>) {
  const { animal } = station;

  // Picked once per visit, so the cards don't reshuffle while playing.
  const [{ options, answer }] = useState(() => {
    const ids = shuffle([animal, ...pickOthers(ANIMAL_QUIZ, animal, CHOICE_COUNT - 1)]);
    return { options: ids.map((id): ChoiceOption => ({ id })), answer: ids.indexOf(animal) };
  });

  // The animal's sound IS the question (no spoken sentence: the child just listens).
  const ask = useCallback(async () => {
    audio.stopSpeech();
    audio.playQuestionSound(catalogSound(animal));
  }, [animal]);

  return (
    <ChoiceStation options={options} answer={answer} ask={ask} boarding="wagon" onSolved={onSolved} onDone={onDone} />
  );
}
