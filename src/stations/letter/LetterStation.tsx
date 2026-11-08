import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { CheckBadge } from '@/components/CheckBadge';
import { Sprite } from '@/components/Sprite';
import { StarBurst } from '@/components/StarBurst';
import { TracingCanvas } from '@/components/TracingCanvas';
import { carX, TRAIN, trainWidth } from '@/components/train/geometry';
import { Train } from '@/components/train/Train';
import { catalogSound } from '@/data/catalog';
import { getGlyph } from '@/data/glyphs';
import { letterIndexInWord } from '@/data/letters';
import { GROUND, TRACK } from '@/data/scenery';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useSay } from '@/hooks/useSay';
import { useTranslation } from '@/i18n';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { colors, fonts, rainbow, sizes } from '@/theme';

import type { LetterStationDef, StationModuleProps } from '../types';

type Phase = 'tracing' | 'success' | 'boarding' | 'departing';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Letter station:
 *   the passenger waits on the platform (left), the train waits (right);
 *   the child traces the letter (center); on success the letter glows,
 *   "K... Kedi!" is spoken, the passenger hops into the wagon and the train
 *   leaves. Works for uppercase and lowercase stations in every language.
 */
export function LetterStation({ station, onSolved, onDone }: StationModuleProps<LetterStationDef>) {
  const { letter, letterCase } = station;
  const { speechLocale } = useTranslation();
  const say = useSay();
  const { width: W, height: H, safe, tracingSize: size, s } = useDeviceLayout();

  const char = letterCase === 'upper' ? letter.upper : letter.lower;
  const glyph = getGlyph(char);
  const spokenLetter = letter.spokenName ?? char;
  const [phase, setPhase] = useState<Phase>('tracing');

  // ---- Layout: [passenger] [tracing canvas] [train] ------------------------
  const canvasLeft = W / 2 - size / 2 - W * 0.03;
  const canvasTop = safe.top + (H - safe.top - safe.bottom - size) / 2;
  const leftColumn = canvasLeft - safe.left;
  const passengerSize = Math.min(leftColumn * 0.85, H * 0.36);
  const startCenterX = safe.left + leftColumn / 2;
  const startBottom = H * GROUND.top + passengerSize * 0.02;

  const rightColumn = W - safe.right - (canvasLeft + size);
  const u = Math.min(H * 0.2, (rightColumn - s(6)) / trainWidth(1));
  const trainLeft = W - safe.right - trainWidth(1) * u;
  const trainTop = H * TRACK.y - u * (1 + TRAIN.smokeHeight);
  // Where the passenger lands: standing in the wagon's tub.
  const seatCenterX = trainLeft + carX(0) * u + (TRAIN.wagonWidth * u) / 2;
  const seatBottom = trainTop + (TRAIN.smokeHeight + TRAIN.wagonDeck) * u + u * 0.12;
  const riderScale = (TRAIN.wagonWidth * u * 0.8) / passengerSize;
  const wagonColor = rainbow[char.charCodeAt(0) % rainbow.length];

  // ---- Animation state (UI thread) ------------------------------------------
  const jump = useSharedValue(0); // 0 = on the platform, 1 = in the wagon
  const trainX = useSharedValue(0); // how far the train has driven off
  const trainSpeed = useSharedValue(0);

  const passengerStyle = useAnimatedStyle(() => {
    const p = jump.value;
    const cx = startCenterX + (seatCenterX + trainX.value - startCenterX) * p;
    // A nice arc: up and over, landing in the wagon.
    const bottom = startBottom + (seatBottom - startBottom) * p - Math.sin(Math.PI * p) * H * 0.28;
    return {
      transform: [
        { translateX: cx - passengerSize / 2 },
        { translateY: bottom - passengerSize },
        { scale: 1 + (riderScale - 1) * p },
      ],
    };
  });
  const trainStyle = useAnimatedStyle(() => ({ transform: [{ translateX: trainX.value }] }));

  // ---- Flow ------------------------------------------------------------------
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
      audio.stopSpeech();
    },
    [],
  );

  // Arrival: a toot from the train, then the spoken instruction.
  useEffect(() => {
    const t1 = setTimeout(() => audio.playSfx('whistle'), 300);
    const t2 = setTimeout(
      () => void say(letterCase === 'upper' ? 'speech.traceLetter' : 'speech.traceSmallLetter', { letter: spokenLetter }),
      1100,
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [say, letterCase, spokenLetter]);

  const lastEncouragement = useRef(0);
  const onStrokeDone = useCallback(() => {
    haptics.tap();
    audio.playSfx('pop');
  }, []);
  const onMiss = useCallback(() => {
    audio.playSfx('softTryAgain');
    const now = Date.now();
    if (now - lastEncouragement.current > 4000) {
      lastEncouragement.current = now;
      void say('speech.tryAgain');
    }
  }, [say]);

  const onComplete = useCallback(async () => {
    // 1. Celebrate the letter (and remember it: the map shows a check from now on).
    onSolved();
    setPhase('success');
    haptics.success();
    audio.playSfx('sparkle');
    setTimeout(() => audio.playSfx('applause'), 300);
    await wait(500);
    if (!alive.current) return;
    // 2. "K... Kedi!"
    await say(letterCase === 'upper' ? 'speech.letterWord' : 'speech.smallLetterWord', {
      letter: spokenLetter,
      word: letter.word,
    });
    if (!alive.current) return;
    audio.playSfx(catalogSound(letter.passenger));
    await wait(700);
    if (!alive.current) return;
    // 3. The passenger hops into the wagon.
    setPhase('boarding');
    audio.playSfx('whoosh');
    jump.set(withTiming(1, { duration: 950, easing: Easing.inOut(Easing.quad) }));
    await wait(950);
    if (!alive.current) return;
    audio.playSfx('pop');
    haptics.tap();
    await wait(600);
    if (!alive.current) return;
    // 4. Toot toot, off we go!
    setPhase('departing');
    audio.playSfx('whistle');
    await wait(500);
    if (!alive.current) return;
    audio.playSfx('chug');
    trainSpeed.set(withTiming(s(160), { duration: 1500 }));
    trainX.set(withTiming(W, { duration: 2600, easing: Easing.in(Easing.quad) }));
    await wait(2400);
    if (alive.current) onDone();
  }, [say, letterCase, spokenLetter, letter, jump, trainX, trainSpeed, s, W, onSolved, onDone]);

  if (!glyph) return null; // validated by `npm run test:data`, so this shouldn't happen

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={[styles.abs, { left: canvasLeft, top: canvasTop }]}>
        <TracingCanvas
          key={`${station.id}-${size}`}
          glyph={glyph}
          size={size}
          onStrokeDone={onStrokeDone}
          onMiss={onMiss}
          onComplete={onComplete}
        />
        {phase !== 'tracing' && (
          <View style={[styles.abs, { left: 0, top: 0 }]} pointerEvents="none">
            <StarBurst size={size} />
          </View>
        )}
        {phase !== 'tracing' && (
          // Big "done!" check popping in on the canvas corner.
          <Animated.View
            entering={ZoomIn.springify().damping(8)}
            pointerEvents="none"
            style={[styles.abs, { right: -size * 0.06, top: -size * 0.06 }]}
          >
            <CheckBadge size={size * 0.24} />
          </Animated.View>
        )}
      </View>

      <Animated.View style={[styles.abs, { left: trainLeft, top: trainTop }, trainStyle]} pointerEvents="box-none">
        <Train u={u} travel={trainX} speed={trainSpeed} wagonColors={[wagonColor]} />
      </Animated.View>

      {phase !== 'tracing' && (
        <Animated.View
          entering={ZoomIn.springify()}
          pointerEvents="none"
          style={[styles.abs, styles.wordRow, { left: canvasLeft, width: size, top: canvasTop + size * 0.74 }]}
        >
          <WordCard word={letter.word} highlight={letterIndexInWord(letter, speechLocale)} fontSize={s(40)} />
        </Animated.View>
      )}

      <Animated.View
        style={[styles.abs, { left: 0, top: 0, width: passengerSize, height: passengerSize, transformOrigin: '50% 100%' }, passengerStyle]}
      >
        <Sprite id={letter.passenger} size={passengerSize} happy={phase !== 'tracing'} interactive={phase === 'tracing'} />
      </Animated.View>
    </View>
  );
}

/** The example word, with the station's letter in color (e.g. Kurbağa with "ğ" highlighted). */
function WordCard({ word, highlight, fontSize }: { word: string; highlight: number; fontSize: number }) {
  return (
    <View style={[styles.card, { paddingHorizontal: fontSize * 0.5, paddingVertical: fontSize * 0.12, borderRadius: sizes.radius.md }]}>
      <Text style={[styles.word, { fontSize }]}>
        {Array.from(word).map((ch, i) => (
          <Text key={i} style={i === highlight ? styles.highlight : undefined}>
            {ch}
          </Text>
        ))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  wordRow: { alignItems: 'center' },
  card: {
    backgroundColor: colors.white,
    borderWidth: 4,
    borderColor: colors.sun,
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  word: { fontFamily: fonts.bold, color: colors.ink },
  highlight: { color: colors.red },
});
