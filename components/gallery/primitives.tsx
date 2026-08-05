import { Platform } from 'react-native'
import { Paragraph, Text, XStack, YStack, styled } from 'tamagui'

/** Full-width fluid page rail — gutters + optional max via CSS `.g-container`. */
export const Container = styled(YStack, {
  name: 'GalleryContainer',
  width: '100%',
  maxWidth: '100%',
  alignSelf: 'stretch',
  paddingHorizontal: 16,
  boxSizing: 'border-box',
  $gtSm: {
    paddingHorizontal: 24,
  },
  $gtMd: {
    paddingHorizontal: 32,
  },
  $gtLg: {
    paddingHorizontal: 40,
  },
  $gtXl: {
    paddingHorizontal: 48,
  },
})

export function PageShell({
  children,
  className,
  bleed = false,
}: {
  children: React.ReactNode
  className?: string
  bleed?: boolean
}) {
  if (Platform.OS === 'web') {
    const pageClass = ['g-page', bleed ? 'g-page--bleed' : '', className || '']
      .filter(Boolean)
      .join(' ')
    return (
      <div className={pageClass}>
        {children}
      </div>
    )
  }
  return (
    <YStack width="100%" flex={1}>
      {children}
    </YStack>
  )
}

export function LabelCaps({
  children,
  color,
  className,
  style,
  ...props
}: {
  children?: React.ReactNode
  color?: string
  className?: string
  style?: any
  [key: string]: any
}) {
  if (Platform.OS === 'web') {
    return (
      <Text
        className={`g-label ${className || ''}`}
        color={color || '$color11'}
        style={style}
        {...props}
      >
        {children}
      </Text>
    )
  }
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      letterSpacing={1.98}
      textTransform="uppercase"
      fontWeight="500"
      color={color || '$color11'}
      style={style}
      {...props}
    >
      {children}
    </Text>
  )
}

export function SerifHeading({
  children,
  size = 'large',
  className,
  ...props
}: {
  children?: React.ReactNode
  size?: 'hero' | 'display' | 'titleXl' | 'large' | 'medium' | 'small' | 'work' | 'next'
  className?: string
  [key: string]: any
}) {
  const map = {
    hero: 'g-hero',
    display: 'g-display',
    titleXl: 'g-title-xl',
    large: 'g-title-lg',
    medium: 'g-title-md',
    small: 'g-title-md',
    work: 'g-title-sm',
    next: 'g-next-artist',
  } as const

  if (Platform.OS === 'web') {
    return (
      <Text
        className={`${map[size]} ${className || ''}`}
        color="$color12"
        {...props}
      >
        {children}
      </Text>
    )
  }

  const nativeSize = {
    hero: 48,
    display: 40,
    titleXl: 48,
    large: 32,
    medium: 28,
    small: 24,
    work: 28,
    next: 36,
  }[size]

  return (
    <Text
      fontFamily="$heading"
      fontSize={nativeSize}
      lineHeight={nativeSize * 0.95}
      letterSpacing={-0.5}
      fontWeight="500"
      color="$color12"
      {...props}
    >
      {children}
    </Text>
  )
}

export const Muted = styled(Paragraph, {
  name: 'Muted',
  color: '$color11',
  fontSize: 16,
  lineHeight: 26,
})

export const Hairline = styled(YStack, {
  name: 'Hairline',
  height: 1,
  width: '100%',
  backgroundColor: '$borderColor',
})

export function WorkGrid({
  children,
  cols = 3,
  className,
  style,
}: {
  children: React.ReactNode
  cols?: 3 | 4
  className?: string
  style?: any
}) {
  if (Platform.OS === 'web') {
    return (
      <div
        className={`${cols === 4 ? 'g-grid-4' : 'g-grid-3'} ${className || ''}`}
        style={{ marginTop: 48, width: '100%', ...(style || {}) }}
      >
        {children}
      </div>
    )
  }

  return (
    <XStack flexWrap="wrap" gap={24} rowGap={48} marginTop={40} width="100%" style={style}>
      {children}
    </XStack>
  )
}
