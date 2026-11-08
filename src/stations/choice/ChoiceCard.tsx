import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CheckBadge } from '@/components/CheckBadge';
import { Sprite } from '@/components/Sprite';
import type { CatalogId } from '@/data/catalog';
import { colors, sizes, springs } from '@/theme';

interface ChoiceCardProps {
  id: CatalogId;
  tint?: string;
  width: number;
  height: number;
  /** Changes each time this card was a wrong pick: triggers a gentle wiggle. */
  wiggleKey: number;
  /** This card is the right answer and was picked. */
  correct: boolean;
  /** Hide the character (it has left the card to board the train). */
  emptied: boolean;
  disabled: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}

/**
 * A big card with one character on it. A wrong pick makes it wiggle softly
 * ("not this one"); the right one jumps for joy and gets a green check.
 */
export function ChoiceCard({
  id,
  tint,
  width,
  height,
  wiggleKey,
  correct,
  emptied,
  disabled,
  accessibilityLabel,
  onPress,
}: ChoiceCardProps) {
  const spriteSize = width * 0.8;
  const shake = useSharedValue(0);
  const hop = useSharedValue(0);
  const press = useSharedValue(1);

  useEffect(() => {
    if (wiggleKey === 0) return;
    shake.set(
      withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 90 }),
        withTiming(-5, { duration: 90 }),
        withTiming(4, { duration: 80 }),
        withSpring(0, springs.bouncy),
      ),
    );
  }, [wiggleKey, shake]);

  useEffect(() => {
    if (!correct) return;
    hop.set(
      withSequence(
        withTiming(-height * 0.12, { duration: 180, easing: Easing.out(Easing.quad) }),
        withSpring(0, springs.bouncy),
        withTiming(-height * 0.08, { duration: 160, easing: Easing.out(Easing.quad) }),
        withSpring(0, springs.bouncy),
      ),
    );
  }, [correct, hop, height]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }, { translateY: hop.value }, { scale: press.value }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => press.set(withTiming(0.94, { duration: 90 }))}
      onPressOut={() => press.set(withSpring(1, springs.bouncy))}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View
        style={[
          styles.card,
          {
            width,
            height,
            borderRadius: sizes.radius.lg,
            borderColor: correct ? colors.grass : colors.sun,
            borderWidth: Math.max(4, width * 0.03),
          },
          style,
        ]}
      >
        <View style={[styles.spriteBox, { width: spriteSize, height: spriteSize, opacity: emptied ? 0 : 1 }]}>
          <Sprite id={id} size={spriteSize} tint={tint} interactive={false} happy={correct} />
        </View>
        {correct && (
          <View style={[styles.check, { right: -width * 0.08, top: -width * 0.08 }]}>
            <CheckBadge size={width * 0.3} />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
  spriteBox: {},
  check: { position: 'absolute' },
});
