import { XStack, YStack, ZStack, styled } from 'tamagui'

export const Stack = styled(YStack, {
  name: 'AppStack',

  variants: {
    direction: {
      vertical: {
        flexDirection: 'column',
      },
      horizontal: {
        flexDirection: 'row',
      },
    },

    centered: {
      true: {
        alignItems: 'center',
        justifyContent: 'center',
      },
    },

    spaced: {
      true: {
        justifyContent: 'space-between',
      },
    },

    space: {
      none: { gap: 0 },
      xs: { gap: '$1' },
      sm: { gap: '$2' },
      md: { gap: '$3' },
      lg: { gap: '$4' },
      xl: { gap: '$6' },
    },

    padded: {
      none: { padding: 0 },
      sm: { padding: '$2' },
      md: { padding: '$4' },
      lg: { padding: '$6' },
    },
  } as const,

  defaultVariants: {
    direction: 'vertical',
    space: 'md',
  },
})

export const Row = styled(XStack, {
  name: 'AppRow',
  alignItems: 'center',

  variants: {
    spaced: {
      true: {
        justifyContent: 'space-between',
      },
    },
    centered: {
      true: {
        justifyContent: 'center',
      },
    },
    space: {
      none: { gap: 0 },
      xs: { gap: '$1' },
      sm: { gap: '$2' },
      md: { gap: '$3' },
      lg: { gap: '$4' },
      xl: { gap: '$6' },
    },
  } as const,

  defaultVariants: {
    space: 'md',
  },
})

export const Column = styled(YStack, {
  name: 'AppColumn',

  variants: {
    centered: {
      true: {
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    space: {
      none: { gap: 0 },
      xs: { gap: '$1' },
      sm: { gap: '$2' },
      md: { gap: '$3' },
      lg: { gap: '$4' },
      xl: { gap: '$6' },
    },
    padded: {
      none: { padding: 0 },
      sm: { padding: '$2' },
      md: { padding: '$4' },
      lg: { padding: '$6' },
    },
  } as const,

  defaultVariants: {
    space: 'md',
  },
})
export const Overlay = styled(ZStack, {
  name: 'AppOverlay',
  fullscreen: true,
})

export { XStack, YStack, ZStack }
