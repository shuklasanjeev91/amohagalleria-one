import { Link } from 'one'
import type { ReactNode } from 'react'
import { Platform } from 'react-native'
import { Text, XStack } from 'tamagui'
import { LabelCaps } from './primitives'

export function ArrowLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  if (Platform.OS === 'web') {
    const external =
      href.startsWith('http') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:')
    if (external) {
      const blank = href.startsWith('http')
      return (
        <a
          href={href}
          className={`g-arrow ${className || ''}`}
          {...(blank ? { target: '_blank', rel: 'noreferrer' } : null)}
        >
          <span className="g-label" style={{ color: 'inherit' }}>
            {children}
          </span>
          <span className="g-arrow-icon" aria-hidden>
            →
          </span>
        </a>
      )
    }
    return (
      <Link href={href as any} className={`g-arrow ${className || ''}`}>
        <span className="g-label" style={{ color: 'inherit' }}>
          {children}
        </span>
        <span className="g-arrow-icon" aria-hidden>
          →
        </span>
      </Link>
    )
  }

  return (
    <Link href={href as any}>
      <XStack
        alignItems="center"
        gap="$2"
        borderBottomWidth={1}
        borderBottomColor="$color12"
        paddingBottom={4}
        pressStyle={{ opacity: 0.7 }}
      >
        <LabelCaps color="$color12">{children}</LabelCaps>
        <Text fontSize={14}>→</Text>
      </XStack>
    </Link>
  )
}
