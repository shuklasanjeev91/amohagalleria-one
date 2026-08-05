import { Paragraph, SizableText, styled, H1, H2, H3, H4 } from 'tamagui'

export const Heading = styled(H1, {
  name: 'AppHeading',
  color: '$color12',
  fontWeight: '700',
  letterSpacing: -0.5,

  variants: {
    level: {
      1: {
        fontSize: '$9',
        lineHeight: '$9',
      },
      2: {
        fontSize: '$8',
        lineHeight: '$8',
      },
      3: {
        fontSize: '$7',
        lineHeight: '$7',
      },
      4: {
        fontSize: '$6',
        lineHeight: '$6',
      },
    },
  } as const,

  defaultVariants: {
    level: 1,
  },
})

export const Title = styled(H2, {
  name: 'AppTitle',
  color: '$color12',
  fontSize: '$7',
  fontWeight: '600',
  lineHeight: '$7',
})

export const Subtitle = styled(H3, {
  name: 'AppSubtitle',
  color: '$color11',
  fontSize: '$5',
  fontWeight: '500',
  lineHeight: '$5',
})

export const Body = styled(Paragraph, {
  name: 'AppBody',
  color: '$color11',
  fontSize: '$4',
  lineHeight: '$5',

  variants: {
    muted: {
      true: {
        color: '$color9',
      },
    },
    strong: {
      true: {
        color: '$color12',
        fontWeight: '600',
      },
    },
  } as const,
})

export const Caption = styled(SizableText, {
  name: 'AppCaption',
  color: '$color9',
  fontSize: '$2',
  lineHeight: '$2',
})

export const LabelText = styled(H4, {
  name: 'AppLabelText',
  color: '$color11',
  fontSize: '$3',
  fontWeight: '500',
  lineHeight: '$3',
})
