import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { BackButton } from '@/components/BackButton';
import { CategoryCard } from '@/components/CategoryCard';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { isTypeFullyLocked } from '@/data/access';
import { CATEGORIES, type CategoryDef } from '@/data/categories';
import { getStationsOfType, pickNextStation } from '@/data/stations';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { useTripCelebration } from '@/hooks/useTripCelebration';
import { useTranslation, type TranslationKey } from '@/i18n';
import { audio } from '@/services/audio';
import { usePremium } from '@/services/PremiumProvider';
import { useProgress } from '@/services/ProgressProvider';

/**
 * Category menu (after "Play"): one big card per kind of station (letters,
 * numbers, and later animals and vehicles). Picking one opens its stations.
 */
export default function CategoryMenuScreen() {
  const { t, language } = useTranslation();
  const { safe, s, width: W, height: H } = useDeviceLayout();
  const { isCompleted } = useProgress();
  const { isPremium } = usePremium();
  const guard = useNavigationLock();
  // A full trip train (e.g. a station left early) still gets its celebration.
  useTripCelebration();

  // Only categories that actually have stations (new types appear automatically).
  const categories = CATEGORIES.map((category) => {
    const stations = getStationsOfType(language, category.stationType);
    return {
      category,
      total: stations.length,
      completed: stations.filter((st) => isCompleted(language, st.id)).length,
    };
  }).filter((c) => c.total > 0);

  // Cards share the width; tall enough to read well but never taller than the screen.
  // Tighter gaps when there are many cards, so each card stays big.
  const gap = s(categories.length > 3 ? 22 : 36);
  const available = W - safe.left - safe.right - gap * (categories.length + 1);
  const cardWidth = Math.min(available / categories.length, (H - safe.top - safe.bottom) * 0.62, s(300));

  const open = (category: CategoryDef, name: string) => {
    audio.playSfx('pop');
    void audio.say(name, { language, clipId: `categories.${category.id}` });
    if (!isPremium && isTypeFullyLocked(category.stationType)) {
      // A fully premium category: "ask a grown-up" (the purchase is behind the parent gate).
      guard(() => router.push('/unlock'));
      return;
    }
    if (category.direct) {
      // Quizzes skip the list: straight to a question the child doesn't know yet.
      const next = pickNextStation(language, category.stationType, (id) => isCompleted(language, id));
      if (next) guard(() => router.push({ pathname: '/station/[id]', params: { id: next.id } }));
      return;
    }
    guard(() => router.push({ pathname: '/map/[category]', params: { category: category.id } }));
  };

  return (
    <View style={styles.root}>
      <ParallaxBackground />

      <View style={[styles.row, { gap, paddingTop: safe.top, paddingBottom: safe.bottom }]} pointerEvents="box-none">
        {categories.map(({ category, total, completed }, i) => {
          const name = t(`categories.${category.id}` as TranslationKey);
          return (
            <Animated.View key={`${language}-${category.id}`} entering={ZoomIn.delay(i * 120).springify()}>
              <CategoryCard
                category={category}
                label={name}
                width={cardWidth}
                completed={completed}
                total={total}
                locked={!isPremium && isTypeFullyLocked(category.stationType)}
                onPress={() => open(category, name)}
              />
            </Animated.View>
          );
        })}
      </View>

      <View style={[styles.topLeft, { top: safe.top, left: safe.left }]}>
        <BackButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topLeft: { position: 'absolute', zIndex: 10 },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
