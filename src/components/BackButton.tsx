import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { useTranslation } from '@/i18n';
import { colors } from '@/theme';

import { Bouncy } from './Bouncy';

/** Big round "go back" button with a drawn arrow (no text, kids can't read). */
export function BackButton({ onPress }: { onPress?: () => void }) {
  const { t } = useTranslation();
  const { touchTarget, s } = useDeviceLayout();
  const size = touchTarget;
  // The canvas lives INSIDE the white border (absolute children of a bordered
  // view start inside the border), so the arrow is centered in that inner area.
  const border = s(4);
  const inner = size - border * 2;

  // Symmetric arrow: shaft and head span the same distance either side of the center.
  const arrow = useMemo(() => {
    const a = inner * 0.24;
    const cx = inner / 2;
    const cy = inner / 2;
    return Skia.PathBuilder.Make()
      .moveTo(cx + a * 0.9, cy)
      .lineTo(cx - a * 0.9, cy)
      .moveTo(cx - a * 0.1, cy - a * 0.8)
      .lineTo(cx - a * 0.9, cy)
      .lineTo(cx - a * 0.1, cy + a * 0.8)
      .build();
  }, [inner]);

  // A double tap must go back one screen, not two.
  const guard = useNavigationLock();
  const handlePress = () =>
    guard(() => {
      if (onPress) onPress();
      else if (router.canGoBack()) router.back();
      else router.replace('/');
    });

  return (
    <Bouncy onPress={handlePress} accessibilityLabel={t('ui.back')}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, borderWidth: border },
        ]}
      >
        <Canvas style={{ position: 'absolute', left: 0, top: 0, width: inner, height: inner }}>
          <Path
            path={arrow}
            color={colors.white}
            style="stroke"
            strokeWidth={inner * 0.11}
            strokeCap="round"
            strokeJoin="round"
          />
        </Canvas>
      </View>
    </Bouncy>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.orange,
    borderColor: colors.white,
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
});
