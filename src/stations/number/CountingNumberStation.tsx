import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

import { CheckBadge } from '@/components/CheckBadge';
import { Sprite } from '@/components/Sprite';
import { StarBurst } from '@/components/StarBurst';
import { TracingCanvas } from '@/components/TracingCanvas';
import { carX, TRAIN, trainWidth } from '@/components/train/geometry';
import { Train } from '@/components/train/Train';
import { catalogSound } from '@/data/catalog';
import { numberGlyph } from '@/data/glyphs';
import type { CountingToy as CountingToyId } from '@/data/numbers';
import { GROUND, TRACK } from '@/data/scenery';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useSay } from '@/hooks/useSay';
import { useTranslation, type TranslationKey } from '@/i18n';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { rainbow } from '@/theme';

import type { NumberStationDef, StationModuleProps } from '../types';
import { CountingToy, type DropZone, type Seat } from './CountingToy';
import { DragHint } from './DragHint';

type Phase = 'tracing' | 'traced' | 'counting' | 'departing';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Number station with counting (numbers 1–MAX_COUNT):
 *   1. trace the digit (same tracing canvas as letters);
 *   2. a train with one wagon per item rolls in and N toys appear:
 *      "Put 3 teddy bears on the train!";
 *   3. the child drags (or taps) each toy into a wagon while it's counted
 *      out loud: "One! Two! Three!";
 *   4. celebration, and the train leaves with its toys.
 */
