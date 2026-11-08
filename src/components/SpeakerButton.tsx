import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { colors } from '@/theme';

import { Bouncy } from './Bouncy';

interface SpeakerButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  /** Gently pulses, wiggles and sends out a ring: "tap me to hear it again!". */
  inviting?: boolean;
}

/** Big round "listen again" button with a drawn loudspeaker and sound waves. */
export function SpeakerButton({ onPress, accessibilityLabel, inviting = false }: SpeakerButtonProps) {
  const { touchTarget, s } = useDeviceLayout();
  const size = touchTarget * 1.1;
  // The canvas sits inside the border, so the icon is drawn for the inner area.
  const border = s(4);
  const inner = size - border * 2;

  const { speaker, waves } = useMemo(() => {
    const u = inner;
    const sp = Skia.PathBuilder.Make()
      .moveTo(u * 0.22, u * 0.4)
      .lineTo(u * 0.34, u * 0.4)
      .lineTo(u * 0.5, u * 0.26)
      .lineTo(u * 0.5, u * 0.74)
      .lineTo(u * 0.34, u * 0.6)
      .lineTo(u * 0.22, u * 0.6)
      .close()
      .build();
    const w = Skia.PathBuilder.Make()
      .addArc({ x: u * 0.42, y: u * 0.36, width: u * 0.2, height: u * 0.28 }, -50, 100)
      .addArc({ x: u * 0.4, y: u * 0.26, width: u * 0.34, height: u * 0.48 }, -50, 100)
      .build();
    return { speaker: sp, waves: w };
  }, [inner]);

  // One "beat" every ~1.6 s: a little bounce with a wiggle, and a ring spreading out.
  const beat = useSharedValue(0);
  useEffect(() => {
    if (inviting) {
      beat.set(
        withRepeat(
          withSequence(
            withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }),
            withDelay(900, withTiming(0, { duration: 0 })),
          ),
          -1,
        ),
      );
    } else {
      cancelAnimation(beat);
      beat.set(withTiming(0, { duration: 150 }));
    }
  }, [inviting, beat]);

  const bounceStyle = useAnimatedStyle(() => {
    const b = beat.value;
    // Up and back down within the beat (sin), with a quick left-right wiggle.
    const lift = Math.sin(Math.PI * b);
    return {
      transform: [{ scale: 1 + 0.14 * lift }, { rotate: `${Math.sin(b * Math.PI * 4) * 9 * lift}deg` }],
    };
  });
  const ringStyle = useAnimatedStyle(() => ({
    opacity: beat.value > 0 ? 0.85 * (1 - beat.value) : 0,
    transform: [{ scale: 1 + beat.value * 0.7 }],
  }));

  return (
    <Animated.View style={bounceStyle}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: s(5),
          },
          ringStyle,
        ]}
      />
      <Bouncy onPress={onPress} accessibilityLabel={accessibilityLabel} sfx={null}>
        <View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: border,
            },
          ]}
        >
          <Canvas
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: inner,
              height: inner,
            }}
          >
            <Path path={speaker} color={colors.white} />
            <Path path={speaker} color={colors.white} style="stroke" strokeWidth={inner * 0.04} strokeJoin="round" />
            <Path path={waves} color={colors.white} style="stroke" strokeWidth={inner * 0.07} strokeCap="round" />
          </Canvas>
        </View>
      </Bouncy>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', left: 0, top: 0, borderColor: colors.sunGlow },
  circle: {
    backgroundColor: colors.blue,
    borderColor: colors.white,
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
});
