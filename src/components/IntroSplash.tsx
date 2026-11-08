import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useTranslation } from '@/i18n';
import { audio } from '@/services/audio';
import { colors } from '@/theme';

import { BouncyTitle } from './BouncyTitle';
import { Sprite } from './Sprite';
import { trainWidth } from './train/geometry';
import { Train } from './train/Train';

/**
 * Must match the native splash screen in app.json (expo-splash-screen:
 * backgroundColor and imageWidth), so the hand-over is seamless: the native
 * splash shows assets/splash.png (a picture of this same train, rendered from
 * the app's own Skia art), then this animated intro takes over.
 */
export const SPLASH = {
  backgroundColor: '#4FC3F7',
  /** Width of the train picture on the native splash, in points. */
  imageWidth: 300,
  wagonColors: [colors.candyPink, colors.orange],
  passengers: ['cat', 'duck'],
} as const;

/** How long the intro is shown on every launch. */
export const INTRO_DURATION_MS = 2000;
const START_MS = 300; // the train waits a moment, like on the native splash
const FADE_MS = 400;

/**
 * Opening scene, shown for INTRO_DURATION_MS on every launch (also in Expo Go,
 * which doesn't show native splash screens): the splash train whistles and
 * rolls away to the right while the game's name bounces in, then everything
 * fades into the home screen.
 */
export function IntroSplash({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const { width: W, height: H } = useDeviceLayout();

  const cars = SPLASH.wagonColors.length;
  const u = SPLASH.imageWidth / trainWidth(cars);
  const trainW = SPLASH.imageWidth;
  const trainH = u * 2; // smoke room (1u) + the train (1u), same as the splash picture

  const x = useSharedValue(0);
  const travel = useSharedValue(0);
  const speed = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const drive = INTRO_DURATION_MS - START_MS - FADE_MS;
    const distance = W / 2 + trainW;
    const ride = { duration: drive, easing: Easing.in(Easing.quad) };
    x.set(withDelay(START_MS, withTiming(distance, ride)));
    travel.set(withDelay(START_MS, withTiming(distance, ride)));
    speed.set(withDelay(START_MS, withTiming(distance / (drive / 1000), { duration: drive })));
    opacity.set(withDelay(INTRO_DURATION_MS - FADE_MS, withTiming(0, { duration: FADE_MS })));

    const whistle = setTimeout(() => audio.playSfx('whistle'), START_MS);
    const chug = setTimeout(() => audio.playSfx('chug'), START_MS + 350);
    const done = setTimeout(onDone, INTRO_DURATION_MS);
    return () => {
      clearTimeout(whistle);
      clearTimeout(chug);
      clearTimeout(done);
    };
    // Runs once: the intro plays a fixed timeline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const driveStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Animated.View style={[styles.fill, { backgroundColor: SPLASH.backgroundColor }, fadeStyle]}>
      <View style={[styles.title, { bottom: H / 2 + trainH / 2 + u * 0.1 }]} pointerEvents="none">
        <Animated.View entering={ZoomIn.delay(START_MS).springify()}>
          <BouncyTitle text={t('app.title')} />
        </Animated.View>
      </View>
      <Animated.View
        pointerEvents="none"
        style={[styles.abs, { left: (W - trainW) / 2, top: (H - trainH) / 2 }, driveStyle]}
      >
        <Train
          u={u}
          travel={travel}
          speed={speed}
          wagonColors={SPLASH.wagonColors}
          passengers={SPLASH.passengers.map((id, i) => (
            <Sprite key={id} id={id} size={u * 0.8} interactive={false} happy seed={i} />
          ))}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, zIndex: 100 },
  abs: { position: 'absolute' },
  title: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
