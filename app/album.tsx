import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { BackButton } from '@/components/BackButton';
import { Bouncy } from '@/components/Bouncy';
import { ParallaxBackground } from '@/components/ParallaxBackground';
import { Sprite } from '@/components/Sprite';
import { CATALOG, CATALOG_IDS, type CatalogId, type CatalogKind } from '@/data/catalog';
import { useDeviceLayout } from '@/hooks/useDeviceLayout';
import { useSay } from '@/hooks/useSay';
import { useTranslation } from '@/i18n';
import { useProgress } from '@/services/ProgressProvider';
import { colors, fonts, sizes } from '@/theme';

/** Album pages, in order, each with a character that represents it on its tab. */
const TABS: { kind: CatalogKind; icon: CatalogId; color: keyof typeof colors }[] = [
  { kind: 'animal', icon: 'cat', color: 'grass' },
  { kind: 'toy', icon: 'teddy', color: 'orange' },
  { kind: 'vehicle', icon: 'car', color: 'blue' },
  { kind: 'food', icon: 'strawberry', color: 'candyPink' },
];

/**
 * Sticker album: every character the child has taken on a full trip train.
 * Collected stickers make their sound, hop and say their name when tapped;
 * the rest wait as "?" spots to discover.
 */
export default function AlbumScreen() {
  const { t } = useTranslation();
  const say = useSay();
  const { safe, s, touchTarget, width: W } = useDeviceLayout();
  const { stickers } = useProgress();
  const [tab, setTab] = useState<CatalogKind>('animal');

  useEffect(() => {
    const timer = setTimeout(() => void say('speech.albumWelcome'), 500);
    return () => clearTimeout(timer);
  }, [say]);

  const items = CATALOG_IDS.filter((id) => CATALOG[id].kind === tab);
  const owned = items.filter((id) => stickers.includes(id)).length;

  // Grid: as many columns as fit, every slot comfortably tappable.
  const slot = Math.max(touchTarget * 1.3, s(104));
  const gap = s(18);
  const gridWidth = W - safe.left - safe.right - s(24);
  const columns = Math.max(3, Math.floor((gridWidth + gap) / (slot + gap)));
  const tabSize = touchTarget * 1.15;

  const chooseTab = (kind: CatalogKind) => {
    setTab(kind);
    void say(`albumTabs.${kind}`);
  };

  return (
    <View style={styles.root}>
      <ParallaxBackground />

      {/* Tabs: one big round button per album page */}
      <View style={[styles.tabs, { top: safe.top, gap: s(18) }]} pointerEvents="box-none">
        {TABS.map((tb) => {
          const selected = tb.kind === tab;
          return (
            <Bouncy key={tb.kind} onPress={() => chooseTab(tb.kind)} accessibilityLabel={t(`albumTabs.${tb.kind}`)}>
              <View
                style={[
                  styles.tab,
                  {
                    width: tabSize,
                    height: tabSize,
                    borderRadius: tabSize / 2,
                    backgroundColor: colors[tb.color],
                    borderWidth: selected ? s(6) : s(3),
                    borderColor: selected ? colors.sunGlow : colors.white,
                    transform: [{ scale: selected ? 1.12 : 0.92 }],
                  },
                ]}
              >
                <Sprite id={tb.icon} size={tabSize * 0.72} interactive={false} />
              </View>
            </Bouncy>
          );
        })}
      </View>

      {/* How many of this page are collected (for grown-ups) */}
      <View style={[styles.counter, { top: safe.top + s(8), right: safe.right + s(8), paddingHorizontal: s(14) }]}>
        <Text allowFontScaling={false} style={[styles.counterText, { fontSize: s(22) }]}>
          {owned}/{items.length}
        </Text>
      </View>

      <ScrollView
        style={{ marginTop: safe.top + tabSize + s(20) }}
        contentContainerStyle={[
          styles.grid,
          { paddingHorizontal: safe.left + s(12), paddingBottom: safe.bottom + s(24), gap, width: W },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {items.map((id, i) => {
          const has = stickers.includes(id);
          return (
            <Animated.View
              key={`${tab}-${id}`}
              entering={ZoomIn.delay(Math.min(i, 15) * 35).springify()}
              style={{ width: (gridWidth - gap * (columns - 1)) / columns, alignItems: 'center' }}
            >
              {has ? (
                <View
                  style={[
                    styles.sticker,
                    {
                      width: slot,
                      height: slot,
                      borderRadius: sizes.radius.md,
                      transform: [{ rotate: `${((i * 37) % 9) - 4}deg` }],
                    },
                  ]}
                >
                  <Sprite id={id} size={slot * 0.86} seed={i} />
                </View>
              ) : (
                <View style={[styles.empty, { width: slot, height: slot, borderRadius: sizes.radius.md }]}>
                  <Text allowFontScaling={false} style={[styles.question, { fontSize: slot * 0.42 }]}>
                    ?
                  </Text>
                </View>
              )}
            </Animated.View>
          );
        })}
      </ScrollView>

      <View style={[styles.back, { top: safe.top, left: safe.left }]}>
        <BackButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { position: 'absolute', zIndex: 10 },
  tabs: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  counter: {
    position: 'absolute',
    zIndex: 5,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: sizes.radius.pill,
    paddingVertical: 4,
  },
  counterText: { fontFamily: fonts.bold, color: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  sticker: {
    backgroundColor: colors.white,
    borderWidth: 4,
    borderColor: colors.sunGlow,
    alignItems: 'center',
    justifyContent: 'flex-end',
    shadowColor: colors.ink,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  empty: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: { fontFamily: fonts.bold, color: colors.white, opacity: 0.8 },
});
