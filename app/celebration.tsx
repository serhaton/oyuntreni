import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ZoomIn,
  type SharedValue,
} from 'react-native-reanimated';

import { AlbumButton } from '@/components/AlbumButton';
import { Confetti } from '@/components/Confetti';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { PlayButton } from '@/components/PlayButton';
import { Sprite } from '@/components/Sprite';
import { StarBurst } from '@/components/StarBurst';
import { TRAIN, trainWidth } from '@/components/train/geometry';
import { Train } from '@/components/train/Train';
import { TRACK } from '@/data/scenery';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { useOscillator } from '@/hooks/useOscillator';
import { useSay } from '@/hooks/useSay';
import { useTranslation, type TranslationKey } from '@/i18n';
import { audio } from '@/services/audio';
import { haptics } from '@/services/haptics';
import type { TripEntry } from '@/services/progress';
import { useProgress, type TripResult } from '@/services/ProgressProvider';
import { colors, rainbow, sizes, springs } from '@/theme';
import { NumberToken, numberTokenSize } from '@/stations/number/NumberToken';

type Phase = 'arriving' | 'party' | 'leaving' | 'stickers' | 'done';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Sample trip for previewing the celebration in development (`/celebration?demo=1`). */
const DEMO_TRIP: TripResult = {
  passengers: [
    { kind: 'catalog', id: 'cat' },
    { kind: 'catalog', id: 'teddy' },
    { kind: 'number', value: 12 },
    { kind: 'catalog', id: 'duck' },
    { kind: 'catalog', id: 'car', tint: colors.blue },
  ],
  newStickers: ['cat', 'teddy', 'duck'],
};

/**
 * Big celebration when the trip train is full: the train arrives with all
 * its passengers, whistles, everyone dances under confetti and stars; then
 * the train leaves and the new album stickers are revealed one by one.
 */
