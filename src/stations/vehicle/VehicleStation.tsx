import { useCallback, useState } from 'react';

import { catalogSound } from '@/data/catalog';
import {
  CHOICE_COUNT,
  pickOthers,
  QUIZ_COLORS,
  shuffle,
  QUESTION_REPEAT_GAP_MS,
  VEHICLE_SOUND_POOL,
  type QuizColor,
} from '@/data/quizzes';
import { useSay } from '@/hooks/useSay';
import { useTranslation, type TranslationKey } from '@/i18n';
import { audio } from '@/services/audio';
import { colors } from '@/theme';

import { ChoiceStation, type ChoiceOption } from '../choice/ChoiceStation';
import type { StationModuleProps, VehicleStationDef } from '../types';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Vehicle station, two kinds of questions:
 *  - sound: a siren / plane / ship horn plays — which vehicle is it?
 *  - color: "Find the red car!" among cars of different colors.
 * The right vehicle hops into the train's wagon, just like the animals.
 */
export function VehicleStation({ station, onSolved, onDone }: StationModuleProps<VehicleStationDef>) {
  const { question } = station;
  const { t } = useTranslation();
  const say = useSay();

  // Picked once per visit, so the cards don't reshuffle while playing.
  const [{ options, answer }] = useState(() => {
    if (question.kind === 'sound') {
      const ids = shuffle([question.vehicle, ...pickOthers(VEHICLE_SOUND_POOL, question.vehicle, CHOICE_COUNT - 1)]);
      return { options: ids.map((id): ChoiceOption => ({ id })), answer: ids.indexOf(question.vehicle) };
    }
    const allColors = Object.keys(QUIZ_COLORS) as QuizColor[];
    const picked = shuffle([question.color, ...pickOthers(allColors, question.color, CHOICE_COUNT - 1)]);
    return {
      options: picked.map((c): ChoiceOption => ({ id: question.vehicle, tint: colors[QUIZ_COLORS[c]] })),
      answer: picked.indexOf(question.color),
    };
  });

  const ask = useCallback(
    async (isCurrent: () => boolean) => {
      if (question.kind === 'sound') {
        // The vehicle's sound IS the question (no spoken sentence). It plays once
        // more QUESTION_REPEAT_GAP_MS after it ends.
        await audio.waitForSpeech(); // let "Vehicles!" finish instead of cutting it off
        if (!isCurrent()) return;
        const length = audio.playQuestionSound(catalogSound(question.vehicle));
        await wait(length + QUESTION_REPEAT_GAP_MS);
        if (isCurrent()) audio.playQuestionSound(catalogSound(question.vehicle));
      } else {
        audio.stopSpeech();
        await say('speech.findColored', {
          color: t(`colorNames.${question.color}` as TranslationKey),
          vehicle: t(`findObject.${question.vehicle}` as TranslationKey),
        });
      }
    },
    [question, say, t],
  );

  return (
    <ChoiceStation options={options} answer={answer} ask={ask} boarding="wagon" onSolved={onSolved} onDone={onDone} />
  );
}
