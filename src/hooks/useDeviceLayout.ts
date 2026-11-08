import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { sizes } from '@/theme';

/**
 * The ONE place where phone vs tablet is decided and where everything is scaled.
 *
 * Usage:
 *   const { isTablet, s, touchTarget, safe } = useDeviceLayout();
 *   <View style={{ width: s(120), paddingLeft: safe.left }} />
 *
 * - `s(n)` scales a design-point value (designed for an 844x390 iPhone in
 *   landscape) to the current screen.
 * - `safe` holds the safe-area insets plus a small gutter, so content never
 *   sits under the notch / Dynamic Island / home indicator.
 */
export interface DeviceLayout {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
  /** Global scale factor relative to the reference design. */
  scale: number;
  /** Scale a design-point value to the current screen. */
  s: (designPoints: number) => number;
  /** Minimum touch target size in points for this device class. */
  touchTarget: number;
  /** Safe-area insets with an extra gutter applied. */
  safe: { top: number; right: number; bottom: number; left: number };
  /** Usable content box inside the safe area. */
  content: { width: number; height: number };
  /** Side length of the square letter/number tracing area. */
  tracingSize: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function useDeviceLayout(): DeviceLayout {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const longSide = Math.max(width, height);
    const shortSide = Math.min(width, height);
    const isTablet = shortSide >= sizes.tabletBreakpoint;

    // Scale by whichever axis is tighter, so nothing overflows.
    const rawScale = Math.min(longSide / sizes.designWidth, shortSide / sizes.designHeight);
    const scale = clamp(rawScale, 0.8, isTablet ? 1.8 : 1.2);

    const gutter = sizes.edgeGutter;
    const safe = {
      top: insets.top + gutter,
      right: insets.right + gutter,
      bottom: insets.bottom + gutter,
      left: insets.left + gutter,
    };
    const content = {
      width: width - safe.left - safe.right,
      height: height - safe.top - safe.bottom,
    };

    // Tablets get a noticeably bigger drawing area (more room for little fingers).
    const tracingSize = Math.floor(content.height * (isTablet ? 0.82 : 0.86));

    return {
      width,
      height,
      isTablet,
      isLandscape: width >= height,
      scale,
      s: (n: number) => Math.round(n * scale),
      touchTarget: isTablet ? sizes.touchTargetTablet : sizes.touchTargetPhone,
      safe,
      content,
      tracingSize,
    };
  }, [width, height, insets.top, insets.right, insets.bottom, insets.left]);
}
