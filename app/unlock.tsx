import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { BackButton } from '@/components/BackButton';
import { LockBadge } from '@/components/LockBadge';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { ParentGate } from '@/components/ParentGate';
import { PremiumPanel } from '@/components/PremiumPanel';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useSay } from '@/hooks/useSay';
import { useTranslation } from '@/i18n';
import { audio } from '@/services/audio';
import { colors, fonts, sizes } from '@/theme';

type Step = 'child' | 'gate' | 'buy';

/**
 * Shown when a locked station is tapped.
 *  1. The child sees a friendly padlock and hears "ask a grown-up".
 *     Nothing about buying is visible to the child.
 *  2. "For grown-ups" leads to the parent gate (required by Apple for
 *     purchases in kids' apps)...
 *  3. ...and then to the full-version purchase.
 */
export default function UnlockScreen() {
  const { t } = useTranslation();
  const say = useSay();
  const { safe, s, height: H, content } = useDeviceLayout();
  const [step, setStep] = useState<Step>('child');

  useEffect(() => {
    audio.playSfx('softTryAgain');
    const timer = setTimeout(() => void say('speech.askGrownUp'), 350);
    return () => {
      clearTimeout(timer);
      audio.stopSpeech();
    };
  }, [say]);

  // The padlock wiggles gently, like it's waiting.
  const wiggle = useSharedValue(0);
  useEffect(() => {
    wiggle.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 140, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: 280, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 140 }),
          withTiming(0, { duration: 1600 }),
        ),
        -1,
      ),
    );
  }, [wiggle]);
  const wiggleStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${wiggle.value * 8}deg` }] }));

  const onUnlocked = () => {
    audio.playSfx('sparkle');
    setTimeout(() => {
      if (router.canGoBack()) router.back();
    }, 1600);
  };

  return (
    <View style={styles.root}>
      <ParallaxBackground />
      <View style={[styles.center, { paddingTop: safe.top, paddingBottom: safe.bottom }]}>
        {step === 'child' && (
          <Animated.View entering={ZoomIn.springify()} style={[styles.childBox, { gap: s(24) }]}>
            <Animated.View style={wiggleStyle}>
              <LockBadge size={H * 0.4} />
            </Animated.View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setStep('gate')}
              style={({ pressed }) => [
                styles.grownUps,
                { paddingHorizontal: s(22), paddingVertical: s(10), borderRadius: sizes.radius.pill, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text allowFontScaling={false} style={[styles.grownUpsText, { fontSize: s(18) }]}>
                {t('ui.forGrownUps')}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {step !== 'child' && (
          <Animated.View
            key={step}
            entering={ZoomIn.springify()}
            style={[styles.panel, { padding: s(24), borderRadius: sizes.radius.lg, maxHeight: content.height }]}
          >
            {step === 'gate' ? (
              <ParentGate onPass={() => setStep('buy')} />
            ) : (
              <View style={{ width: Math.min(s(460), content.height * 1.4) }}>
                <PremiumPanel onUnlocked={onUnlocked} />
              </View>
            )}
          </Animated.View>
        )}
      </View>
      <View style={[styles.back, { top: safe.top, left: safe.left }]}>
        <BackButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { position: 'absolute', zIndex: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  childBox: { alignItems: 'center' },
  grownUps: { backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 2, borderColor: colors.inkSoft },
  grownUpsText: { fontFamily: fonts.semibold, color: colors.inkSoft },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
});
