import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { KawaiiFace } from '@/components/art/KawaiiFace';
import { Bouncy } from '@/components/Bouncy';
import { useBlink } from '@/hooks/useBlink';
import { useTemporaryFlag } from '@/hooks/useTemporaryFlag';
import { colors } from '@/theme';

/**
 * Smiling sun. Rays rotate slowly all the time; a tap makes it grin with
 * ^ ^ eyes and gives the rays an extra happy spin.
 */
export function Sun({ size }: { size: number }) {
  const blink = useBlink(1);
  const [happy, triggerHappy] = useTemporaryFlag(1800);

  const spin = useSharedValue(0);
  const boost = useSharedValue(0);

  useEffect(() => {
    spin.set(withRepeat(withTiming(360, { duration: 30000, easing: Easing.linear }), -1));
  }, [spin]);

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value + boost.value}deg` }],
  }));

  // 12 rays, alternating long and short.
  const rays = useMemo(() => {
    const b = Skia.PathBuilder.Make();
    const c = size / 2;
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const r1 = size * 0.38;
      const r2 = i % 2 === 0 ? size * 0.49 : size * 0.45;
      b.moveTo(c + r1 * Math.cos(a), c + r1 * Math.sin(a));
      b.lineTo(c + r2 * Math.cos(a), c + r2 * Math.sin(a));
    }
    return b.build();
  }, [size]);

  const onPress = () => {
    triggerHappy();
    boost.set(
      withTiming(boost.get() + 180, { duration: 900, easing: Easing.out(Easing.back(1.5)) }),
    );
  };

  const c = size / 2;

  return (
    <Bouncy onPress={onPress} sfx="giggle" style={{ width: size, height: size }}>
      <Animated.View style={[StyleSheet.absoluteFill, raysStyle]}>
        <Canvas style={{ width: size, height: size }}>
          <Path
            path={rays}
            color={colors.sunRay}
            style="stroke"
            strokeWidth={size * 0.055}
            strokeCap="round"
          />
        </Canvas>
      </Animated.View>
      <Canvas style={StyleSheet.absoluteFill}>
        <Circle cx={c} cy={c} r={size * 0.32} color={colors.sunGlow} opacity={0.6} />
        <Circle cx={c} cy={c} r={size * 0.3} color={colors.sun} />
        <KawaiiFace cx={c} cy={c + size * 0.02} size={size * 0.46} happy={happy} blink={blink} />
      </Canvas>
    </Bouncy>
  );
}
