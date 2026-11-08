import * as Haptics from 'expo-haptics';

/**
 * Thin wrapper around expo-haptics so the rest of the app never imports it
 * directly (easy to mute globally or swap later). Failures are ignored:
 * some devices (e.g. iPads) simply have no haptic engine.
 */
export const haptics = {
  /** Very light tick for ordinary taps. */
  tap() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  /** A happy buzz for success moments (letter traced, right answer...). */
  success() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
};
