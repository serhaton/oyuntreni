import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

import { SpeakerButton } from '@/components/SpeakerButton';
import { Sprite } from '@/components/Sprite';
import { StarBurst } from '@/components/StarBurst';
import { carX, TRAIN, trainWidth } from '@/components/train/geometry';
import { Train } from '@/components/train/Train';
import { catalogSound, type CatalogId } from '@/data/catalog';
import { GROUND, TRACK } from '@/data/scenery';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useSay } from '@/hooks/useSay';
import { useTranslation, type TranslationKey } from '@/i18n';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { colors } from '@/theme';

import { ChoiceCard } from './ChoiceCard';

export interface ChoiceOption {
  id: CatalogId;
  /** Body color, for recolorable drawings (the cars). */
  tint?: string;
}

interface ChoiceStationProps {
  /** The cards, in display order (already shuffled). */
  options: ChoiceOption[];
  /** Index of the right card in `options`. */
  answer: number;
  /** Plays the question (a sound and/or a sentence). Called again by the speaker button. */
  ask: () => Promise<void>;
  /**
   * How the right answer joins the train: animals hop into a wagon,
   * vehicles drive up and hook onto the back of the train.
   */
  boarding: 'wagon' | 'hitch';
  onSolved: () => void;
  onDone: () => void;
}

type Phase = 'question' | 'correct' | 'arriving' | 'boarding' | 'departing';

/**
 * Pause after the question before the speaker starts inviting a replay
 * (roughly the length of an animal sound, so it doesn't dance over it).
 */
const INVITE_DELAY_MS = 1800;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * "Listen and pick" station, shared by animals and vehicles:
 *   1. the question plays (e.g. "Moo!" + "Which animal makes this sound?");
 *   2. the child taps a card. A wrong card just wiggles and makes its own
 *      sound, then the question replays: no "wrong", no penalty;
 *   3. the right card jumps for joy, its name is said, the train rolls in
 *      and the winner boards (or hooks on), then the train leaves.
 */
