import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useTranslation, type TranslationKey } from '@/i18n';
import { haptics } from '@/services/haptics';
import { usePremium } from '@/services/PremiumProvider';
import { colors, fonts, sizes } from '@/theme';

type Status = 'idle' | 'buying' | 'purchased' | 'pending' | 'failed' | 'restored' | 'nothingToRestore';

const FEATURES: TranslationKey[] = [
  'premium.featureLetters',
  'premium.featureNumbers',
  'premium.featureQuizzes',
  'premium.featureFuture',
  'premium.featureOneTime',
];

/**
 * What the full version includes, with Buy and Restore buttons. Only ever
 * shown behind the parent gate (an Apple requirement for kids' apps).
 */
export function PremiumPanel({ onUnlocked, compact = false }: { onUnlocked?: () => void; compact?: boolean }) {
  const { t } = useTranslation();
  const { s, touchTarget } = useDeviceLayout();
  const { isPremium, price, storeKind, buy, restore, revokeForTesting } = usePremium();
  const [status, setStatus] = useState<Status>('idle');

  const onBuy = async () => {
    setStatus('buying');
    const result = await buy();
    if (result === 'purchased') {
      haptics.success();
      setStatus('purchased');
      onUnlocked?.();
    } else if (result === 'pending') setStatus('pending');
    else if (result === 'failed') setStatus('failed');
    else setStatus('idle'); // cancelled: no message needed
  };

  const onRestore = async () => {
    setStatus('buying');
    const found = await restore();
    setStatus(found ? 'restored' : 'nothingToRestore');
    if (found) onUnlocked?.();
  };

  const message =
    status === 'idle' || status === 'buying'
      ? null
      : t(`premium.${status}` as TranslationKey);

  if (isPremium && status !== 'purchased' && status !== 'restored') {
    return (
      <View style={{ gap: s(8) }}>
        <Text allowFontScaling={false} style={[styles.owned, { fontSize: s(18) }]}>
          ✓ {t('premium.owned')}
        </Text>
        {storeKind === 'test' && (
          <Pressable onPress={revokeForTesting} accessibilityRole="button">
            <Text allowFontScaling={false} style={[styles.link, { fontSize: s(14) }]}>
              {t('premium.revokeTest')}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={{ gap: s(compact ? 8 : 12) }}>
      {!compact && (
        <>
          <Text allowFontScaling={false} style={[styles.title, { fontSize: s(24) }]}>
            {t('premium.title')}
          </Text>
          <Text allowFontScaling={false} style={[styles.subtitle, { fontSize: s(15) }]}>
            {t('premium.subtitle')}
          </Text>
          <View style={{ gap: s(4) }}>
            {FEATURES.map((key) => (
              <Text key={key} allowFontScaling={false} style={[styles.feature, { fontSize: s(16) }]}>
                ★ {t(key)}
              </Text>
            ))}
          </View>
        </>
      )}

      <Pressable
        accessibilityRole="button"
        disabled={status === 'buying' || status === 'purchased'}
        onPress={() => void onBuy()}
        style={({ pressed }) => [
          styles.buy,
          { minHeight: touchTarget * 0.85, borderRadius: sizes.radius.pill, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        {status === 'buying' ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text allowFontScaling={false} style={[styles.buyText, { fontSize: s(20) }]}>
            {price ? t('premium.buyWithPrice', { price }) : t('premium.buy')}
          </Text>
        )}
      </Pressable>

      <Pressable accessibilityRole="button" disabled={status === 'buying'} onPress={() => void onRestore()}>
        <Text allowFontScaling={false} style={[styles.link, { fontSize: s(15) }]}>
          {t('premium.restore')}
        </Text>
      </Pressable>

      {message && (
        <Animated.Text
          entering={FadeIn}
          allowFontScaling={false}
          style={[styles.message, { fontSize: s(15) }, status === 'failed' && { color: colors.red }]}
        >
          {message}
        </Animated.Text>
      )}
      {storeKind === 'test' && (
        <Text allowFontScaling={false} style={[styles.test, { fontSize: s(12) }]}>
          {t('premium.testStore')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, color: colors.inkSoft },
  feature: { fontFamily: fonts.semibold, color: colors.ink },
  buy: { backgroundColor: colors.grass, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  buyText: { fontFamily: fonts.bold, color: colors.white },
  link: { fontFamily: fonts.semibold, color: colors.blue, textAlign: 'center' },
  message: { fontFamily: fonts.semibold, color: colors.grassDark, textAlign: 'center' },
  owned: { fontFamily: fonts.bold, color: colors.grassDark },
  test: { fontFamily: fonts.regular, color: colors.inkSoft, textAlign: 'center' },
});
