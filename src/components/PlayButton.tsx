import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { colors } from '@/theme';

import { Bouncy } from './Bouncy';

interface PlayButtonProps {
  onPress?: () => void;
  accessibilityLabel: string;
}

/** Big round "play" button with a soft pulse that invites the child to tap it. */
export function PlayButton({ onPress, accessibilityLabel }: PlayButtonProps) {
  const { s, touchTarget } = useDeviceLayout();
  const size = Math.max(s(110), touchTarget * 1.4);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.set(withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    ));
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.07 }],
  }));

  // The canvas lives INSIDE the white border (absolute children of a bordered
  // view start inside the border), so the drawing is centered in that inner area.
  const border = s(6);
  const inner = size - border * 2;

  // Rounded play triangle. Its center of mass sits exactly in the middle,
  // which is what makes a play triangle look centered to the eye.
  const triangle = useMemo(() => {
    const t = inner * 0.46;
    const cy = inner / 2;
    // Vertices at x = cx-0.4t, cx+0.5t, cx-0.4t -> centroid at cx-0.1t.
    const cx = inner / 2 + t * 0.1;
    const p = Skia.PathBuilder.Make();
    p.moveTo(cx - t * 0.4, cy - t * 0.5);
    p.lineTo(cx + t * 0.5, cy);
    p.lineTo(cx - t * 0.4, cy + t * 0.5);
    p.close();
    return p.build();
  }, [inner]);

  return (
    <Animated.View style={pulseStyle}>
      <Bouncy onPress={onPress} accessibilityLabel={accessibilityLabel}>
        <Animated.View
          style={[
            styles.circle,
            { width: size, height: size, borderRadius: size / 2, borderWidth: border },
          ]}
        >
          <Canvas style={{ position: 'absolute', left: 0, top: 0, width: inner, height: inner }}>
            <Path
              path={triangle}
              color={colors.white}
              style="fill"
              strokeJoin="round"
            />
            <Path
              path={triangle}
              color={colors.white}
              style="stroke"
              strokeWidth={size * 0.06}
              strokeJoin="round"
            />
          </Canvas>
        </Animated.View>
      </Bouncy>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.grass,
    borderColor: colors.white,
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
});
