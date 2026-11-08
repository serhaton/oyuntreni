import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { BackButton } from '@/components/BackButton';
import { Bouncy } from '@/components/Bouncy';
import { CheckBadge } from '@/components/CheckBadge';
import { LockBadge } from '@/components/LockBadge';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { Sprite } from '@/components/Sprite';
import { TrackSegment } from '@/components/TrackSegment';
import { TRAIN, trainWidth } from '@/components/train/geometry';
import { Train } from '@/components/train/Train';
import { getCategory } from '@/data/categories';
import { canPlay } from '@/data/access';
import { getStationsOfType, stationIcon, stationLabel } from '@/data/stations';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { useTripCelebration } from '@/hooks/useTripCelebration';
import { useTranslation } from '@/i18n';
import { audio } from '@/services/audio';
import { usePremium } from '@/services/PremiumProvider';
import { useProgress } from '@/services/ProgressProvider';
import type { StationDef } from '@/stations/types';
import { colors, fonts, rainbow } from '@/theme';

/** Taps right after a scroll stops are treated as part of the scroll. */
const SCROLL_TAP_COOLDOWN_MS = 250;

/** Font size (as a share of the marker) so long labels like "1000" still fit. */
function labelScale(label: string): number {
  if (label.length <= 2) return 0.5;
  return label.length === 3 ? 0.36 : 0.28;
}

/**
 * The stations of one category (e.g. all letters) on a winding railway line.
 * Every station is open; completed ones show a check, the next one to do
 * pulses, and the little train waits in front of it. The line scrolls to
 * that station automatically.
 */