export function ChoiceStation({ options, answer, ask, boarding, onSolved, onDone }: ChoiceStationProps) {
  const { t } = useTranslation();
  const say = useSay();
  const { width: W, height: H, safe, s, touchTarget } = useDeviceLayout();
  const [phase, setPhase] = useState<Phase>('question');
  const [wiggles, setWiggles] = useState<number[]>(() => options.map(() => 0));
  const winner = options[answer];
  const winnerName = t(`catalog.${winner.id}` as TranslationKey);

  // ---- Layout: speaker on top, a row of big cards above the ground ------------
  const count = options.length;
  const gap = s(28);
  const cardsAreaTop = safe.top + touchTarget * 1.25;
  const cardsAreaBottom = H * GROUND.top;
  const cardW = Math.min(
    (W - safe.left - safe.right - gap * (count + 1)) / count,
    ((cardsAreaBottom - cardsAreaTop) * 0.9) / 1.15,
    s(230),
  );
  const cardH = cardW * 1.15;
  const cardsTop = cardsAreaTop + (cardsAreaBottom - cardsAreaTop - cardH) / 2;
  const rowWidth = count * cardW + (count - 1) * gap;
  const cardX = (i: number) => (W - rowWidth) / 2 + i * (cardW + gap);
  const spriteSize = cardW * 0.8;

  // ---- Train (arrives once the answer is found) --------------------------------
  const wagons = boarding === 'wagon' ? [colors.candyPink] : [];
  const u = Math.min(H * 0.22, (W - safe.left - safe.right) / (trainWidth(Math.max(1, wagons.length)) + 1.4));
  const trainW = trainWidth(wagons.length) * u;
  const hitchW = u * 1.05; // a hooked-on vehicle is about one car long
  const hitchGap = u * 0.08;
  const groupW = boarding === 'hitch' ? hitchW + hitchGap + trainW : trainW;
  const trainLeft = (W - groupW) / 2 + (boarding === 'hitch' ? hitchW + hitchGap : 0);
  const railY = H * TRACK.y;
  const trainTop = railY - u * (1 + TRAIN.smokeHeight);

  // Where the winner ends up (bottom-center point and scale).
  const seat =
    boarding === 'wagon'
      ? {
          centerX: trainLeft + carX(0) * u + (TRAIN.wagonWidth * u) / 2,
          bottom: trainTop + (TRAIN.smokeHeight + TRAIN.wagonDeck) * u + u * 0.12,
          scale: (TRAIN.wagonWidth * u * 0.8) / spriteSize,
        }
      : {
          centerX: trainLeft - hitchGap - hitchW / 2,
          bottom: railY + u * 0.02,
          scale: hitchW / spriteSize,
        };
  const start = {
    centerX: cardX(answer) + cardW / 2,
    bottom: cardsTop + cardH - 8,
  };

  const trainX = useSharedValue(-(trainLeft + trainW + s(40)));
  const trainSpeed = useSharedValue(0);
  const ride = useSharedValue(0); // 0 = on the card, 1 = on the train
  const trainStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: trainX.value }],
  }));
  const arc = boarding === 'wagon' ? H * 0.25 : H * 0.05;
  const riderStyle = useAnimatedStyle(() => {
    const p = ride.value;
    const cx = start.centerX + (seat.centerX - start.centerX) * p + (p >= 1 ? trainX.value : 0);
    const bottom = start.bottom + (seat.bottom - start.bottom) * p - Math.sin(Math.PI * p) * arc;
    return {
      transform: [
        { translateX: cx - spriteSize / 2 },
        { translateY: bottom - spriteSize },
        { scale: 1 + (seat.scale - 1) * p },
      ],
    };
  });

  // ---- Flow ---------------------------------------------------------------------
  const alive = useRef(true);
  const replayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inviteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      alive.current = false;
      if (replayTimer.current) clearTimeout(replayTimer.current);
      if (inviteTimer.current) clearTimeout(inviteTimer.current);
      audio.stopSpeech();
    },
    [],
  );

  // After the question has played, the speaker starts dancing to invite the
  // child to listen again. It calms down while the question replays.
  const [inviting, setInviting] = useState(false);
  const askAndInvite = useCallback(async () => {
    if (inviteTimer.current) clearTimeout(inviteTimer.current);
    setInviting(false);
    await ask();
    inviteTimer.current = setTimeout(() => {
      if (alive.current) setInviting(true);
    }, INVITE_DELAY_MS);
  }, [ask]);

  useEffect(() => {
    const timer = setTimeout(() => void askAndInvite(), 700);
    return () => clearTimeout(timer);
    // Ask once on arrival; the speaker button asks again on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const celebrateAndBoard = useCallback(async () => {
    onSolved();
    setPhase('correct');
    haptics.success();
    audio.playSfx('sparkle');
    setTimeout(() => audio.playSfx('applause'), 250);
    setTimeout(() => audio.playSfx(catalogSound(winner.id)), 700);
    await wait(1300);
    if (!alive.current) return;
    await say('speech.nameSaid', { name: winnerName });
    if (!alive.current) return;
    // The train rolls in from the left...
    setPhase('arriving');
    audio.playSfx('chug');
    trainSpeed.set(withTiming(s(120), { duration: 300 }));
    trainX.set(withTiming(0, { duration: 1800, easing: Easing.out(Easing.cubic) }));
    setTimeout(() => trainSpeed.set(withTiming(0, { duration: 600 })), 1300);
    await wait(1900);
    if (!alive.current) return;
    audio.playSfx('whistle');
    // ...and the winner hops into the wagon / drives up to the back.
    setPhase('boarding');
    audio.playSfx(boarding === 'wagon' ? 'whoosh' : catalogSound(winner.id));
    ride.set(
      withTiming(1, {
        duration: boarding === 'wagon' ? 950 : 1200,
        easing: Easing.inOut(Easing.quad),
      }),
    );
    await wait(boarding === 'wagon' ? 1000 : 1250);
    if (!alive.current) return;
    audio.playSfx('pop');
    haptics.tap();
    if (boarding === 'wagon') await say('speech.allAboard', { name: winnerName });
    else await wait(500);
    if (!alive.current) return;
    // Off they go!
    setPhase('departing');
    audio.playSfx('whistle');
    await wait(500);
    if (!alive.current) return;
    audio.playSfx('chug');
    trainSpeed.set(withTiming(s(160), { duration: 1500 }));
    trainX.set(
      withTiming(W + groupW, {
        duration: 2800,
        easing: Easing.in(Easing.quad),
      }),
    );
    await wait(2600);
    if (alive.current) onDone();
  }, [onSolved, onDone, say, winner.id, winnerName, boarding, trainX, trainSpeed, ride, s, W, groupW]);

  const onPick = useCallback(
    (index: number) => {
      if (phase !== 'question') return;
      if (replayTimer.current) clearTimeout(replayTimer.current);
      if (index === answer) {
        void celebrateAndBoard();
        return;
      }
      // Not this one: a soft wiggle and its own sound, then hear the question again.
      setWiggles((prev) => prev.map((w, i) => (i === index ? w + 1 : w)));
      haptics.tap();
      audio.playSfx(catalogSound(options[index].id));
      replayTimer.current = setTimeout(() => {
        if (alive.current) void askAndInvite();
      }, 1500);
    },
    [phase, answer, options, askAndInvite, celebrateAndBoard],
  );

  const showCards = phase === 'question' || phase === 'correct' || phase === 'arriving';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {phase === 'question' && (
        <Animated.View
          entering={ZoomIn.springify()}
          exiting={ZoomOut.duration(200)}
          style={[styles.abs, { top: safe.top, left: W / 2 - (touchTarget * 1.1) / 2 }]}
        >
          <SpeakerButton
            onPress={() => void askAndInvite()}
            inviting={inviting}
            accessibilityLabel={t('ui.listenAgain')}
          />
        </Animated.View>
      )}

      {showCards &&
        options.map((option, i) =>
          phase === 'question' || i === answer ? (
            <Animated.View
              key={i}
              entering={ZoomIn.delay(i * 120).springify()}
              exiting={ZoomOut.duration(250)}
              style={[styles.abs, { left: cardX(i), top: cardsTop }]}
            >
              <ChoiceCard
                id={option.id}
                tint={option.tint}
                width={cardW}
                height={cardH}
                wiggleKey={wiggles[i]}
                correct={i === answer && phase !== 'question'}
                emptied={false}
                disabled={phase !== 'question'}
                accessibilityLabel={t(`catalog.${option.id}` as TranslationKey)}
                onPress={() => onPick(i)}
              />
              {i === answer && phase === 'correct' && (
                <View style={[styles.abs, { left: cardW / 2 - cardH / 2, top: 0 }]} pointerEvents="none">
                  <StarBurst size={cardH} />
                </View>
              )}
            </Animated.View>
          ) : null,
        )}

      <Animated.View style={[styles.abs, { left: trainLeft, top: trainTop }, trainStyle]} pointerEvents="box-none">
        <Train u={u} travel={trainX} speed={trainSpeed} wagonColors={wagons} />
      </Animated.View>

      {(phase === 'boarding' || phase === 'departing') && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.abs,
            {
              left: 0,
              top: 0,
              width: spriteSize,
              height: spriteSize,
              transformOrigin: '50% 100%',
            },
            riderStyle,
          ]}
        >
          <Sprite id={winner.id} tint={winner.tint} size={spriteSize} interactive={false} happy />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