export default function CelebrationScreen() {
  const { t } = useTranslation();
  const say = useSay();
  const { width: W, height: H, safe, s } = useDeviceLayout();
  const { takeTrip } = useProgress();
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const guard = useNavigationLock();
  const [result, setResult] = useState<TripResult | null>(null);
  const [phase, setPhase] = useState<Phase>('arriving');
  const [shownStickers, setShownStickers] = useState(0);

  const passengers = result?.passengers ?? [];
  const wagonCount = Math.max(1, passengers.length);

  // ---- Train with one wagon per passenger, centered ---------------------------
  const u = Math.min(H * 0.22, (W - safe.left - safe.right - s(20)) / trainWidth(wagonCount));
  const trainW = trainWidth(wagonCount) * u;
  const trainLeft = (W - trainW) / 2;
  const trainTop = H * TRACK.y - u * (1 + TRAIN.smokeHeight);
  const wagonColors = Array.from({ length: wagonCount }, (_, i) => rainbow[i % rainbow.length]);
  const riderSize = TRAIN.wagonWidth * u * 0.8;

  const trainX = useSharedValue(-(trainLeft + trainW + s(40)));
  const trainSpeed = useSharedValue(0);
  const dancing = useSharedValue(0);
  const trainStyle = useAnimatedStyle(() => ({ transform: [{ translateX: trainX.value }] }));

  // ---- Flow ------------------------------------------------------------------
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const run = async () => {
      // Empty the trip train into the album (once), and keep who rode along.
      // Dev only: `/celebration?demo=1` shows sample passengers without touching progress.
      const trip = __DEV__ && demo === '1' ? DEMO_TRIP : takeTrip();
      setResult(trip);
      if (trip.passengers.length === 0) {
        router.back();
        return;
      }
      // 1. The full train rolls in.
      await wait(300);
      audio.playSfx('chug');
      trainSpeed.set(withTiming(s(120), { duration: 300 }));
      trainX.set(withTiming(0, { duration: 2000, easing: Easing.out(Easing.cubic) }));
      setTimeout(() => trainSpeed.set(withTiming(0, { duration: 600 })), 1500);
      await wait(2100);
      if (!alive.current) return;
      // 2. Party! Whistle, confetti, stars, everybody dances.
      setPhase('party');
      audio.playSfx('whistle');
      setTimeout(() => audio.playSfx('confetti'), 300);
      setTimeout(() => audio.playSfx('applause'), 600);
      haptics.success();
      dancing.set(withTiming(1, { duration: 300 }));
      await say('speech.trainFull');
      await wait(2200);
      if (!alive.current) return;
      // 3. Off goes the train...
      setPhase('leaving');
      dancing.set(withTiming(0, { duration: 300 }));
      audio.playSfx('whistle');
      trainSpeed.set(withTiming(s(160), { duration: 1500 }));
      trainX.set(withTiming(W + trainW, { duration: 2400, easing: Easing.in(Easing.quad) }));
      await wait(2000);
      if (!alive.current) return;
      // 4. ...and the new stickers pop in, one by one.
      setPhase('stickers');
      for (let i = 0; i < trip.newStickers.length; i++) {
        await wait(450);
        if (!alive.current) return;
        setShownStickers(i + 1);
        audio.playSfx('sticker');
      }
      await wait(400);
      if (!alive.current) return;
      const n = trip.newStickers.length;
      if (n === 0) await say('speech.noNewStickers');
      else if (n === 1) await say('speech.newSticker');
      else await say('speech.newStickers', { count: t(`numbers.n${n}` as TranslationKey) });
      if (alive.current) setPhase('done');
    };
    void run();
    return () => {
      alive.current = false;
      audio.stopSpeech();
    };
    // Runs once: this screen is one celebration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Sticker reveal layout ------------------------------------------------------
  const newStickers = result?.newStickers ?? [];
  const stickerSize = Math.min(H * 0.32, (W - safe.left - safe.right) / (Math.max(1, newStickers.length) + 1));
  const stickerGap = s(16);
  const rowW = newStickers.length * stickerSize + Math.max(0, newStickers.length - 1) * stickerGap;
  const stickerTop = safe.top + (H * 0.62 - safe.top - stickerSize) / 2;

  return (
    <View style={styles.root}>
      <ParallaxBackground track />

      <Animated.View style={[styles.abs, { left: trainLeft, top: trainTop }, trainStyle]} pointerEvents="box-none">
        <Train
          u={u}
          travel={trainX}
          speed={trainSpeed}
          wagonColors={wagonColors}
          passengers={passengers.map((p, i) => (
            <Dancer key={i} index={i} dancing={dancing} size={riderSize}>
              <Passenger entry={p} size={riderSize} />
            </Dancer>
          ))}
        />
      </Animated.View>

      {phase === 'party' && (
        <>
          <View style={[styles.abs, { left: W * 0.25 - H * 0.25, top: H * 0.05 }]} pointerEvents="none">
            <StarBurst size={H * 0.5} />
          </View>
          <View style={[styles.abs, { left: W * 0.75 - H * 0.25, top: H * 0.08 }]} pointerEvents="none">
            <StarBurst size={H * 0.5} />
          </View>
          <Confetti />
        </>
      )}

      {(phase === 'stickers' || phase === 'done') &&
        newStickers.slice(0, shownStickers).map((id, i) => (
          // Pop-in on the outer layer, the sticker's tilt on the inner one.
          <Animated.View
            key={id}
            entering={ZoomIn.springify().damping(9)}
            style={[styles.abs, { left: (W - rowW) / 2 + i * (stickerSize + stickerGap), top: stickerTop }]}
          >
            <View
              style={[
                styles.sticker,
                {
                  width: stickerSize,
                  height: stickerSize,
                  borderRadius: sizes.radius.md,
                  transform: [{ rotate: `${(i % 2 === 0 ? -1 : 1) * 5}deg` }],
                },
              ]}
            >
              <Sprite id={id} size={stickerSize * 0.82} />
            </View>
          </Animated.View>
        ))}

      {phase === 'done' && (
        <Animated.View
          entering={ZoomIn.springify()}
          style={[styles.abs, styles.buttons, { left: 0, right: 0, bottom: safe.bottom + s(16), gap: s(40) }]}
        >
          <AlbumButton
            scale={1.4}
            accessibilityLabel={t('ui.album')}
            onPress={() => guard(() => router.replace('/album'))}
          />
          <PlayButton accessibilityLabel={t('ui.continue')} onPress={() => guard(() => router.back())} />
        </Animated.View>
      )}
    </View>
  );
}

/** A passenger on the celebration train: a character, or a traced big number. */
function Passenger({ entry, size }: { entry: TripEntry; size: number }) {
  if (entry.kind === 'catalog') return <Sprite id={entry.id} tint={entry.tint} size={size} interactive={false} happy />;
  const height = Math.min(size * 0.7, size / numberTokenSize(entry.value, 1).width);
  return <NumberToken value={entry.value} height={height} />;
}

/** Makes its child hop and wiggle to the music while `dancing` is 1. */
function Dancer({
  index,
  dancing,
  size,
  children,
}: {
  index: number;
  dancing: SharedValue<number>;
  size: number;
  children: ReactNode;
}) {
  const bounce = useOscillator(260 + (index % 3) * 40, index);
  const tilt = useOscillator(420, index + 7);
  const pop = useSharedValue(0.6);
  useEffect(() => {
    pop.set(withSpring(1, springs.bouncy));
  }, [pop]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -Math.abs(bounce.value) * size * 0.22 * dancing.value },
      { rotate: `${tilt.value * 12 * dancing.value}deg` },
      { scale: pop.value },
    ],
  }));
  return <Animated.View style={[{ transformOrigin: '50% 100%' }, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  abs: { position: 'absolute' },
  sticker: {
    backgroundColor: colors.white,
    borderWidth: 5,
    borderColor: colors.sunGlow,
    alignItems: 'center',
    justifyContent: 'flex-end',
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  buttons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
