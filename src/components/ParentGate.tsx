import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useTranslation } from '@/i18n';
import { haptics } from '@/services/haptics';
import { colors, fonts, sizes, springs } from '@/theme';

/** A new "a + b" question whose answer is always two digits (10–18). */
function makeQuestion() {
  const a = 2 + Math.floor(Math.random() * 8); // 2..9
  const min = Math.max(2, 10 - a);
  const b = min + Math.floor(Math.random() * (10 - min)); // so that a + b >= 10, b <= 9
  return { a, b };
}

/**
 * Parent gate: a simple addition with a two-digit answer, entered on a big
 * keypad. Easy for a grown-up, practically impossible for a 4–5 year old
 * who can't read the question. Deliberately silent (no spoken hint).
 */
export function ParentGate({ onPass }: { onPass: () => void }) {
  const { t } = useTranslation();
  const { s, touchTarget, content } = useDeviceLayout();
  const [question, setQuestion] = useState(makeQuestion);
  const [entry, setEntry] = useState('');
  const shake = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const press = (digit: string) => {
    if (entry.length >= 2) return;
    haptics.tap();
    const next = entry + digit;
    setEntry(next);
    if (next.length < 2) return;
    if (Number(next) === question.a + question.b) {
      onPass();
      return;
    }
    // Not right: a little shake, then a fresh question.
    shake.set(
      withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 80 }),
        withTiming(-6, { duration: 80 }),
        withSpring(0, springs.bouncy),
      ),
    );
    setTimeout(() => {
      setEntry('');
      setQuestion(makeQuestion());
    }, 600);
  };

  const key = Math.max(touchTarget, Math.min(s(64), (content.height - s(40)) / 4.6));
  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['del', '0', ''],
  ];

  return (
    <View style={[styles.row, { gap: s(40) }]}>
      <Animated.View style={[styles.questionBox, shakeStyle]}>
        <Text allowFontScaling={false} style={[styles.title, { fontSize: s(26) }]}>
          {t('parents.gateTitle')}
        </Text>
        <Text allowFontScaling={false} style={[styles.hint, { fontSize: s(16) }]}>
          {t('parents.gateHint')}
        </Text>
        <Text allowFontScaling={false} style={[styles.question, { fontSize: s(44) }]}>
          {t('parents.gateQuestion', { a: question.a, b: question.b })}
        </Text>
        <View style={[styles.answer, { minWidth: s(110), paddingVertical: s(6), borderRadius: sizes.radius.md }]}>
          <Text allowFontScaling={false} style={[styles.answerText, { fontSize: s(40) }]}>
            {entry.padEnd(2, '_')}
          </Text>
        </View>
      </Animated.View>

      <View style={{ gap: s(8) }}>
        {rows.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', gap: s(8) }}>
            {row.map((k, c) =>
              k === '' ? (
                <View key={c} style={{ width: key, height: key }} />
              ) : (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={k === 'del' ? t('parents.deleteDigit') : k}
                  onPress={() => (k === 'del' ? setEntry((e) => e.slice(0, -1)) : press(k))}
                  style={({ pressed }) => [
                    styles.key,
                    { width: key, height: key, borderRadius: key / 2, opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Text allowFontScaling={false} style={[styles.keyText, { fontSize: key * (k === 'del' ? 0.3 : 0.42) }]}>
                    {k === 'del' ? '⌫' : k}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  questionBox: { alignItems: 'center', gap: 10, maxWidth: 360 },
  title: { fontFamily: fonts.bold, color: colors.ink },
  hint: { fontFamily: fonts.regular, color: colors.inkSoft, textAlign: 'center' },
  question: { fontFamily: fonts.bold, color: colors.ink, marginTop: 6 },
  answer: { backgroundColor: colors.tracingLane, alignItems: 'center', paddingHorizontal: 16 },
  answerText: { fontFamily: fonts.bold, color: colors.ink, letterSpacing: 8 },
  key: { backgroundColor: colors.skyLight, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontFamily: fonts.bold, color: colors.ink },
});
