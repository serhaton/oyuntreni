import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { canPlay } from '@/data/access';
import { getCategoryForType } from '@/data/categories';
import { getStationById, pickNextStation, stationPassenger } from '@/data/stations';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { useTranslation } from '@/i18n';
import { usePremium } from '@/services/PremiumProvider';
import { useProgress } from '@/services/ProgressProvider';
import { StationView } from '@/stations';

/**
 * Station screen: shared scenery + back button, then the module for the
 * station's type (letter, number, ...) does the rest. In "direct" categories
 * (animals, vehicles) finishing a question opens the next one; the back button
 * always returns to the menu.
 */
export default function StationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language } = useTranslation();
  const { safe } = useDeviceLayout();
  const station = id ? getStationById(language, id) : undefined;
  const { markCompleted, isCompleted, addToTrip, settleFullTrip } = useProgress();
  const { isPremium } = usePremium();
  // Safety net: a locked station reached any other way goes to the "ask a grown-up" screen.
  const locked = station ? !canPlay(station, language, isPremium) : false;
  useEffect(() => {
    if (locked) router.replace('/unlock');
  }, [locked]);
  // Quizzes (animals, vehicles) go from one question straight to the next.
  const direct = station ? getCategoryForType(station.type)?.direct === true : false;

  // Solved: remember it, and its passenger hops on the trip train.
  const onSolved = useCallback(() => {
    if (!station) return;
    markCompleted(language, station.id);
    addToTrip({ ...stationPassenger(station), language });
  }, [station, language, markCompleted, addToTrip]);

  // The station ending and the back button share one lock, so leaving can
  // only happen once even if both fire at the same moment.
  const guard = useNavigationLock();
  const leave = useCallback(
    () =>
      guard(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/map');
      }),
    [guard],
  );

  // When a station is finished: a full trip train with a new sticker means a
  // big celebration first; otherwise back to the list, or on to the next question.
  const onDone = useCallback(() => {
    if (settleFullTrip(language)) {
      guard(() => router.replace('/celebration'));
      return;
    }
    if (!direct || !station) {
      leave();
      return;
    }
    const next = pickNextStation(language, station.type, (sid) => isCompleted(language, sid), station.id);
    if (!next) {
      leave();
      return;
    }
    guard(() => router.replace({ pathname: '/station/[id]', params: { id: next.id } }));
  }, [direct, station, language, isCompleted, settleFullTrip, leave, guard]);

  return (
    <View style={styles.root}>
      <ParallaxBackground track />
      {station && !locked && <StationView key={station.id} station={station} onSolved={onSolved} onDone={onDone} />}
      <View style={[styles.back, { top: safe.top, left: safe.left }]}>
        <BackButton onPress={leave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { position: 'absolute', zIndex: 10 },
});
