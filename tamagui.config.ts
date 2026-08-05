import { defaultConfig } from '@tamagui/config/v5'
import { createFont, createTamagui, createTokens } from 'tamagui'

const headingFont = createFont({
  family: 'Cormorant Garamond, "Times New Roman", Times, serif',
  size: defaultConfig.fonts.heading.size,
  lineHeight: defaultConfig.fonts.heading.lineHeight,
  weight: defaultConfig.fonts.heading.weight,
  letterSpacing: defaultConfig.fonts.heading.letterSpacing,
  face: {
    400: { normal: 'CormorantGaramond_400Regular' },
    500: { normal: 'CormorantGaramond_500Medium' },
    600: { normal: 'CormorantGaramond_600SemiBold' },
    700: { normal: 'CormorantGaramond_700Bold' },
  },
})

const bodyFont = createFont({
  family: 'DM Sans, ui-sans-serif, system-ui, sans-serif',
  size: defaultConfig.fonts.body.size,
  lineHeight: defaultConfig.fonts.body.lineHeight,
  weight: defaultConfig.fonts.body.weight,
  letterSpacing: defaultConfig.fonts.body.letterSpacing,
  face: {
    400: { normal: 'DMSans_400Regular' },
    500: { normal: 'DMSans_500Medium' },
    600: { normal: 'DMSans_600SemiBold' },
    700: { normal: 'DMSans_700Bold' },
  },
})

const tokens = createTokens({
  ...defaultConfig.tokens,
  color: {
    ...defaultConfig.tokens.color,
    galleryBg: '#f8f6f2',
    galleryFg: '#141210',
    galleryMuted: '#6f6860',
    gallerySecondary: '#ece7df',
    galleryBorder: '#ddd6cb',
    galleryAccent: '#7a3228',
    galleryCard: '#fcfbf8',
    galleryBronze: '#a68b6a',
    galleryInk: '#0e0c0a',
  },
  space: {
    ...defaultConfig.tokens.space,
    5: 20,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
    36: 144,
    40: 160,
  },
})

const light = {
  background: tokens.color.galleryBg,
  backgroundHover: tokens.color.gallerySecondary,
  backgroundPress: tokens.color.galleryBorder,
  backgroundFocus: tokens.color.gallerySecondary,
  color: tokens.color.galleryFg,
  colorHover: tokens.color.galleryFg,
  colorPress: tokens.color.galleryFg,
  colorFocus: tokens.color.galleryFg,
  color1: tokens.color.galleryCard,
  color2: tokens.color.galleryCard,
  color3: tokens.color.gallerySecondary,
  color4: tokens.color.galleryBorder,
  color5: tokens.color.galleryBorder,
  color6: tokens.color.galleryMuted,
  color7: tokens.color.galleryMuted,
  color8: tokens.color.galleryMuted,
  color9: tokens.color.galleryMuted,
  color10: tokens.color.galleryMuted,
  color11: tokens.color.galleryMuted,
  color12: tokens.color.galleryFg,
  borderColor: tokens.color.galleryBorder,
  borderColorHover: tokens.color.galleryFg,
  borderColorFocus: tokens.color.galleryAccent,
  borderColorPress: tokens.color.galleryFg,
  placeholderColor: tokens.color.galleryMuted,
  outlineColor: tokens.color.galleryAccent,
  accent: tokens.color.galleryAccent,
  secondary: tokens.color.gallerySecondary,
  bronze: tokens.color.galleryBronze,
  muted: tokens.color.galleryMuted,
  border: tokens.color.galleryBorder,
  ink: tokens.color.galleryInk,
  shadowColor: 'rgba(14, 12, 10, 0.14)',
}

const tamaguiConfig = createTamagui({
  ...defaultConfig,
  tokens,
  fonts: {
    ...defaultConfig.fonts,
    heading: headingFont,
    body: bodyFont,
  },
  media: {
    ...defaultConfig.media,
    xs: { maxWidth: 660 },
    sm: { minWidth: 640 },
    md: { minWidth: 768 },
    lg: { minWidth: 1024 },
    xl: { minWidth: 1280 },
    xxl: { minWidth: 1536 },
    gtXs: { minWidth: 661 },
    gtSm: { minWidth: 640 },
    gtMd: { minWidth: 768 },
    gtLg: { minWidth: 1024 },
    gtXl: { minWidth: 1280 },
  },
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      ...light,
    },
    dark: {
      ...defaultConfig.themes.light,
      ...light,
    },
  },
})

export default tamaguiConfig

export type Conf = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
