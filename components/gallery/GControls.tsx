import type { ReactNode } from 'react'
import { Platform, Pressable, TextInput, View } from 'react-native'
import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { PageShell } from '~/components/gallery/primitives'

type GButtonVariant = 'primary' | 'ghost' | 'danger'

export function GButton({
  children,
  onPress,
  variant = 'primary',
  disabled,
  type = 'button',
  href,
  className,
}: {
  children: ReactNode
  onPress?: () => void
  variant?: GButtonVariant
  disabled?: boolean
  type?: 'button' | 'submit'
  href?: string
  className?: string
}) {
  const variantClass =
    variant === 'ghost'
      ? 'g-auth-submit g-auth-submit--ghost'
      : variant === 'danger'
        ? 'g-auth-submit g-auth-submit--danger'
        : 'g-auth-submit'

  if (Platform.OS === 'web') {
    if (href) {
      return (
        <a
          href={href}
          className={`${variantClass} ${className || ''}`.trim()}
          style={{ display: 'inline-flex', width: 'auto' }}
        >
          <span>{children}</span>
          {variant !== 'ghost' ? (
            <span className="g-arrow-icon" aria-hidden>
              →
            </span>
          ) : null}
        </a>
      )
    }
    return (
      <button
        type={type}
        className={`${variantClass} ${className || ''}`.trim()}
        disabled={disabled}
        onClick={onPress}
        style={{ width: 'auto' }}
      >
        <span>{children}</span>
        {variant !== 'ghost' ? (
          <span className="g-arrow-icon" aria-hidden>
            →
          </span>
        ) : null}
      </button>
    )
  }

  return (
    <Pressable onPress={disabled ? undefined : onPress} disabled={disabled}>
      <XStack
        gap="$2"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor:
            variant === 'ghost' ? 'transparent' : variant === 'danger' ? '#7a3228' : '#7a3228',
          borderWidth: 1,
          borderColor: variant === 'ghost' ? '#ddd6cb' : 'transparent',
          opacity: disabled ? 0.5 : 1,
          minHeight: 44,
        }}
      >
        <Text
          color={(variant === 'ghost' ? '$accent' : '#fcfbf8') as any}
          fontFamily="$body"
          fontSize={14}
          fontWeight="500"
        >
          {children}
        </Text>
      </XStack>
    </Pressable>
  )
}

export function GField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  required,
  error,
  children,
}: {
  label: string
  value?: string
  onChangeText?: (v: string) => void
  placeholder?: string
  multiline?: boolean
  numberOfLines?: number
  secureTextEntry?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'url'
  required?: boolean
  error?: string | null
  children?: ReactNode
}) {
  if (Platform.OS === 'web' && !children) {
    return (
      <label className="g-auth-field">
        <span className="g-label">
          {label}
          {required ? ' *' : ''}
        </span>
        {multiline ? (
          <textarea
            rows={numberOfLines || 3}
            value={value}
            required={required}
            placeholder={placeholder}
            onChange={(e) => onChangeText?.(e.target.value)}
          />
        ) : (
          <input
            value={value}
            required={required}
            placeholder={placeholder}
            type={
              keyboardType === 'email-address'
                ? 'email'
                : keyboardType === 'url'
                  ? 'url'
                  : secureTextEntry
                    ? 'password'
                    : 'text'
            }
            onChange={(e) => onChangeText?.(e.target.value)}
          />
        )}
        {error ? <span className="g-auth-error">{error}</span> : null}
      </label>
    )
  }

  if (Platform.OS === 'web' && children) {
    return (
      <label className="g-auth-field">
        <span className="g-label">
          {label}
          {required ? ' *' : ''}
        </span>
        {children}
        {error ? <span className="g-auth-error">{error}</span> : null}
      </label>
    )
  }

  return (
    <YStack gap="$2" width="100%" marginBottom="$3">
      <Text
        fontFamily="$body"
        fontSize={11}
        letterSpacing={1.8}
        textTransform="uppercase"
        fontWeight="500"
        color="$color11"
      >
        {label}
        {required ? ' *' : ''}
      </Text>
      {children || (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          placeholderTextColor="#6f6860"
          style={{
            borderWidth: 1,
            borderColor: '#ddd6cb',
            backgroundColor: 'rgba(255,253,249,0.9)',
            paddingHorizontal: 14,
            paddingVertical: multiline ? 12 : 14,
            fontSize: 16,
            color: '#141210',
            minHeight: multiline ? 88 : 48,
            textAlignVertical: multiline ? 'top' : 'center',
          }}
        />
      )}
      {error ? (
        <Paragraph color="$accent" fontSize={13}>
          {error}
        </Paragraph>
      ) : null}
    </YStack>
  )
}

