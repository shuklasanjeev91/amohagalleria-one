import { Card as TamaguiCard, styled, type CardProps as TamaguiCardProps } from 'tamagui'

const CardFrame = styled(TamaguiCard, {
  name: 'AppCard',
  backgroundColor: '$color2',
  borderRadius: '$5',
  borderWidth: 1,
  borderColor: '$borderColor',
  overflow: 'hidden',

  variants: {
    variant: {
      elevated: {
        borderWidth: 0,
        shadowColor: '$shadowColor',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
      },
      filled: {
        backgroundColor: '$color3',
        borderWidth: 0,
      },
    },

    padded: {
      true: {
        padding: '$4',
      },
      false: {
        padding: 0,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'elevated',
    padded: true,
  },
})

export type CardProps = TamaguiCardProps & {
  variant?: 'elevated' | 'outlined' | 'filled'
  padded?: boolean
}

export function Card({
  children,
  variant = 'elevated',
  padded = true,
  ...props
}: CardProps) {
  return (
    <CardFrame variant={variant} padded={padded} {...props}>
      {children}
    </CardFrame>
  )
}

export const CardHeader = styled(TamaguiCard.Header, {
  name: 'AppCardHeader',
  paddingBottom: '$3',
  gap: '$1',
})

export const CardFooter = styled(TamaguiCard.Footer, {
  name: 'AppCardFooter',
  paddingTop: '$3',
  gap: '$2',
  flexDirection: 'column',
  alignItems: 'stretch',
})

export const CardBackground = TamaguiCard.Background
