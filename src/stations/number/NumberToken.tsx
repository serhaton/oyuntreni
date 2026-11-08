import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, rainbow } from '@/theme';

/** Width of one digit relative to the font size (Fredoka Bold, with a little air). */
const DIGIT_WIDTH = 0.66;

/** Box size of a token showing `value` with digits `height` points tall. */
export function numberTokenSize(value: number, height: number) {
  return { width: String(value).length * height * DIGIT_WIDTH + height * 0.1, height };
}

/**
 * A number as a little "passenger": big, chunky rainbow digits with a dark
 * outline shadow, e.g. 12 or 1000. Rides in a wagon after being traced.
 */
export function NumberToken({ value, height }: { value: number; height: number }) {
  const { width } = numberTokenSize(value, height);
  const fontSize = height * 0.95;
  return (
    <View style={[styles.box, { width, height }]}>
      <Text allowFontScaling={false} style={[styles.text, { fontSize, lineHeight: height, textShadowOffset: { width: 0, height: fontSize * 0.05 } }]}>
        {String(value)
          .split('')
          .map((digit, i) => (
            <Text key={i} style={{ color: rainbow[i % rainbow.length] }}>
              {digit}
            </Text>
          ))}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'flex-end' },
  text: {
    fontFamily: fonts.bold,
    textShadowColor: colors.ink,
    textShadowRadius: 0,
    includeFontPadding: false,
  },
});
