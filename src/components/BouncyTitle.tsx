import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  BounceIn,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { colors, fonts, rainbow, springs } from '@/theme';

import { Bouncy } from './Bouncy';

interface TitleLetterProps {
  char: string;
  index: number;
  fontSize: number;
}

/** One letter of the title: gently waves when idle, jumps & spins when tapped. */
function TitleLetter({ char, index, fontSize }: TitleLetterProps) {
  const wave = useSharedValue(0);
  const jump = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    // Staggered delay makes the letters ripple like a wave.
    wave.set(withDelay(
      index * 110,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 650, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 650, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    ));
  }, [index, wave]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -wave.value * fontSize * 0.1 + jump.value },
      { rotate: `${spin.value}deg` },
    ],
  }));

  const onPress = () => {
    jump.set(withSequence(
      withTiming(-fontSize * 0.6, { duration: 180, easing: Easing.out(Easing.quad) }),
      withSpring(0, springs.bouncy),
    ));
    spin.set(withSequence(withTiming(360, { duration: 400 }), withTiming(0, { duration: 0 })));
  };

  const color = rainbow[index % rainbow.length];

  return (
    // Entering animation on the wrapper, idle/tap transforms on the inner view,
    // so the two never fight over `transform`.
    <Animated.View entering={BounceIn.delay(index * 60)}>
      <Animated.View style={style}>
        <Bouncy onPress={onPress} haptic={false}>
          <Text
            style={[
              styles.letter,
              {
                fontSize,
                color,
                textShadowOffset: { width: 0, height: fontSize * 0.06 },
              },
            ]}
          >
            {char}
          </Text>
        </Bouncy>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Game title where every letter is its own tappable, animated character.
 * `text` comes from the i18n layer; the component remounts per language so the
 * pop-in animation replays whenever the language changes.
 */
export function BouncyTitle({ text }: { text: string }) {
  const { s } = useDeviceLayout();
  // Sized so the title clears the language button on the narrowest iPhones.
  const fontSize = s(60);
  // Array.from splits by real characters (safe for Ç, Ğ, İ...).
  const chars = Array.from(text);
  let letterIndex = 0;

  return (
    <View style={styles.row} accessible accessibilityRole="header" accessibilityLabel={text}>
      {chars.map((char, i) =>
        char === ' ' ? (
          <View key={`space-${i}`} style={{ width: fontSize * 0.35 }} />
        ) : (
          <TitleLetter key={`${text}-${i}`} char={char} index={letterIndex++} fontSize={fontSize} />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  letter: {
    fontFamily: fonts.bold,
    textShadowColor: colors.ink,
    textShadowRadius: 0,
    paddingHorizontal: 1,
  },
});
