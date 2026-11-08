import { Canvas, Group, LinearGradient, Path, Rect, vec } from '@shopify/react-native-skia';
import { useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import {
  CLOUDS,
  GROUND,
  HILL_LAYERS,
  NEAR_HILL,
  NEAR_SCENERY,
  SUN,
  TRACK,
  type CloudSpec,
} from '@/data/scenery';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useFrameClock } from '@/hooks/useFrameClock';
import { useScreenFocused } from '@/hooks/useScreenFocused';
import { colors, rainbow } from '@/theme';

import { Cloud, CLOUD_ASPECT } from './scenery/Cloud';
import { Flower, FLOWER_ASPECT } from './scenery/Flower';
import {
  buildHillPath,
  buildSleepersPath,
  buildTuftsPath,
  hillSurfaceY,
  wrap,
} from './scenery/landscape';
import { Sun } from './scenery/Sun';
import { Tree, TREE_ASPECT } from './scenery/Tree';

interface ParallaxBackgroundProps {
  /**
   * Distance the train has travelled, in points. Each layer moves by
   * `scroll * layer.speed`, so far hills crawl and the ground rushes by.
   * Omit for a still landscape (clouds still drift and everything stays tappable).
   */
  scroll?: SharedValue<number>;
  /** Draw the railway track along the ground. */
  track?: boolean;
}

/**
 * Layered, scrolling, tappable landscape.
 *
 * - One Skia canvas draws sky, hills and ground; layers are shifted on the UI
 *   thread through Skia transforms (cheap, no React re-renders while moving).
 * - Sun, clouds, trees and flowers are separate sprites on top so each one can
 *   catch its own taps and later be swapped for real illustrations.
 */
export function ParallaxBackground({ scroll, track = false }: ParallaxBackgroundProps) {
  const { width: W, height: H, s } = useDeviceLayout();
  // The big canvas is only created once its view has its real size (e.g. after a
  // screen transition). Creating a Skia surface while the view is still being
  // laid out could occasionally leave the whole background blank.
  const [laidOut, setLaidOut] = useState<{ w: number; h: number } | null>(null);
  const stillScroll = useSharedValue(0);
  const travel = scroll ?? stillScroll;
  // Paused while the screen is hidden under another one.
  const seconds = useFrameClock(1, useScreenFocused());

  // --- Static geometry (rebuilt only when the screen size changes) ---------
  const hills = useMemo(
    () =>
      HILL_LAYERS.map((layer) => {
        const period = W * layer.period;
        const copies = Math.ceil(W / period) + 1;
        return {
          layer,
          period,
          path: buildHillPath(layer.bumps, period, H * layer.base, H, copies),
        };
      }),
    [W, H],
  );

  const nearPeriod = W * NEAR_HILL.period;
  const nearPath = useMemo(
    () => buildHillPath(NEAR_HILL.bumps, nearPeriod, H * NEAR_HILL.base, H, Math.ceil(W / nearPeriod) + 1),
    [W, H, nearPeriod],
  );

  const groundTop = H * GROUND.top;
  const tuftPeriod = W * GROUND.tuftPeriod;
  const tuftCopies = Math.ceil(W / tuftPeriod) + 1;
  const tufts = useMemo(
    () => buildTuftsPath(tuftPeriod, groundTop + H * 0.022, H * 0.016, tuftCopies),
    [tuftPeriod, groundTop, H, tuftCopies],
  );

  const railY = H * TRACK.y;
  const sleeperH = H * 0.03;
  const sleepers = useMemo(
    () => buildSleepersPath(tuftPeriod, H * TRACK.sleeperSpacing, railY, sleeperH, tuftCopies),
    [tuftPeriod, H, railY, sleeperH, tuftCopies],
  );

  const sunSize = H * SUN.size;

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setLaidOut({ w: Math.round(width), h: Math.round(height) });
      }}
    >
      {laidOut && (
        <Canvas key={`${laidOut.w}x${laidOut.h}`} style={StyleSheet.absoluteFill} pointerEvents="none">
          {/* Sky */}
          <Rect x={0} y={0} width={W} height={H}>
            <LinearGradient start={vec(0, 0)} end={vec(0, H)} colors={[colors.skyDeep, colors.skyLight]} />
          </Rect>

          {/* Far hill layers */}
          {hills.map((h, i) => (
            <ScrollingGroup key={i} travel={travel} speed={h.layer.speed} period={h.period}>
              <Path path={h.path} color={colors[h.layer.color]} />
            </ScrollingGroup>
          ))}

          {/* Near hill (trees & flowers stand on it, see sprites below) */}
          <ScrollingGroup travel={travel} speed={NEAR_HILL.speed} period={nearPeriod}>
            <Path path={nearPath} color={colors[NEAR_HILL.color]} />
          </ScrollingGroup>

          {/* Ground strip */}
          <Rect x={0} y={groundTop} width={W} height={H - groundTop} color={colors.grass} />
          <Rect x={0} y={groundTop} width={W} height={H * 0.012} color={colors.grassDark} />
          <ScrollingGroup travel={travel} speed={GROUND.speed} period={tuftPeriod}>
            <Path
              path={tufts}
              color={colors.grassDark}
              style="stroke"
              strokeWidth={Math.max(1.5, H * 0.006)}
              strokeCap="round"
              strokeJoin="round"
            />
          </ScrollingGroup>

          {/* Railway track: ballast bed, scrolling sleepers, then the rail on top */}
          {track && (
            <>
              <Rect x={0} y={railY} width={W} height={sleeperH * 1.1} color={colors.ballast} />
              <ScrollingGroup travel={travel} speed={GROUND.speed} period={tuftPeriod}>
                <Path path={sleepers} color={colors.sleeper} />
              </ScrollingGroup>
              <Rect x={0} y={railY - H * 0.012} width={W} height={H * 0.014} color={colors.rail} />
              <Rect x={0} y={railY - H * 0.012} width={W} height={H * 0.004} color={colors.railShine} />
            </>
        )}
      </Canvas>
      )}

      {/* Sun: fixed in the sky (it's "infinitely" far away). */}
      <View
        style={[
          styles.abs,
          { left: W * SUN.x - sunSize / 2, top: H * SUN.y - sunSize / 2 },
        ]}
      >
        <Sun size={sunSize} />
      </View>

      {/* Drifting clouds */}
      {CLOUDS.map((spec, i) => (
        <DriftingCloud
          key={i}
          spec={spec}
          seed={i}
          screenW={W}
          screenH={H}
          driftScale={s(1)}
          seconds={seconds}
          travel={travel}
        />
      ))}

      {/* Trees and flowers riding the near hill */}
      {NEAR_SCENERY.map((item, i) => {
        const height = H * item.height;
        const width = height * (item.kind === 'tree' ? TREE_ASPECT : FLOWER_ASPECT);
        const surface = hillSurfaceY(NEAR_HILL.bumps, item.x, H * NEAR_HILL.base, H);
        // Sink the base a little into the hill so nothing looks like it's floating.
        const top = surface - height + height * 0.04;
        return (
          <LayerSprite
            key={i}
            travel={travel}
            speed={NEAR_HILL.speed}
            period={nearPeriod}
            baseX={item.x * nearPeriod - width / 2}
            margin={width}
            top={top}
          >
            {item.kind === 'tree' ? (
              <Tree kind={item.variant} height={height} seed={i} />
            ) : (
              <Flower height={height} petalColor={rainbow[item.colorIndex % rainbow.length]} seed={i} />
            )}
          </LayerSprite>
        );
      })}
    </View>
  );
}

