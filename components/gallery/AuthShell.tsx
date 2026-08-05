import type { ReactNode } from 'react'
import { Platform } from 'react-native'
import { Text, YStack } from 'tamagui'
import { SeoHead } from './SeoHead'
import { Container, LabelCaps, Muted } from './primitives'

/** Premium full-bleed auth layout for login / register. */
export function AuthShell({
  mode,
  title,
  lede,
  seoTitle,
  seoPath,
  children,
}: {
  mode: 'login' | 'register'
  title: string
  lede: string
  seoTitle: string
  seoPath: string
  children: ReactNode
}) {
  if (Platform.OS !== 'web') {
    return (
      <YStack width="100%" backgroundColor="$background" flex={1}>
        <SeoHead title={seoTitle} path={seoPath} noIndex />
        <YStack
          paddingHorizontal={20}
          paddingTop={32}
          paddingBottom={16}
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          backgroundColor="$secondary"
        >
          <Text
            fontFamily="$heading"
            fontSize={28}
            letterSpacing={-0.4}
            color="$color"
          >
            Amoha Galleria
          </Text>
          <Muted fontSize={13} marginTop={6}>
            {mode === 'login'
              ? 'Private access with a one-time email code.'
              : 'Join collectors and artists — verify by email.'}
          </Muted>
        </YStack>
        <Container
          className="g-container"
          paddingTop={28}
          paddingBottom={80}
          width="100%"
          maxWidth="100%"
        >
          <LabelCaps color="$accent">Account</LabelCaps>
          <Text
            fontFamily="$heading"
            fontSize={36}
            lineHeight={40}
            letterSpacing={-0.5}
            marginTop={16}
            marginBottom={12}
          >
            {title}
          </Text>
          <Muted fontSize={15} lineHeight={24} marginBottom={28}>
            {lede}
          </Muted>
          {children}
        </Container>
      </YStack>
    )
  }

  return (
    <div className="g-auth-page">
      <SeoHead title={seoTitle} path={seoPath} noIndex />
      <div className="g-auth-page__stage">
        <aside className="g-auth-page__aside" aria-hidden={false}>
          <div className="g-auth-page__aside-veil" />
          <div className="g-auth-page__aside-content">
            <p className="g-label g-auth-page__brand">Amoha Galleria</p>
            <h1 className="g-auth-page__aside-title">
              {mode === 'login' ? 'Private access' : 'Join the gallery'}
            </h1>
            <p className="g-auth-page__aside-copy">
              {mode === 'login'
                ? 'A quiet entrance for collectors and artists — sign in with a one-time email code, no password to remember.'
                : 'Create your account with email verification. Stay close to openings, private views, and new acquisitions.'}
            </p>
            <ul className="g-auth-page__aside-points">
              <li>Email OTP — no password</li>
              <li>Secure session with Supabase</li>
              <li>Artist studio by invitation</li>
            </ul>
          </div>
        </aside>

        <div className="g-auth-page__main">
          <div className="g-auth-page__main-inner">
            <header className="g-auth-page__header">
              <p className="g-label g-auth-page__eyebrow">Account</p>
              <h2 className="g-auth-page__title">{title}</h2>
              <p className="g-auth-page__lede">{lede}</p>
            </header>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
