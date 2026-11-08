/**
 * Oyun Treni color palette.
 *
 * Bright, saturated, cheerful colors. Components should never hard-code hex
 * values; they pull from here so the whole game can be re-tinted in one place.
 */
export const colors = {
  // Sky
  sky: '#4FC3F7',
  skyLight: '#B3E5FC',
  skyDeep: '#29B6F6',

  // Ground & nature
  grass: '#66BB6A',
  grassLight: '#9CCC65',
  grassDark: '#43A047',
  hillFar: '#A5D6A7',
  hillFarShade: '#81C784',
  hillFarthest: '#C8E6C9',
  treeTrunk: '#8D6E63',
  pine: '#2E7D32',
  sunRay: '#FFB300',
  cloudShade: '#D6EEFB',

  // Train & track
  chassis: '#4E342E',
  metal: '#78909C',
  rail: '#90A4AE',
  railShine: '#CFD8DC',
  sleeper: '#8D6E63',
  ballast: '#D7CCC8',
  smoke: '#F5F5F5',

  // Tracing
  tracingLane: '#E3F2FD',
  selectedBg: '#EAF7EA',

  // Characters (Skia art)
  catFur: '#FFB74D',
  catStripe: '#F57C00',
  rabbitFur: '#F3E5F5',
  rabbitShade: '#E1BEE7',
  innerEar: '#F8BBD0',
  duckFeather: '#FFEE58',
  duckWing: '#FDD835',
  beak: '#FF9800',
  monkeyFur: '#8D6E63',
  monkeyFace: '#FFE0B2',
  beeBody: '#FFD54F',
  beeWing: '#E1F5FE',
  antBody: '#EF5350',
  pomegranate: '#D32F2F',
  pomegranateDark: '#9A1B1B',
  leaf: '#7CB342',
  belly: '#FFF3E0',

  // Accent colors
  sun: '#FFD54F',
  sunGlow: '#FFF59D',
  candyPink: '#FF8AC6',
  orange: '#FFA726',
  red: '#EF5350',
  purple: '#AB47BC',
  blue: '#42A5F5',
  teal: '#26C6DA',

  // Neutrals
  white: '#FFFFFF',
  cloud: '#FFFFFF',
  ink: '#3D2C5E', // soft dark purple instead of harsh black, used for text and outlines
  inkSoft: '#6E5A8F',
  shadow: 'rgba(61, 44, 94, 0.25)',
} as const;

/** Rainbow sequence used for traced letters, title letters, confetti, etc. */
export const rainbow = [
  colors.red,
  colors.orange,
  colors.sun,
  colors.grass,
  colors.blue,
  colors.purple,
  colors.candyPink,
] as const;

export type ColorName = keyof typeof colors;
