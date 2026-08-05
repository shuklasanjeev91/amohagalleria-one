import { Separator as TamaguiSeparator, styled } from 'tamagui'

export const Separator = styled(TamaguiSeparator, {
  name: 'AppSeparator',
  borderColor: '$borderColor',

  variants: {
    vertical: {
      true: {
        borderWidth: 0,
        borderLeftWidth: 1,
        height: '100%',
        width: 0,
      },
    },
  } as const,
})
