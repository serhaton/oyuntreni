import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { colors } from '@/theme';

import { Bouncy } from './Bouncy';

interface SettingsButtonProps {
  onPress: () => void;
  accessibilityLabel: string;
}

/** Round button with a drawn gear: the way into the (parent-gated) settings. */
export function SettingsButton({ onPress, accessibilityLabel }: SettingsButtonProps) {
  const { touchTarget, s } = useDeviceLayout();
  const size = touchTarget;
  // The canvas sits inside the border, so the gear is drawn for the inner area.
  const border = s(4);
  const inner = size - border * 2;

  const gear = useMemo(() => {
    const c = inner / 2;
    const teeth = 8;
    const outer = inner * 0.34;
    const root = inner * 0.26;
    const b = Skia.PathBuilder.Make();
    for (let i = 0; i < teeth * 4; i++) {
      // Each tooth: two points at the tip, two at the root.
      const a = (i / (teeth * 4)) * Math.PI * 2;
      const r = i % 4 === 0 || i % 4 === 1 ? outer : root;
      const x = c + Math.cos(a) * r;
      const y = c + Math.sin(a) * r;
      if (i === 0) b.moveTo(x, y);
      else b.lineTo(x, y);
    }
    b.close();
    return b.build();
  }, [inner]);

  return (
    <Bouncy onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, borderWidth: border }]}>
        <Canvas style={{ position: 'absolute', left: 0, top: 0, width: inner, height: inner }}>
          <Path path={gear} color={colors.white} />
          <Path path={gear} color={colors.white} style="stroke" strokeWidth={inner * 0.04} strokeJoin="round" />
          <Circle cx={inner / 2} cy={inner / 2} r={inner * 0.1} color={colors.inkSoft} />
        </Canvas>
      </View>
    </Bouncy>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.inkSoft,
    borderColor: colors.white,
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
});
