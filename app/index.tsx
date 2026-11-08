import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import { AlbumButton } from '@/components/AlbumButton';
import { BouncyTitle } from '@/components/BouncyTitle';
import { INTRO_DURATION_MS } from '@/components/IntroSplash';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { PlayButton } from '@/components/PlayButton';
import { SettingsButton } from '@/components/SettingsButton';
import { TRAIN } from '@/components/train/geometry';
import { Train } from '@/components/train/Train';
import { TRACK } from '@/data/scenery';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { useFrameClock } from '@/hooks/useFrameClock';
import { useScreenFocused } from '@/hooks/useScreenFocused';
import { useSay } from '@/hooks/useSay';
import { useTripCelebration } from '@/hooks/useTripCelebration';
import { useTranslation } from '@/i18n';
import { audio } from '@/services/audio';
import { colors } from '@/theme';

const WAGON_COLORS = [colors.candyPink, colors.orange] as const;

/** The welcome sentence is spoken only once per app launch, not on every visit. */
let greeted = false;

/**
 * Welcome screen: title at the top, the child's train chugging along the
 * track, and the big Play button waiting on the right like a station sign.
 */
export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { safe, s, width: W, height: H } = useDeviceLayout();

  // Train speed (points/second) and the distance it has travelled.
  // The background scrolls by the same distance, so the train seems to move.
  const cruise = s(40);
  const speed = useSharedValue(cruise);
  // The world only scrolls while this screen is visible (saves battery underneath other screens).
  const focused = useScreenFocused();
  const travel = useFrameClock(speed, focused);

  // A fast double tap on Play must open the map only once.
  const guard = useNavigationLock();
  // A full trip train (e.g. a station left early) still gets its celebration.
  useTripCelebration();

  // Greet the child once per app launch ("Hello! Let's ride the train!").
  const say = useSay();
  useEffect(() => {
    if (greeted) return;
    greeted = true;
    // After the opening intro has finished.
    const timer = setTimeout(() => void say('speech.welcome'), INTRO_DURATION_MS + 500);
    return () => clearTimeout(timer);
  }, [say]);

  // Whistle (played by the train itself), then chug-chug while speeding up
  // for a moment before calmly slowing back down.
  const onTrainPress = () => {
    setTimeout(() => audio.playSfx('chug'), 450);
    speed.set(
      withSequence(
        withTiming(cruise * 4, { duration: 500 }),
        withDelay(1500, withTiming(cruise, { duration: 1500 })),
      ),
    );
  };

  // Train size: fits the height on phones, doesn't take over the width on iPads.
  const u = Math.min(H * 0.24, W * 0.13);
  const railY = H * TRACK.y;
  const trainTop = railY - u * (1 + TRAIN.smokeHeight);

  return (
    <View style={styles.root}>
      <ParallaxBackground scroll={travel} track />

      <View style={[styles.abs, { top: trainTop, left: safe.left }]} pointerEvents="box-none">
        <Train u={u} travel={travel} speed={speed} wagonColors={WAGON_COLORS} onPress={onTrainPress} />
      </View>

      {/* Title centered in the open sky between the top of the screen and the train roof. */}
      <View
        style={[styles.abs, styles.titleRow, { top: safe.top, height: railY - u - safe.top }]}
        pointerEvents="box-none"
      >
        <BouncyTitle text={t('app.title')} />
      </View>

      {/* Settings (behind the parent gate) in the top-right corner. */}
      <View style={[styles.abs, styles.top, { top: safe.top, right: safe.right }]}>
        <SettingsButton accessibilityLabel={t('ui.settings')} onPress={() => guard(() => router.push('/parents'))} />
      </View>

      {/* Sticker album in the top-left corner. */}
      <View style={[styles.abs, styles.top, { top: safe.top, left: safe.left }]}>
        <AlbumButton accessibilityLabel={t('ui.album')} onPress={() => guard(() => router.push('/album'))} />
      </View>

      <View style={[styles.abs, { right: safe.right + s(30), bottom: H - railY + s(14) }]}>
        <PlayButton accessibilityLabel={t('ui.play')} onPress={() => guard(() => router.push('/map'))} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  abs: { position: 'absolute' },
  top: { zIndex: 10 },
  titleRow: { left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
});
