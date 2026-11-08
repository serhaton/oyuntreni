import { StyleSheet, Text, View } from 'react-native';

import type { CategoryDef } from '@/data/categories';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { colors, fonts, rainbow, sizes } from '@/theme';

import { Bouncy } from './Bouncy';
import { LockBadge } from './LockBadge';
import { Sprite } from './Sprite';

interface CategoryCardProps {
  category: CategoryDef;
  /** Category name (already translated). */
  label: string;
  width: number;
  completed: number;
  total: number;
  /** Needs the full version: shows a padlock on the card. */
  locked?: boolean;
  onPress: () => void;
}

/**
 * A big, colorful category card: a huge sample ("Aa", "123") the child
 * recognizes without reading, a character peeking from the corner, the name
 * for grown-ups and a small progress bar.
 */
export function CategoryCard({ category, label, width, completed, total, locked = false, onPress }: CategoryCardProps) {
  const { s } = useDeviceLayout();
  const height = width * 1.15;
  const mascotSize = width * 0.42;
  const progress = total > 0 ? completed / total : 0;

  return (
    <Bouncy onPress={onPress} accessibilityLabel={label} sfx={null}>
      <View
        style={[
          styles.card,
          {
            width,
            height,
            borderRadius: sizes.radius.lg,
            borderWidth: s(6),
            backgroundColor: colors[category.color],
            padding: width * 0.08,
          },
        ]}
      >
        <View style={styles.sampleRow}>
          {category.hero ? (
            <Sprite id={category.hero} size={width * 0.62} interactive={false} />
          ) : (
            Array.from(category.sample ?? '').map((ch, i) => (
              <Text
                key={i}
                allowFontScaling={false}
                style={[
                  styles.sample,
                  {
                    fontSize: width * ((category.sample?.length ?? 0) > 2 ? 0.3 : 0.38),
                    color: i % 2 === 0 ? colors.white : rainbow[(i + 3) % rainbow.length],
                    textShadowOffset: { width: 0, height: width * 0.02 },
                  },
                ]}
              >
                {ch}
              </Text>
            ))
          )}
        </View>

        <Text allowFontScaling={false} style={[styles.label, { fontSize: width * 0.13 }]}>
          {label}
        </Text>

        {/* Progress (mostly for parents): how many are done, e.g. 3/8 animals known. */}
        <View style={styles.progressRow}>
          <View style={[styles.track, { height: width * 0.06, borderRadius: width * 0.03 }]}>
            <View style={[styles.fill, { width: `${Math.round(progress * 100)}%`, borderRadius: width * 0.03 }]} />
          </View>
          <Text allowFontScaling={false} style={[styles.count, { fontSize: width * 0.085 }]}>
            {completed}/{total}
          </Text>
        </View>

        {locked && (
          <View style={[styles.lock, { left: -width * 0.08, top: -width * 0.08 }]} pointerEvents="none">
            <LockBadge size={width * 0.34} />
          </View>
        )}
        {category.mascot && (
          <View style={[styles.mascot, { right: -mascotSize * 0.18, top: -mascotSize * 0.45 }]} pointerEvents="none">
            <Sprite id={category.mascot} size={mascotSize} interactive={false} />
          </View>
        )}
      </View>
    </Bouncy>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.white,
    justifyContent: 'space-between',
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
  },
  sampleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  sample: {
    fontFamily: fonts.bold,
    textShadowColor: colors.ink,
    textShadowRadius: 0,
  },
  label: {
    fontFamily: fonts.bold,
    color: colors.white,
    textAlign: 'center',
    textShadowColor: colors.ink,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
    marginBottom: 6,
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: {
    fontFamily: fonts.bold,
    color: colors.white,
    textShadowColor: colors.ink,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  track: { flex: 1, backgroundColor: 'rgba(255,255,255,0.45)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.white },
  mascot: { position: 'absolute' },
  lock: { position: 'absolute' },
});
