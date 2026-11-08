import { Canvas, Path, RoundedRect } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { colors } from '@/theme';

import { starPath } from './art/shapes';
import { Bouncy } from './Bouncy';

interface AlbumButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
  /** Size multiplier relative to the normal touch target. */
  scale?: number;
}

/** Round button with a little sticker book (purple cover, pages, a star). */
export function AlbumButton({ onPress, accessibilityLabel, scale = 1 }: AlbumButtonProps) {
  const { touchTarget, s } = useDeviceLayout();
  const size = touchTarget * scale;
  // The canvas sits inside the border, so the icon is drawn for the inner area.
  const border = s(4);
  const inner = size - border * 2;
  const star = useMemo(() => starPath(inner * 0.5, inner * 0.5, inner * 0.13, inner * 0.06), [inner]);

  return (
    <Bouncy onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, borderWidth: border }]}>
        <Canvas style={{ position: 'absolute', left: 0, top: 0, width: inner, height: inner }}>
          {/* Pages peeking out, then the cover */}
          <RoundedRect x={inner * 0.3} y={inner * 0.24} width={inner * 0.44} height={inner * 0.54} r={inner * 0.05} color={colors.white} />
          <RoundedRect x={inner * 0.26} y={inner * 0.22} width={inner * 0.44} height={inner * 0.54} r={inner * 0.06} color={colors.purple} />
          <RoundedRect x={inner * 0.26} y={inner * 0.22} width={inner * 0.07} height={inner * 0.54} r={inner * 0.03} color={colors.ink} opacity={0.25} />
          <Path path={star} color={colors.sun} />
        </Canvas>
      </View>
    </Bouncy>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.candyPink,
    borderColor: colors.white,
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
});
