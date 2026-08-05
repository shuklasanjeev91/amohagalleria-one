import {
  Button as TamaguiButton,
  type ButtonProps as TamaguiButtonProps,
  Spinner,
  styled,
} from 'tamagui'

const ButtonFrame = styled(TamaguiButton, {
  name: 'AppButton',
  borderRadius: '$4',
  fontWeight: '600',
  pressStyle: {
    opacity: 0.85,
    scale: 0.98,
  },

  variants: {
    intent: {
      primary: {
        backgroundColor: '$blue10',
        color: 'white',
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: '$blue11',
        },
      },
      secondary: {
        backgroundColor: '$color3',
        color: '$color12',
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: '$color4',
        },
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
        color: '$color12',
        hoverStyle: {
          backgroundColor: '$color2',
          borderColor: '$borderColorHover',
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        color: '$color11',
        hoverStyle: {
          backgroundColor: '$color3',
        },
      },
      danger: {
        backgroundColor: '$red10',
        color: 'white',
        borderWidth: 0,
        hoverStyle: {
          backgroundColor: '$red11',
        },
      },
    },

    scale: {
      sm: {
        height: '$3',
        paddingHorizontal: '$3',
        fontSize: '$3',
      },
      md: {
        height: '$4',
        paddingHorizontal: '$4',
        fontSize: '$4',
      },
      lg: {
        height: '$5',
        paddingHorizontal: '$5',
        fontSize: '$5',
      },
    },
  } as const,

  defaultVariants: {
    intent: 'primary',
    scale: 'md',
  },
})

export type ButtonProps = Omit<TamaguiButtonProps, 'size'> & {
  intent?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  /** @deprecated Use `intent` instead */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  scale?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  children,
  loading,
  disabled,
  icon,
  intent,
  variant,
  scale = 'md',
  ...props
}: ButtonProps) {
  return (
    <ButtonFrame
      intent={intent ?? variant ?? 'primary'}
      scale={scale}
      disabled={disabled || loading}
      opacity={disabled || loading ? 0.6 : 1}
      icon={loading ? undefined : icon}
      {...props}
    >
      {loading ? <Spinner size="small" color="currentColor" /> : children}
    </ButtonFrame>
  )
}