export function CountingNumberStation({ station, onSolved, onDone }: StationModuleProps<NumberStationDef>) {
  const { value } = station.number;
  // <NumberStation> only routes numbers that have a counting toy here.
  const toy = station.number.toy as CountingToyId;
  const { t, language } = useTranslation();
  const say = useSay();
  const { width: W, height: H, safe, tracingSize: size, s, touchTarget } = useDeviceLayout();

  const glyph = numberGlyph(value);
  const numberWord = (n: number) => t(`numbers.n${n}` as TranslationKey);
  const [phase, setPhase] = useState<Phase>('tracing');
  // The animated "drag it here" arrow, shown once the train has arrived.
  const [hintVisible, setHintVisible] = useState(false);

  // ---- Tracing layout: [toy preview] [canvas] --------------------------------
  const canvasLeft = (W - size) / 2;
  const canvasTop = safe.top + (H - safe.top - safe.bottom - size) / 2;
  const previewSize = Math.min((canvasLeft - safe.left) * 0.8, H * 0.32);
  const previewLeft = safe.left + (canvasLeft - safe.left - previewSize) / 2;
  const previewTop = H * GROUND.top - previewSize;

  // ---- Counting layout: train with `value` wagons, toys in a row above -------
  const u = Math.min(H * 0.22, (W - safe.left - safe.right - s(16)) / trainWidth(value));
  const trainW = trainWidth(value) * u;
  const trainLeft = (W - trainW) / 2;
  const trainTop = H * TRACK.y - u * (1 + TRAIN.smokeHeight);
  const wagonColors = useMemo(() => Array.from({ length: value }, (_, i) => rainbow[i % rainbow.length]), [value]);

  const toySize = Math.min(H * 0.2, (W - safe.left - safe.right) / (value + 1.5));
  // Toys wait in the open sky between the top buttons and the train (clear of the smoke).
  const freeTop = safe.top + touchTarget;
  const freeBottom = trainTop + TRAIN.smokeHeight * u * 0.5;
  const toyRowBottom = Math.max(freeTop + toySize, (freeTop + freeBottom) / 2 + toySize / 2);
  const toyHomes = useMemo(() => {
    const gap = (W - safe.left - safe.right - toySize * value) / (value + 1);
    return Array.from({ length: value }, (_, i) => ({
      x: safe.left + gap * (i + 1) + toySize * i,
      // A little up-and-down jitter so they look scattered, not lined up.
      y: toyRowBottom - toySize - (i % 2 === 0 ? 0 : toySize * 0.12),
    }));
  }, [W, safe.left, safe.right, toySize, value, toyRowBottom]);

  const seatFor = useCallback(
    (wagon: number): Seat => ({
      centerX: trainLeft + carX(wagon) * u + (TRAIN.wagonWidth * u) / 2,
      bottom: trainTop + (TRAIN.smokeHeight + TRAIN.wagonDeck) * u + u * 0.12,
      scale: (TRAIN.wagonWidth * u * 0.75) / toySize,
    }),
    [trainLeft, trainTop, u, toySize],
  );

  const dropZone: DropZone = useMemo(
    () => ({
      x: trainLeft - u * 0.2,
      y: trainTop + TRAIN.smokeHeight * u - u * 0.6,
      width: trainW + u * 0.4,
      height: u * 1.7,
    }),
    [trainLeft, trainTop, trainW, u],
  );

  // ---- Train motion ----------------------------------------------------------
  // Starts off-screen on the left, drives in, later drives off to the right.
  const trainX = useSharedValue(-(trainLeft + trainW + s(20)));
  const trainSpeed = useSharedValue(0);
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

  useEffect(() => {
    const timer = setTimeout(() => void say('speech.traceNumber', { number: numberWord(value) }), 900);
    return () => clearTimeout(timer);
    // numberWord only depends on t (covered by say's language)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [say, value]);

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

  // Tracing done -> celebrate, then bring in the train and the toys.
  const onTraced = useCallback(async () => {
    setPhase('traced');
    haptics.success();
    audio.playSfx('sparkle');
    await wait(400);
    if (!alive.current) return;
    await say('speech.numberSaid', { number: numberWord(value) });
    if (!alive.current) return;
    await wait(500);
    if (!alive.current) return;
    setPhase('counting');
    audio.playSfx('chug');
    trainSpeed.set(withTiming(s(120), { duration: 300 }));
    trainX.set(withTiming(0, { duration: 1800, easing: Easing.out(Easing.cubic) }));
    setTimeout(() => trainSpeed.set(withTiming(0, { duration: 600 })), 1300);
    await wait(1900);
    if (!alive.current) return;
    audio.playSfx('whistle');
    // The train is in place: show the "drag it here" arrow.
    setHintVisible(true);
    const form = value === 1 ? 'one' : 'other';
    void say('speech.putOnTrain', {
      count: numberWord(value),
      toy: t(`counting.${toy}.${form}` as TranslationKey),
    });
    // numberWord/t are stable for the current language
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [say, value, toy, trainX, trainSpeed, s]);

  // ---- Counting --------------------------------------------------------------
  const [seats, setSeats] = useState<(Seat | null)[]>(() => Array(value).fill(null));
  // Refs (not state) so two very fast taps can't count the same toy twice.
  const boarded = useRef(0);
  const boardedToys = useRef(new Set<number>());

  const finish = useCallback(async () => {
    await wait(900);
    if (!alive.current) return;
    onSolved();
    audio.playSfx('applause');
    await say('speech.countDone', { count: numberWord(value) });
    if (!alive.current) return;
    setPhase('departing');
    audio.playSfx('whistle');
    await wait(500);
    if (!alive.current) return;
    audio.playSfx('chug');
    trainSpeed.set(withTiming(s(160), { duration: 1500 }));
    trainX.set(withTiming(W, { duration: 2600, easing: Easing.in(Easing.quad) }));
    await wait(2400);
    if (alive.current) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onSolved, onDone, say, value, trainX, trainSpeed, s, W]);

  const onBoard = useCallback(
    (index: number) => {
      if (phase !== 'counting' || boardedToys.current.has(index) || boarded.current >= value) return;
      boardedToys.current.add(index);
      const count = ++boarded.current;
      // Fill wagons left to right, so the counting reads like the numbers.
      const seat = seatFor(count - 1);
      setSeats((prev) => prev.map((s0, i) => (i === index ? seat : s0)));
      audio.playSfx(catalogSound(toy));
      haptics.tap();
      void audio.say(numberWord(count), { language, clipId: `numbers.n${count}` });
      if (count === value) void finish();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, value, seatFor, toy, language, finish],
  );

  if (!glyph) return null; // validated by `npm run test:data`

  const showCanvas = phase === 'tracing' || phase === 'traced';

  // Hint arrow: from the next toy still waiting, down to the next empty wagon.
  const nextToy = seats.findIndex((seat) => seat == null);
  const nextWagon = seats.filter((seat) => seat != null).length;
  const showHint = hintVisible && phase === 'counting' && nextToy >= 0;
  const hintFrom = showHint
    ? { x: toyHomes[nextToy].x + toySize / 2, y: toyHomes[nextToy].y + toySize * 1.02 }
    : null;
  const hintTo = showHint
    ? {
        x: seatFor(nextWagon).centerX,
        y: trainTop + (TRAIN.smokeHeight + TRAIN.wagonDeck) * u - u * 0.08,
      }
    : null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {showCanvas && (
        <Animated.View exiting={ZoomOut.duration(300)} style={[styles.abs, { left: canvasLeft, top: canvasTop }]}>
          <TracingCanvas
            key={`${station.id}-${size}`}
            glyph={glyph}
            size={size}
            onStrokeDone={onStrokeDone}
            onMiss={onMiss}
            onComplete={onTraced}
          />
          {phase === 'traced' && (
            <>
              <View style={[styles.abs, { left: 0, top: 0 }]} pointerEvents="none">
                <StarBurst size={size} />
              </View>
              <Animated.View
                entering={ZoomIn.springify().damping(8)}
                pointerEvents="none"
                style={[styles.abs, { right: -size * 0.06, top: -size * 0.06 }]}
              >
                <CheckBadge size={size * 0.24} />
              </Animated.View>
            </>
          )}
        </Animated.View>
      )}

      {showCanvas && (
        <Animated.View exiting={ZoomOut.duration(300)} style={[styles.abs, { left: previewLeft, top: previewTop }]}>
          <Sprite id={toy} size={previewSize} />
        </Animated.View>
      )}

      <Animated.View style={[styles.abs, { left: trainLeft, top: trainTop }, trainStyle]} pointerEvents="box-none">
        <Train u={u} travel={trainX} speed={trainSpeed} wagonColors={wagonColors} />
      </Animated.View>

      {(phase === 'counting' || phase === 'departing') &&
        toyHomes.map((home, i) => (
          <CountingToy
            key={i}
            index={i}
            id={toy}
            size={toySize}
            homeX={home.x}
            homeY={home.y}
            seat={seats[i]}
            dropZone={dropZone}
            trainX={trainX}
            onBoard={onBoard}
          />
        ))}

      {hintFrom && hintTo && <DragHint key={`hint-${nextWagon}`} from={hintFrom} to={hintTo} scale={toySize} />}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
