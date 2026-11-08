import { Canvas, Circle, Group, Oval } from '@shopify/react-native-skia';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { KawaiiFace } from '@/components/art/KawaiiFace';
import { Bouncy } from '@/components/Bouncy';
import { useBlink } from '@/hooks/useBlink';
import { useTemporaryFlag } from '@/hooks/useTemporaryFlag';
import { colors, springs } from '@/theme';

/** Cloud width/height relative to its `size`. Exported for layout math. */
export const CLOUD_ASPECT = { width: 2.4, height: 1.3 } as const;

/** Puffy cloud with a sleepy-happy face. Tap: it jumps up with a "boing" and grins. */
export function Cloud({ size, seed = 0 }: { size: number; seed?: number }) {
  const blink = useBlink(seed + 3);
  const [happy, triggerHappy] = useTemporaryFlag(1400);
  const jump = useSharedValue(0);

  const w = size * CLOUD_ASPECT.width;
  const h = size * CLOUD_ASPECT.height;

  const jumpStyle = useAnimatedStyle(() => ({ transform: [{ translateY: jump.value }] }));

  const onPress = () => {
    triggerHappy();
    jump.set(
      withSequence(
        withTiming(-h * 0.45, { duration: 200, easing: Easing.out(Easing.quad) }),
        withSpring(0, springs.bouncy),
      ),
    );
  };

  // Puffs: bottom oval + three circles. Drawn twice: a pale-blue shade, then white.
  const puffs = (dy: number, color: string) => (
    <Group color={color}>
      <Oval x={w * 0.08} y={h * 0.45 + dy} width={w * 0.84} height={h * 0.5} />
      <Circle cx={w * 0.3} cy={h * 0.55 + dy} r={h * 0.28} />
      <Circle cx={w * 0.55} cy={h * 0.42 + dy} r={h * 0.36} />
      <Circle cx={w * 0.76} cy={h * 0.6 + dy} r={h * 0.25} />
    </Group>
  );

  return (
    <Animated.View style={jumpStyle}>
      <Bouncy onPress={onPress} sfx="boing" haptic={false} style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }}>
          {puffs(h * 0.05, colors.cloudShade)}
          {puffs(0, colors.cloud)}
          <KawaiiFace cx={w * 0.52} cy={h * 0.64} size={h * 0.42} happy={happy} blink={blink} />
        </Canvas>
      </Bouncy>
    </Animated.View>
  );
}
