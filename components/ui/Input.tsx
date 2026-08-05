import {
  Input as TamaguiInput,
  Label,
  styled,
  type InputProps as TamaguiInputProps,
  YStack,
  Text,
} from 'tamagui'

const InputFrame = styled(TamaguiInput, {
  name: 'AppInput',
  backgroundColor: '$color2',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$4',
  color: '$color12',
  placeholderTextColor: '$color8',
  fontSize: '$4',
  height: '$4',
  paddingHorizontal: '$3',

  focusStyle: {
    borderColor: '$blue8',
    outlineWidth: 0,
  },

  variants: {
    scale: {
      sm: {
        height: '$3',
        fontSize: '$3',
        paddingHorizontal: '$2.5',
      },
      md: {
        height: '$4',
        fontSize: '$4',
        paddingHorizontal: '$3',
      },
      lg: {
        height: '$5',
        fontSize: '$5',
        paddingHorizontal: '$4',
      },
    },

    invalid: {
      true: {
        borderColor: '$red8',
        focusStyle: {
          borderColor: '$red9',
        },
      },
    },
  } as const,

  defaultVariants: {
    scale: 'md',
  },
})

export type InputProps = Omit<TamaguiInputProps, 'size'> & {
  label?: string
  helperText?: string
  errorMessage?: string
  scale?: 'sm' | 'md' | 'lg'
  id?: string
}

export function Input({
  label,
  helperText,
  errorMessage,
  scale = 'md',
  id,
  ...props
}: InputProps) {
  const hasError = Boolean(errorMessage)

  return (
    <YStack gap="$2" width="100%">
      {label ? (
        <Label htmlFor={id} fontSize="$3" color="$color11" fontWeight="500">
          {label}
        </Label>
      ) : null}

      <InputFrame id={id} scale={scale} invalid={hasError} {...props} />

      {errorMessage ? (
        <Text fontSize="$2" color="$red10">
          {errorMessage}
        </Text>
      ) : helperText ? (
        <Text fontSize="$2" color="$color9">
          {helperText}
        </Text>
      ) : null}
    </YStack>
  )
}
