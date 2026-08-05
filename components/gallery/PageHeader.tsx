import type { ReactNode } from 'react'
import { Platform } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { Container, LabelCaps, Muted } from './primitives'

export function PageHeader({
  eyebrow,
  title,
  lede,
  meta,
}: {
  eyebrow?: string
  title: string
  lede?: string
  meta?: ReactNode
}) {
  return (
    <Container
      className="g-container g-page-header"
      paddingTop={48}
      paddingBottom={28}
      $gtSm={{ paddingTop: 64, paddingBottom: 36 }}
      $gtMd={{ paddingTop: 88, paddingBottom: 48 }}
      $gtLg={{ paddingTop: 104, paddingBottom: 56 }}
      width="100%"
      maxWidth="100%"
    >
      {eyebrow ? <LabelCaps color="$accent">{eyebrow}</LabelCaps> : null}
      {Platform.OS === 'web' ? (
        <h1 className="g-display g-page-header__title">{title}</h1>
      ) : (
        <Text
          fontFamily="$heading"
          fontSize={36}
          lineHeight={38}
          letterSpacing={-0.5}
          fontWeight="500"
          color="$color12"
          marginTop={16}
          $gtSm={{ fontSize: 44, lineHeight: 46 }}
        >
          {title}
        </Text>
      )}
      {lede ? (
        Platform.OS === 'web' ? (
          <p className="g-page-header__lede">{lede}</p>
        ) : (
          <Muted
            marginTop={20}
            width="100%"
            maxWidth="100%"
            fontSize={16}
            lineHeight={26}
            $gtMd={{ fontSize: 18, lineHeight: 30 }}
          >
            {lede}
          </Muted>
        )
      ) : null}
      {meta ? <YStack marginTop={24} width="100%">{meta}</YStack> : null}
    </Container>
  )
}

export function SectionHeading({
  index,
  title,
  action,
}: {
  index: string
  title: string
  action?: ReactNode
}) {
  return (
    <XStack
      className="g-section-heading"
      alignItems="flex-end"
      justifyContent="space-between"
      gap={16}
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      paddingBottom={16}
      flexWrap="wrap"
      width="100%"
      $gtMd={{ gap: 24, paddingBottom: 18 }}
    >
      <XStack alignItems="baseline" gap={12} flexShrink={1} $gtMd={{ gap: 16 }}>
        <LabelCaps color="$accent">{index}</LabelCaps>
        {Platform.OS === 'web' ? (
          <h2 className="g-section-heading__title">{title}</h2>
        ) : (
          <Text fontFamily="$heading" fontSize={24} lineHeight={28} fontWeight="500" $gtMd={{ fontSize: 28, lineHeight: 32 }}>
            {title}
          </Text>
        )}
      </XStack>
      {action}
    </XStack>
  )
}
