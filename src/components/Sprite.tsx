import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { catalogSound, getCatalogItem, type CatalogId } from '@/data/catalog';
import { useBlink } from '@/hooks/useBlink';
import { useTemporaryFlag } from '@/hooks/useTemporaryFlag';
import { useTranslation, type TranslationKey } from '@/i18n';
import { audio } from '@/services/audio';
import { durations, springs } from '@/theme';

import { CHARACTER_ART } from './art/characters';
import { Bouncy } from './Bouncy';

interface SpriteProps {
  /** What to show (see src/data/catalog.ts). */
  id: CatalogId;
  /** Square size in points; the character stands on the bottom edge. */
  size: number;
  /** React to taps (sound + jump + smile). Default true. */
  interactive?: boolean;
  /** Also say the name aloud when tapped ("Kedi!"). Default true. */
  speakName?: boolean;
  /** Force the happy face (e.g. during a celebration). */
  happy?: boolean;
  /** Offsets idle animations between characters. */
  seed?: number;
  /** Body color for recolorable drawings (e.g. the cars in "find the red car"). */
  tint?: string;
}

/**
 * The one way to show a passenger: `<Sprite id="cat" size={120} />`.
 *
 * Uses the Skia drawing from CHARACTER_ART when there is one, otherwise the
 * catalog's emoji placeholder. Either way it breathes gently, and when tapped
 * it hops, plays its sound and (optionally) says its name.
 */
export function Sprite({ id, size, interactive = true, speakName = true, happy = false, seed = 0, tint }: SpriteProps) {
  const { t, language } = useTranslation();
  const blink = useBlink(seed + 21);
  const [tapHappy, triggerHappy] = useTemporaryFlag(1400);
  const Art = CHARACTER_ART[id];
  const name = t(`catalog.${id}` as TranslationKey);

  // Idle "breathing": a slow, subtle squash anchored at the feet.
  const breathe = useSharedValue(0);
  const hop = useSharedValue(0);
  useEffect(() => {
    breathe.set(
      withRepeat(withTiming(1, { duration: durations.breathe, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [breathe]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: hop.value },
      { scaleX: 1 - breathe.value * 0.015 },
      { scaleY: 1 + breathe.value * 0.03 },
    ],
  }));

  const onPress = () => {
    triggerHappy();
    hop.set(
      withSequence(
        withTiming(-size * 0.25, { duration: 160, easing: Easing.out(Easing.quad) }),
        withSpring(0, springs.bouncy),
      ),
    );
    audio.playSfx(catalogSound(id));
    if (speakName) setTimeout(() => void audio.say(name, { language, clipId: `catalog.${id}` }), 350);
  };

  const body = (
    <Animated.View style={[{ width: size, height: size, transformOrigin: '50% 100%' }, style]}>
      {Art ? (
        <Art size={size} happy={happy || tapHappy} blink={blink} seed={seed} tint={tint} />
      ) : (
        <View style={[styles.emojiBox, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.74, lineHeight: size * 0.95 }} allowFontScaling={false}>
            {getCatalogItem(id).emoji}
          </Text>
        </View>
      )}
    </Animated.View>
  );

  if (!interactive) return body;
  return (
    <Bouncy onPress={onPress} sfx={null} accessibilityLabel={name}>
      {body}
    </Bouncy>
  );
}

const styles = StyleSheet.create({
  emojiBox: { alignItems: 'center', justifyContent: 'flex-end' },
});