export function GSelect({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  required?: boolean
}) {
  if (Platform.OS === 'web') {
    return (
      <GField label={label} required={required}>
        <select value={value} required={required} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </GField>
    )
  }

  return (
    <YStack gap="$2" width="100%" marginBottom="$3">
      <Text
        fontFamily="$body"
        fontSize={11}
        letterSpacing={1.8}
        textTransform="uppercase"
        fontWeight="500"
        color="$color11"
      >
        {label}
        {required ? ' *' : ''}
      </Text>
      <YStack gap="$2">
        {options.map((o) => {
          const selected = o.value === value
          return (
            <Pressable key={o.value} onPress={() => onChange(o.value)}>
              <XStack
                alignItems="center"
                paddingVertical="$3"
                paddingHorizontal="$3"
                borderWidth={1}
                borderColor={selected ? '$accent' : '$borderColor'}
                backgroundColor={selected ? '$secondary' : 'transparent'}
              >
                <Text color={selected ? '$accent' : '$color'} fontSize={15}>
                  {o.label}
                </Text>
              </XStack>
            </Pressable>
          )
        })}
      </YStack>
    </YStack>
  )
}

export function GPage({
  children,
  className,
  bleed,
}: {
  children: ReactNode
  className?: string
  bleed?: boolean
}) {
  return (
    <PageShell className={className} bleed={bleed}>
      <YStack width="100%" flex={1} gap="$0">
        {children}
      </YStack>
    </PageShell>
  )
}

export function GListRow({
  thumb,
  title,
  meta,
  status,
  actions,
  onPress,
}: {
  thumb?: ReactNode
  title: ReactNode
  meta?: ReactNode
  status?: ReactNode
  actions?: ReactNode
  onPress?: () => void
}) {
  const body = (
    <XStack
      width="100%"
      gap="$3"
      paddingVertical="$3"
      paddingHorizontal="$3"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      alignItems="flex-start"
      backgroundColor="$color1"
    >
      {thumb ? (
        <YStack width={48} height={48} overflow="hidden" backgroundColor="$secondary">
          {thumb}
        </YStack>
      ) : null}
      <YStack flex={1} gap="$1" minWidth={0}>
        <Text fontFamily="$heading" fontSize={18} color="$color" numberOfLines={2}>
          {title}
        </Text>
        {meta ? (
          <Text fontSize={13} color="$color11" numberOfLines={2}>
            {meta}
          </Text>
        ) : null}
        {status ? <YStack marginTop="$1">{status}</YStack> : null}
        {actions ? (
          <XStack flexWrap="wrap" gap="$2" marginTop="$2">
            {actions}
          </XStack>
        ) : null}
      </YStack>
    </XStack>
  )

  if (onPress) {
    return <Pressable onPress={onPress}>{body}</Pressable>
  }
  return body
}

export function GEmpty({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') {
    return <p className="g-admin-grid__empty" style={{ border: 'none' }}>{children}</p>
  }
  return (
    <YStack padding="$6" alignItems="center">
      <Text color="$color11" textAlign="center">
        {children}
      </Text>
    </YStack>
  )
}

export function GBanner({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'success' | 'error'
  children: ReactNode
}) {
  if (Platform.OS === 'web') {
    const cls =
      tone === 'error' ? 'g-auth-error' : tone === 'success' ? 'g-auth-success' : 'g-auth-info'
    return <p className={cls}>{children}</p>
  }
  const color = tone === 'error' || tone === 'success' ? '$accent' : '$color11'
  return (
    <YStack
      padding="$3"
      marginBottom="$3"
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$secondary"
    >
      <Text color={color as any} fontSize={14}>
        {children}
      </Text>
    </YStack>
  )
}

export function GCheckField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  if (Platform.OS === 'web') {
    return (
      <label className="g-auth-field" style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="g-label" style={{ margin: 0 }}>
          {label}
        </span>
      </label>
    )
  }
  return (
    <Pressable onPress={() => onChange(!checked)}>
      <XStack alignItems="center" gap="$3" marginBottom="$3" paddingVertical="$2">
        <View
          style={{
            width: 22,
            height: 22,
            borderWidth: 1,
            borderColor: checked ? '#7a3228' : '#ddd6cb',
            backgroundColor: checked ? '#7a3228' : 'transparent',
          }}
        />
        <Text fontSize={15} color="$color">
          {label}
        </Text>
      </XStack>
    </Pressable>
  )
}
