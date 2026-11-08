import { Canvas } from '@shopify/react-native-skia';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  useDerivedValue,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Bouncy } from '@/components/Bouncy';
import { useBlink } from '@/hooks/useBlink';
import { useFrameClock } from '@/hooks/useFrameClock';
import { useScreenFocused } from '@/hooks/useScreenFocused';
import { useTemporaryFlag } from '@/hooks/useTemporaryFlag';
import { useTranslation } from '@/i18n';

import { carX, TRAIN, trainWidth } from './geometry';
import { Locomotive } from './Locomotive';
import { Smoke } from './Smoke';
import { Wagon } from './Wagon';

interface TrainProps {
  /** Size unit in points: height of a car from roof to rail. */
  u: number;
  /** Distance travelled (points). Same value the ParallaxBackground scrolls by. */
  travel: SharedValue<number>;
  /** Current speed (points/second), used for the smoke trail. */
  speed: SharedValue<number>;
  /** One color per wagon; wagons are drawn left of the locomotive. */
  wagonColors: readonly string[];
  /** Optional passenger per wagon (index-aligned with wagonColors). */
  passengers?: readonly (ReactNode | null)[];
  /** Called after the whistle, e.g. to make the train speed up. */
  onPress?: () => void;
}

/**
 * The child's train: locomotive + wagons, rolling wheels, chugging body,
 * chimney smoke. Tap: whistle, big puff of smoke and a happy face.
 *
 * The train itself stays put on screen; the world scrolls past it (`travel`).
 * Its bottom edge is where the wheels touch the rail.
 */
export function Train({ u, travel, speed, wagonColors, passengers, onPress }: TrainProps) {
  const { t } = useTranslation();
  const count = wagonColors.length;
  const width = trainWidth(count) * u;
  const smokeH = TRAIN.smokeHeight * u;
  const locoX = carX(count) * u;

  // Paused while the screen is hidden under another one.
  const seconds = useFrameClock(1, useScreenFocused());
  const blink = useBlink(5);
  const [happy, triggerHappy] = useTemporaryFlag(1600);
  const burst = useSharedValue(0);

  // "Chug": a small hop on every half turn of the big wheels; still when stopped.
  const bob = useDerivedValue(() => [
    { translateY: -Math.abs(Math.sin(travel.value / (u * 0.17))) * u * 0.025 },
  ]);

  const handlePress = () => {
    triggerHappy();
    burst.set(withSequence(withTiming(1, { duration: 150 }), withTiming(0, { duration: 1400 })));
    onPress?.();
  };

  return (
    <View style={{ width, height: smokeH + u }} pointerEvents="box-none">
      <View style={[styles.abs, { top: smokeH, left: 0 }]}>
        <Bouncy onPress={handlePress} sfx="whistle" accessibilityLabel={t('ui.train')} style={{ width, height: u }}>
          <Canvas style={{ width, height: u }}>
            {wagonColors.map((color, i) => (
              <Wagon
                key={i}
                x={carX(i) * u}
                u={u}
                color={color}
                travel={travel}
                bob={bob}
                coupler
              />
            ))}
            <Locomotive x={locoX} u={u} travel={travel} bob={bob} happy={happy} blink={blink} />
          </Canvas>
        </Bouncy>
      </View>

      {/* Passenger slots: each passenger stands on its wagon's deck. */}
      {passengers?.map((passenger, i) =>
        passenger ? (
          <View
            key={i}
            pointerEvents="box-none"
            style={[
              styles.abs,
              styles.slot,
              {
                left: carX(i) * u,
                width: TRAIN.wagonWidth * u,
                bottom: u * (1 - TRAIN.wagonDeck) - u * 0.04,
              },
            ]}
          >
            {passenger}
          </View>
        ) : null,
      )}

      {/* Smoke floats above everything and never blocks touches. */}
      <Canvas pointerEvents="none" style={[styles.abs, { top: 0, left: 0, width, height: smokeH + u * 0.4 }]}>
        <Smoke
          originX={locoX + TRAIN.chimney.x * u}
          originY={smokeH + TRAIN.chimney.y * u}
          u={u}
          seconds={seconds}
          speed={speed}
          burst={burst}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  slot: { alignItems: 'center', justifyContent: 'flex-end' },
});
