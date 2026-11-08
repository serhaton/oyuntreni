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

import { CheckBadge } from '@/components/CheckBadge';
import { StarBurst } from '@/components/StarBurst';
import { TracingCanvas } from '@/components/TracingCanvas';
import { carX, TRAIN, trainWidth } from '@/components/train/geometry';
import { Train } from '@/components/train/Train';
import { numberGlyph } from '@/data/glyphs';
import { TRACK } from '@/data/scenery';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useSay } from '@/hooks/useSay';
import { useTranslation, type TranslationKey } from '@/i18n';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { colors } from '@/theme';

import type { NumberStationDef, StationModuleProps } from '../types';
import { NumberToken, numberTokenSize } from './NumberToken';

type Phase = 'tracing' | 'traced' | 'arriving' | 'boarding' | 'departing';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Number station without counting (numbers above MAX_COUNT: 6, 12, 1000...):
 *   1. the child traces the number digit by digit, left to right
 *      (multi-digit numbers get a wider canvas so every digit stays big);
 *   2. it's celebrated and said out loud ("Twelve!");
 *   3. the number itself, in big rainbow digits, hops into the wagon of the
 *      arriving train, and off it goes.
 */
export function TraceOnlyNumberStation({ station, onSolved, onDone }: StationModuleProps<NumberStationDef>) {
  const { value } = station.number;
  const { t } = useTranslation();
  const say = useSay();
  const { width: W, height: H, safe, tracingSize, s, touchTarget } = useDeviceLayout();

  const glyph = numberGlyph(value);
  const word = t(`numbers.n${value}` as TranslationKey);
  const [phase, setPhase] = useState<Phase>('tracing');

  // ---- Canvas: as tall as usual, as wide as the digits need, shrunk to fit
  // between the screen sides (clear of the back button corner).
  const aspect = glyph?.aspect ?? 1;
  const maxWidth = W - 2 * (safe.left + touchTarget + s(12));
  const height = Math.min(tracingSize, maxWidth / aspect);
  const width = height * aspect;
  const left = (W - width) / 2;
  const top = safe.top + (H - safe.top - safe.bottom - height) / 2;

  // ---- Train with one wagon, centered on the track.
  const u = Math.min(H * 0.22, (W - safe.left - safe.right) / (trainWidth(1) + 1.4));
  const trainW = trainWidth(1) * u;
  const trainLeft = (W - trainW) / 2;
  const trainTop = H * TRACK.y - u * (1 + TRAIN.smokeHeight);

  // ---- The number as a passenger: starts big where the canvas was, ends in the wagon.
  // Big, but never wider than 80% of the canvas it replaces.
  const tokenWidthPerPoint = numberTokenSize(value, 1).width;
  const token = numberTokenSize(value, Math.min(height * 0.6, (width * 0.8) / tokenWidthPerPoint));
  const startCenterX = W / 2;
  const startBottom = top + height / 2 + token.height / 2;
  const seatCenterX = trainLeft + carX(0) * u + (TRAIN.wagonWidth * u) / 2;
  const seatBottom = trainTop + (TRAIN.smokeHeight + TRAIN.wagonDeck) * u + u * 0.1;
  const seatScale = Math.min((TRAIN.wagonWidth * u * 0.85) / token.width, (u * 0.6) / token.height);

  const trainX = useSharedValue(-(trainLeft + trainW + s(40)));
  const trainSpeed = useSharedValue(0);
  const ride = useSharedValue(0); // 0 = where the canvas was, 1 = in the wagon
  const trainStyle = useAnimatedStyle(() => ({ transform: [{ translateX: trainX.value }] }));
  const tokenStyle = useAnimatedStyle(() => {
    const p = ride.value;
    const cx = startCenterX + (seatCenterX - startCenterX) * p + (p >= 1 ? trainX.value : 0);
    const bottom = startBottom + (seatBottom - startBottom) * p - Math.sin(Math.PI * p) * H * 0.18;
    return {
      transform: [
        { translateX: cx - token.width / 2 },
        { translateY: bottom - token.height },
        { scale: 1 + (seatScale - 1) * p },
      ],
    };
  });

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
    const timer = setTimeout(
      () => void say(value >= 10 ? 'speech.traceBigNumber' : 'speech.traceNumber', { number: word }),
      700,
    );
    return () => clearTimeout(timer);
  }, [say, value, word]);

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
    // 1. Celebrate and say the number.
    onSolved();
    setPhase('traced');
    haptics.success();
    audio.playSfx('sparkle');
    setTimeout(() => audio.playSfx('applause'), 300);
    await wait(400);
    if (!alive.current) return;
    await say('speech.numberSaid', { number: word });
    if (!alive.current) return;
    await wait(300);
    if (!alive.current) return;
    // 2. The canvas makes way for the number; the train rolls in.
    setPhase('arriving');
    audio.playSfx('chug');
    trainSpeed.set(withTiming(s(120), { duration: 300 }));
    trainX.set(withTiming(0, { duration: 1800, easing: Easing.out(Easing.cubic) }));
    setTimeout(() => trainSpeed.set(withTiming(0, { duration: 600 })), 1300);
    await wait(1900);
    if (!alive.current) return;
    audio.playSfx('whistle');
    // 3. The number hops into the wagon...
    setPhase('boarding');
    audio.playSfx('whoosh');
    ride.set(withTiming(1, { duration: 950, easing: Easing.inOut(Easing.quad) }));
    await wait(1000);
    if (!alive.current) return;
    audio.playSfx('pop');
    haptics.tap();
    await wait(500);
    if (!alive.current) return;
    // 4. ...and off it goes.
    setPhase('departing');
    audio.playSfx('whistle');
    await wait(500);
    if (!alive.current) return;
    audio.playSfx('chug');
    trainSpeed.set(withTiming(s(160), { duration: 1500 }));
    trainX.set(withTiming(W + trainW, { duration: 2800, easing: Easing.in(Easing.quad) }));
    await wait(2600);
    if (alive.current) onDone();
  }, [onSolved, onDone, say, word, trainX, trainSpeed, ride, s, W, trainW]);

  if (!glyph) return null; // validated by `npm run test:data`

  const showCanvas = phase === 'tracing' || phase === 'traced';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {showCanvas && (
        <Animated.View exiting={ZoomOut.duration(250)} style={[styles.abs, { left, top }]}>
          <TracingCanvas
            key={`${station.id}-${height}`}
            glyph={glyph}
            size={height}
            onStrokeDone={onStrokeDone}
            onMiss={onMiss}
            onComplete={onComplete}
          />
          {phase === 'traced' && (
            <>
              <View style={[styles.abs, { left: (width - height) / 2, top: 0 }]} pointerEvents="none">
                <StarBurst size={height} />
              </View>
              <Animated.View
                entering={ZoomIn.springify().damping(8)}
                pointerEvents="none"
                style={[styles.abs, { right: -height * 0.06, top: -height * 0.06 }]}
              >
                <CheckBadge size={height * 0.24} />
              </Animated.View>
            </>
          )}
        </Animated.View>
      )}

      <Animated.View style={[styles.abs, { left: trainLeft, top: trainTop }, trainStyle]} pointerEvents="box-none">
        <Train u={u} travel={trainX} speed={trainSpeed} wagonColors={[colors.candyPink]} />
      </Animated.View>

      {!showCanvas && (
        // Pop-in on the outer layer, movement on the inner one.
        <Animated.View entering={ZoomIn.springify()} pointerEvents="none" style={[styles.abs, { left: 0, top: 0 }]}>
          <Animated.View
            style={[{ width: token.width, height: token.height, transformOrigin: '50% 100%' }, tokenStyle]}
          >
            <NumberToken value={value} height={token.height} />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