export default function CategoryMapScreen() {
  const { category: categoryId } = useLocalSearchParams<{ category: string }>();
  const { t, language } = useTranslation();
  const { safe, s, touchTarget, width: W, height: H } = useDeviceLayout();
  const category = categoryId ? getCategory(categoryId) : undefined;
  const stations = category ? getStationsOfType(language, category.stationType) : [];
  // Letters come in upper/lower pairs: give each pair one color.
  const pairUp = category?.stationType === 'letter';
  const { isCompleted } = useProgress();
  // Fast double taps must not open two stations on top of each other.
  const guard = useNavigationLock();
  // A full trip train (e.g. a station left early) still gets its celebration.
  useTripCelebration();

  // The next station to do: the first one not completed yet (or the last one).
  const { isPremium } = usePremium();
  const playable = (st: StationDef) => canPlay(st, language, isPremium);
  // The next station to do: the first playable one not completed yet; then
  // the first locked one (the train waits there); else the last station.
  const firstOpen = stations.findIndex((st) => playable(st) && !isCompleted(language, st.id));
  const firstLocked = stations.findIndex((st) => !playable(st));
  const nextIndex = firstOpen >= 0 ? firstOpen : firstLocked >= 0 ? firstLocked : stations.length - 1;

  // ---- Line layout: stations zig-zag along a horizontal railway ---------------
  const markerSize = Math.max(touchTarget, s(76));
  const step = markerSize + s(30);
  const u = markerSize * 0.42; // size of the little "you are here" train
  const lead = trainWidth(0) * u + s(16); // room before the first station for the train
  const padLeft = safe.left + touchTarget + s(24) + lead;
  const padRight = safe.right + s(32);
  const contentWidth = Math.max(W, padLeft + (stations.length - 1) * step + markerSize + padRight);
  // Short lines (like 1–20) are centered instead of starting at the left.
  const shift = Math.max(0, (W - (padLeft + (stations.length - 1) * step + markerSize + padRight)) / 2);
  const midY = H * 0.5;
  const swing = s(42);
  const centerOf = (i: number) => ({
    x: shift + padLeft + i * step + markerSize / 2,
    y: midY + (i % 2 === 0 ? -swing : swing),
  });
  const trackWidth = markerSize * 0.32;

  // ---- Scrolling -----------------------------------------------------------------
  const scrollRef = useRef<ScrollViewInstance>(null);
  // Scroll position that puts the next station in the middle of the screen.
  const scrollTarget = stations.length > 0 ? Math.max(0, centerOf(nextIndex).x - W / 2) : 0;
  // Jump there when the screen opens, then glide there whenever the child
  // comes back from a station (the next station may have moved on).
  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollTo({ x: scrollTarget, animated: false }), 50);
    return () => clearTimeout(timer);
    // only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => scrollRef.current?.scrollTo({ x: scrollTarget, animated: true }), 350);
      return () => clearTimeout(timer);
    }, [scrollTarget]),
  );

  // While the track is scrolling (and for a moment after), taps on stations
  // are ignored: in React Native, the tap that stops a scroll (or a slow drag
  // ending on a marker) would otherwise open that station by itself.
  const scrolling = useRef(false);
  const scrollEndedAt = useRef(0);
  const markScrollStart = useCallback(() => {
    scrolling.current = true;
  }, []);
  const markScrollEnd = useCallback(() => {
    scrolling.current = false;
    scrollEndedAt.current = Date.now();
  }, []);
  // A locked station opens the "ask a grown-up" screen (purchase is behind the parent gate there).
  const openLocked = useCallback(() => {
    if (scrolling.current || Date.now() - scrollEndedAt.current < SCROLL_TAP_COOLDOWN_MS) return;
    guard(() => router.push('/unlock'));
  }, [guard]);
  const openStation = useCallback(
    (id: string) => {
      if (scrolling.current || Date.now() - scrollEndedAt.current < SCROLL_TAP_COOLDOWN_MS) return;
      guard(() => router.push({ pathname: '/station/[id]', params: { id } }));
    },
    [guard],
  );

  // The little train sits on the track just before the next station.
  const trainCenter = stations.length > 0 ? centerOf(nextIndex) : { x: 0, y: 0 };
  const trainLeft = trainCenter.x - markerSize / 2 - s(8) - trainWidth(0) * u;
  const trainTop = trainCenter.y + u * 0.45 - u * (1 + TRAIN.smokeHeight);
  const parked = useSharedValue(0);
  const parkedSpeed = useSharedValue(0);

  return (
    <View style={styles.root}>
      <ParallaxBackground />

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={markScrollStart}
        onMomentumScrollBegin={markScrollStart}
        onScrollEndDrag={(e) => {
          // If the finger flicked, momentum follows and keeps "scrolling" true.
          if (Math.abs(e.nativeEvent.velocity?.x ?? 0) < 0.05) markScrollEnd();
        }}
        onMomentumScrollEnd={markScrollEnd}
        accessibilityLabel={t('ui.map')}
      >
        <View style={{ width: contentWidth, height: H }}>
          {/* Railway between the stations (drawn first, so it's underneath) */}
          {stations.slice(1).map((st, i) => (
            <TrackSegment key={`track-${st.id}`} from={centerOf(i)} to={centerOf(i + 1)} width={trackWidth} />
          ))}

          {/* "You are here": the little train waiting at the next station */}
          {stations.length > 0 && (
            <View style={[styles.abs, { left: trainLeft, top: trainTop }]} pointerEvents="box-none">
              <Train
                u={u}
                travel={parked}
                speed={parkedSpeed}
                wagonColors={[]}
                onPress={() => audio.playSfx('chug')}
              />
            </View>
          )}

          {stations.map((station, i) => {
            const c = centerOf(i);
            return (
              <Animated.View
                key={`${language}-${station.id}`}
                entering={ZoomIn.delay(Math.min(Math.abs(i - nextIndex), 10) * 50).springify()}
                style={[styles.abs, { left: c.x - markerSize / 2, top: c.y - markerSize / 2 }]}
              >
                {i === nextIndex && <NextPulse size={markerSize} />}
                <Bouncy
                  accessibilityLabel={playable(station) ? t('ui.station', { number: i + 1 }) : t('ui.locked')}
                  onPress={() => (playable(station) ? openStation(station.id) : openLocked())}
                >
                  <View
                    style={[
                      styles.marker,
                      {
                        width: markerSize,
                        height: markerSize,
                        borderRadius: markerSize / 2,
                        borderWidth: s(5),
                        backgroundColor: rainbow[(pairUp ? Math.floor(i / 2) : i) % rainbow.length],
                      },
                    ]}
                  >
                    <MarkerContent station={station} markerSize={markerSize} />
                    {!playable(station) && (
                      // A soft white veil fades the locked station; the lock badge drawn after it stays bright.
                      <View pointerEvents="none" style={[styles.veil, { borderRadius: markerSize / 2 }]} />
                    )}
                    {!playable(station) && (
                      <View style={[styles.badge, { right: -markerSize * 0.14, bottom: -markerSize * 0.1 }]}>
                        <LockBadge size={markerSize * 0.46} />
                      </View>
                    )}
                    {isCompleted(language, station.id) && (
                      <Animated.View
                        entering={ZoomIn.springify()}
                        style={[styles.badge, { right: -markerSize * 0.12, top: -markerSize * 0.12 }]}
                      >
                        <CheckBadge size={markerSize * 0.42} />
                      </Animated.View>
                    )}
                  </View>
                </Bouncy>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.topLeft, { top: safe.top, left: safe.left }]}>
        <BackButton />
      </View>
    </View>
  );
}

/** A soft glowing ring that pulses around the next station: "play me!". */
function NextPulse({ size }: { size: number }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }), -1));
  }, [pulse]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.8 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.55 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pulse, { width: size, height: size, borderRadius: size / 2, borderWidth: size * 0.08 }, style]}
    />
  );
}

/** What's inside a marker: the letter/number, or a little picture (animals, vehicles). */
function MarkerContent({ station, markerSize }: { station: StationDef; markerSize: number }) {
  const icon = stationIcon(station);
  if (icon) {
    return <Sprite id={icon.id} tint={icon.tint} size={markerSize * 0.72} interactive={false} />;
  }
  const label = stationLabel(station) ?? '';
  return (
    <Text style={[styles.markerText, { fontSize: markerSize * labelScale(label) }]} allowFontScaling={false}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  abs: { position: 'absolute' },
  topLeft: { position: 'absolute', zIndex: 10 },
  marker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.white,
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 5 },
  },
  pulse: { position: 'absolute', left: 0, top: 0, borderColor: colors.sunGlow },
  badge: { position: 'absolute' },
  veil: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.5)' },
  markerText: {
    fontFamily: fonts.bold,
    color: colors.white,
    textShadowColor: colors.ink,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
});
