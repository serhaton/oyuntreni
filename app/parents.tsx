import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { BackButton } from '@/components/BackButton';
import { Flag } from '@/components/Flag';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { ParentGate } from '@/components/ParentGate';
import { PremiumPanel } from '@/components/PremiumPanel';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { LANGUAGE_CODES, LANGUAGES, useLanguage, useTranslation, type LanguageCode } from '@/i18n';
import { audio } from '@/services/audio';
import { useProgress } from '@/services/ProgressProvider';
import { DEFAULT_SETTINGS, loadSettings, updateSettings, type Settings } from '@/services/settings';
import { colors, fonts, sizes } from '@/theme';

/**
 * Parents area: a parent gate first, then the settings — language, the full
 * version, music, sound effects and resetting progress. Everything is saved on the device.
 */
export default function ParentsScreen() {
  const { safe, s } = useDeviceLayout();
  // Dev only: `/parents?unlocked=1` skips the gate (to preview the settings).
  const { unlocked: devUnlocked } = useLocalSearchParams<{ unlocked?: string }>();
  const [unlocked, setUnlocked] = useState(__DEV__ && devUnlocked === '1');

  return (
    <View style={styles.root}>
      <ParallaxBackground />
      <View
        style={[styles.center, { paddingTop: safe.top, paddingBottom: safe.bottom, paddingHorizontal: safe.left + s(56) }]}
      >
        <Animated.View
          key={unlocked ? 'settings' : 'gate'}
          entering={ZoomIn.springify()}
          style={[styles.panel, { padding: s(24), borderRadius: sizes.radius.lg }, unlocked && styles.wide]}
        >
          {unlocked ? <SettingsPanel /> : <ParentGate onPass={() => setUnlocked(true)} />}
        </Animated.View>
      </View>
      <View style={[styles.back, { top: safe.top, left: safe.left }]}>
        <BackButton />
      </View>
    </View>
  );
}

function SettingsPanel() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { reset } = useProgress();
  const { s, touchTarget } = useDeviceLayout();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSettings().then((loaded) => {
      if (!cancelled) setSettings(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const chooseLanguage = (code: LanguageCode) => {
    setLanguage(code);
    // Announce it in its own voice ("Türkçe!" / "English!").
    void audio.say(LANGUAGES[code].dictionary.speech.languageChanged, {
      language: code,
      clipId: 'speech.languageChanged',
    });
  };

  const setMusic = (on: boolean) => {
    setSettings((prev) => ({ ...prev, musicEnabled: on }));
    audio.setMusicEnabled(on);
    void updateSettings({ musicEnabled: on });
  };

  const setSfx = (on: boolean) => {
    setSettings((prev) => ({ ...prev, sfxEnabled: on }));
    audio.setSfxEnabled(on);
    void updateSettings({ sfxEnabled: on });
  };

  const askReset = () => {
    Alert.alert(t('parents.resetConfirmTitle'), t('parents.resetConfirmBody'), [
      { text: t('parents.cancel'), style: 'cancel' },
      {
        text: t('parents.resetConfirm'),
        style: 'destructive',
        onPress: () => {
          reset();
          setResetDone(true);
        },
      },
    ]);
  };

  const flagH = Math.max(s(26), touchTarget * 0.42);

  return (
    // Three columns side by side, so everything fits on one landscape screen (no scrolling).
    <View>
      <Text allowFontScaling={false} style={[styles.title, { fontSize: s(24), marginBottom: s(12) }]}>
        {t('parents.title')}
      </Text>
      <View style={[styles.columns, { gap: s(24) }]}>
        {/* Language */}
        <View style={[styles.column, { gap: s(10) }]}>
          <Text allowFontScaling={false} style={[styles.section, { fontSize: s(18) }]}>
            {t('parents.language')}
          </Text>
          {LANGUAGE_CODES.map((code) => {
            const selected = code === language;
            return (
              <Pressable
                key={code}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => chooseLanguage(code)}
                style={[
                  styles.languageButton,
                  {
                    minHeight: touchTarget,
                    gap: s(10),
                    paddingHorizontal: s(12),
                    borderRadius: sizes.radius.md,
                    borderColor: selected ? colors.grass : colors.tracingLane,
                    backgroundColor: selected ? colors.selectedBg : colors.white,
                  },
                ]}
              >
                <Flag id={LANGUAGES[code].flag} width={flagH * 1.5} height={flagH} />
                <Text
                  allowFontScaling={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[styles.label, styles.languageName, { fontSize: s(20) }]}
                >
                  {LANGUAGES[code].dictionary.language.name}
                </Text>
                {selected && (
                  <Text allowFontScaling={false} style={[styles.check, { fontSize: s(22) }]}>
                    ✓
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Full version */}
        <View style={[styles.column, { gap: s(10) }]}>
          <Text allowFontScaling={false} style={[styles.section, { fontSize: s(18) }]}>
            {t('premium.section')}
          </Text>
          <PremiumPanel compact />
        </View>

        {/* Sound and progress */}
        <View style={[styles.column, { gap: s(10) }]}>
          <Text allowFontScaling={false} style={[styles.section, { fontSize: s(18) }]}>
            {t('parents.sound')}
          </Text>
          <SwitchRow label={t('parents.music')} value={settings.musicEnabled} onChange={setMusic} />
          <SwitchRow label={t('parents.sfx')} value={settings.sfxEnabled} onChange={setSfx} />

          <Text allowFontScaling={false} style={[styles.section, { fontSize: s(18), marginTop: s(10) }]}>
            {t('parents.progress')}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={askReset}
            style={({ pressed }) => [
              styles.resetButton,
              { minHeight: touchTarget * 0.8, borderRadius: sizes.radius.pill, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text allowFontScaling={false} style={[styles.resetText, { fontSize: s(18) }]}>
              {t('parents.reset')}
            </Text>
          </Pressable>
          {/* After a reset, the confirmation takes the hint's place (keeps the page from growing). */}
          {resetDone ? (
            <Animated.Text entering={FadeIn} allowFontScaling={false} style={[styles.done, { fontSize: s(16) }]}>
              {t('parents.resetDone')}
            </Animated.Text>
          ) : (
            <Text allowFontScaling={false} style={[styles.hint, { fontSize: s(14) }]}>
              {t('parents.resetHint')}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (on: boolean) => void }) {
  const { s, touchTarget } = useDeviceLayout();
  return (
    <View style={[styles.switchRow, { minHeight: touchTarget * 0.8 }]}>
      <Text allowFontScaling={false} style={[styles.label, { fontSize: s(18), flex: 1 }]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.grass, false: colors.tracingLane }}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { position: 'absolute', zIndex: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    maxWidth: 1000,
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  /** The settings use the full width (the gate stays a compact card). */
  wide: { width: '100%' },
  title: { fontFamily: fonts.bold, color: colors.ink, textAlign: 'center' },
  columns: { flexDirection: 'row' },
  column: { flex: 1 },
  section: { fontFamily: fonts.semibold, color: colors.inkSoft },
  languageButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 3 },
  label: { fontFamily: fonts.semibold, color: colors.ink },
  languageName: { flexShrink: 1 },
  check: { fontFamily: fonts.bold, color: colors.grassDark, marginLeft: 'auto' },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  resetButton: {
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  resetText: { fontFamily: fonts.bold, color: colors.white },
  hint: { fontFamily: fonts.regular, color: colors.inkSoft },
  done: { fontFamily: fonts.semibold, color: colors.grassDark },
});
