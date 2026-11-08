/**
 * Base sizes, expressed in "design points" for a reference iPhone in landscape.
 * Components scale these through `useDeviceLayout().s()` so they look right on
 * every iPhone and iPad. Do not use these raw numbers for layout directly.
 */
export const sizes = {
  /** Reference landscape screen (iPhone 14/15/16: 844 x 390 pt). */
  designWidth: 844,
  designHeight: 390,

  /** Shortest side (pt) at or above which a device counts as a tablet. */
  tabletBreakpoint: 600,

  /** Minimum touch targets. Kids need big targets (Apple suggests 44pt for adults). */
  touchTargetPhone: 64,
  touchTargetTablet: 88,

  /** Spacing scale. */
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },

  /** Corner radii. Everything is rounded and friendly. */
  radius: { sm: 12, md: 20, lg: 32, pill: 999 },

  /** Minimum gap kept from screen edges beyond the safe-area insets. */
  edgeGutter: 12,
} as const;
