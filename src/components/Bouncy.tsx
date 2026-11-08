import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { audio, type SfxId } from '@/services/audio';
import { haptics } from '@/services/haptics';
import { durations, springs, squash } from '@/theme';

interface BouncyProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  /** Spoken by VoiceOver; take it from the i18n layer, never hard-code. */
  accessibilityLabel?: string;
  /** Light haptic tick on press (default true). */
  haptic?: boolean;
  /** Extra invisible touch area around small items. */
  hitSlop?: number;
  /** Sound effect on press (default 'pop'); null for silence. */
  sfx?: SfxId | null;
}

/**
 * Wrap anything to make it react to touch with squash & stretch:
 *   press  -> squashes (wide & short)
 *   release-> stretches (tall & thin) and springs back with a wobble
 *
 * All animation runs on the UI thread via Reanimated shared values.
 */
export function Bouncy({
  children,
  onPress,
  style,
  accessibilityLabel,
  haptic = true,
  hitSlop = 8,
  sfx = 'pop',
}: BouncyProps) {
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: scaleX.value }, { scaleY: scaleY.value }],
  }));

  const handlePressIn = () => {
    scaleX.set(withTiming(squash.scaleX, { duration: durations.fast }));
    scaleY.set(withTiming(squash.scaleY, { duration: durations.fast }));
  };

  const handlePressOut = () => {
    // Overshoot the other way (stretch) before settling: classic cartoon bounce.
    scaleX.set(withSequence(
      withTiming(0.9, { duration: durations.fast }),
      withSpring(1, springs.bouncy),
    ));
    scaleY.set(withSequence(
      withTiming(1.12, { duration: durations.fast }),
      withSpring(1, springs.bouncy),
    ));
  };

  const handlePress = () => {
    if (haptic) haptics.tap();
    if (sfx) audio.playSfx(sfx);
    onPress?.();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}