interface ScrollingGroupProps {
  travel: SharedValue<number>;
  speed: number;
  /** The children repeat every `period` points, so we shift modulo it. */
  period: number;
  children: ReactNode;
}

/** Skia group shifted left by `travel * speed`, wrapped to its tile period (UI thread). */
function ScrollingGroup({ travel, speed, period, children }: ScrollingGroupProps) {
  const transform = useDerivedValue(() => [{ translateX: -wrap(travel.value * speed, period) }]);
  return <Group transform={transform}>{children}</Group>;
}

interface LayerSpriteProps {
  travel: SharedValue<number>;
  speed: number;
  period: number;
  /** Left edge inside the layer tile, in points. */
  baseX: number;
  /** Sprite width, so it fully leaves the screen before wrapping around. */
  margin: number;
  top: number;
  children: ReactNode;
}

/** Positions a sprite so it moves exactly with its hill layer and wraps around. */
function LayerSprite({ travel, speed, period, baseX, margin, top, children }: LayerSpriteProps) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: wrap(baseX - travel.value * speed + margin, period) - margin }],
  }));
  return <Animated.View style={[styles.abs, { left: 0, top }, style]}>{children}</Animated.View>;
}

interface DriftingCloudProps {
  spec: CloudSpec;
  seed: number;
  screenW: number;
  screenH: number;
  /** Design-point to screen-point factor for the drift speed. */
  driftScale: number;
  seconds: SharedValue<number>;
  travel: SharedValue<number>;
}

/** A cloud blown slowly to the left by the wind, plus a tiny parallax from the train. */
function DriftingCloud({ spec, seed, screenW, screenH, driftScale, seconds, travel }: DriftingCloudProps) {
  const size = screenH * spec.size;
  const cloudW = size * CLOUD_ASPECT.width;
  const span = screenW + cloudW;
  const drift = spec.drift * driftScale;

  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          wrap(spec.x * span - seconds.value * drift - travel.value * 0.05, span) - cloudW,
      },
    ],
  }));

  return (
    <Animated.View style={[styles.abs, { left: 0, top: screenH * spec.y }, style]}>
      <Cloud size={size} seed={seed} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
