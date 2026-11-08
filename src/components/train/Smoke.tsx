import { Circle, Group } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { colors } from '@/theme';

import { wrap } from '../scenery/landscape';

const PUFF_COUNT = 7;
/** Puffs emitted per second (each puff lives 1/PUFF_RATE * PUFF_COUNT seconds). */
const PUFF_RATE = 0.85;

interface SmokeProps {
  /** Chimney top inside the smoke canvas. */
  originX: number;
  originY: number;
  u: number;
  /** Seconds since mount (drives the puff cycle). */
  seconds: SharedValue<number>;
  /** Train speed in points/second: faster = smoke streams further back. */
  speed: SharedValue<number>;
  /** 0..1 burst (whistle): bigger, puffier smoke. */
  burst: SharedValue<number>;
}

interface PuffProps extends SmokeProps {
  index: number;
}

/** One puff: born small at the chimney, grows, drifts back and up, fades out. */
function Puff({ index, originX, originY, u, seconds, speed, burst }: PuffProps) {
  // Life progress 0..1, staggered so puffs leave one after another.
  const life = useDerivedValue(() => wrap(seconds.value * PUFF_RATE + index / PUFF_COUNT, 1));
  const cx = useDerivedValue(
    () => originX - life.value * (u * 0.3 + speed.value * 0.9) + Math.sin(life.value * 9 + index) * u * 0.03,
  );
  const cy = useDerivedValue(() => originY - life.value * u * (0.75 + burst.value * 0.3));
  const r = useDerivedValue(() => u * (0.05 + life.value * 0.17) * (1 + burst.value * 0.9));
  // Quick fade in, slow fade out.
  const opacity = useDerivedValue(() => Math.min(1, life.value * 8) * (1 - life.value) * 0.9);

  return <Circle cx={cx} cy={cy} r={r} color={colors.smoke} opacity={opacity} />;
}

/** Continuous chimney smoke made of a small pool of recycled puffs (Skia, UI thread). */
export function Smoke(props: SmokeProps) {
  return (
    <Group>
      {Array.from({ length: PUFF_COUNT }, (_, i) => (
        <Puff key={i} index={i} {...props} />
      ))}
    </Group>
  );
}
