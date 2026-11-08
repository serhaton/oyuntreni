import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AudioBridge } from '@/components/AudioBridge';
import { IntroSplash } from '@/components/IntroSplash';
import { LanguageProvider, useLanguage } from '@/i18n';
import { PremiumProvider, usePremium } from '@/services/PremiumProvider';
import { ProgressProvider, useProgress } from '@/services/ProgressProvider';
import { fontAssets } from '@/theme';

// Keep the splash visible until fonts, the saved language, purchase state and progress are ready,
// so the child never sees a flash of wrong font or wrong language.
SplashScreen.preventAutoHideAsync().catch(() => {});

function AppShell({ fontsReady }: { fontsReady: boolean }) {
  const { ready: languageReady } = useLanguage();
  // Wait for the saved purchase too, so a paid game never flashes its locks.
  const { ready: premiumReady } = usePremium();
  const { ready: progressReady } = useProgress();
  const ready = fontsReady && languageReady && premiumReady && progressReady;
  // The animated intro takes over from the native splash on every launch.
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      {/* Hide the status bar: it's a game, every pixel is play space. */}
      <StatusBar hidden />
      <AudioBridge />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
      {intro && <IntroSplash onDone={() => setIntro(false)} />}
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    // app.json already requests landscape; this also enforces it inside Expo Go.
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <ProgressProvider>
            <PremiumProvider>
              {/* If a font fails to load we still start (system font) rather than block the child. */}
              <AppShell fontsReady={fontsLoaded || fontError != null} />
            </PremiumProvider>
          </ProgressProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
