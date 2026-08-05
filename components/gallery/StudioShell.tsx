import { Link } from 'one'
import type { ReactNode } from 'react'
import { Platform, ScrollView } from 'react-native'
import { Text, YStack } from 'tamagui'
import { useGalleryAuth } from '~/lib/AuthProvider'
import { PageHeader } from '~/components/gallery/PageHeader'
import { Container, LabelCaps, Muted } from '~/components/gallery/primitives'

export function StudioGate({
  children,
  requireArtist = false,
  requireAdmin = false,
}: {
  children: ReactNode
  requireArtist?: boolean
  requireAdmin?: boolean
}) {
  const { user, loading, configured, isArtist, isAdmin } = useGalleryAuth()

  if (!configured) {
    return (
      <YStack width="100%">
        <PageHeader
          eyebrow="Studio"
          title="Configure Supabase"
          lede="Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart the dev server."
        />
      </YStack>
    )
  }

  if (loading && !user) {
    return (
      <Container className="g-container" py="$16" width="100%">
        <Muted>Loading account…</Muted>
      </Container>
    )
  }

  if (!user) {
    return (
      <YStack width="100%">
        <PageHeader
          eyebrow="Studio"
          title="Sign in required"
          lede="Use email OTP to access the artist studio."
        />
        <Container className="g-container" pb="$16" width="100%">
          <Link href="/login" className="g-auth-submit" style={{ display: 'inline-flex' }}>
            Sign in →
          </Link>
        </Container>
      </YStack>
    )
  }

  if (requireAdmin && !isAdmin) {
    return (
      <YStack width="100%">
        <PageHeader eyebrow="Admin" title="Admins only" lede="You do not have admin access." />
        <Container className="g-container" pb="$16" width="100%" gap="$4">
          {isArtist ? (
            <Link href="/studio" className="g-auth-submit" style={{ display: 'inline-flex' }}>
              Back to artist studio →
            </Link>
          ) : (
            <Link href="/">Return to gallery →</Link>
          )}
        </Container>
      </YStack>
    )
  }

  if (requireArtist && !isArtist) {
    return (
      <YStack width="100%">
        <PageHeader
          eyebrow="Studio"
          title="Artist access required"
          lede={
            isAdmin
              ? 'Artist tools are separate from admin. Use the admin console to manage users and reviews.'
              : 'An admin must approve your account before you can upload works or edit an artist profile.'
          }
        />
        <Container className="g-container" pb="$16" width="100%" gap="$4">
          {isAdmin ? (
            <Link href="/studio/admin" className="g-auth-submit" style={{ display: 'inline-flex' }}>
              Open admin console →
            </Link>
          ) : (
            <Muted>
              Signed in as {user.email}. Ask an admin to promote you to artist.
            </Muted>
          )}
          {Platform.OS === 'web' ? (
            <Link href="/" className="g-label" style={{ color: 'var(--gallery-accent)' }}>
              Return to gallery →
            </Link>
          ) : (
            <Link href="/">
              <LabelCaps color="$accent">Return to gallery</LabelCaps>
            </Link>
          )}
        </Container>
      </YStack>
    )
  }

  return <>{children}</>
}

export function StudioNav({ active }: { active?: string }) {
  const { isArtist, isAdmin } = useGalleryAuth()
  const links = [
    { href: '/studio', label: 'Overview', key: 'home' },
    ...(isArtist
      ? [
          { href: '/studio/profile', label: 'Profile', key: 'profile' },
          { href: '/studio/works', label: 'Works', key: 'works' },
        ]
      : []),
    ...(isAdmin
      ? [
          { href: '/studio/admin', label: 'Dashboard', key: 'admin' },
          { href: '/studio/admin/artists', label: 'Artists', key: 'artists' },
          { href: '/studio/admin/artworks', label: 'Artworks', key: 'artworks' },
          { href: '/studio/admin/customers', label: 'Customers', key: 'customers' },
        ]
      : []),
  ]

  if (Platform.OS === 'web') {
    return (
      <nav className="g-studio-nav" aria-label="Studio">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href as any}
            className={`g-studio-nav__link${active === l.key ? ' is-active' : ''}`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 20 }}
      contentContainerStyle={{ paddingVertical: 4, alignItems: 'center' }}
    >
      {links.map((l) => (
        <Link key={l.href} href={l.href as any} style={{ marginRight: 8 }}>
          <YStack
            paddingHorizontal={14}
            paddingVertical={10}
            borderWidth={1}
            borderColor={active === l.key ? '$accent' : '$borderColor'}
            backgroundColor={active === l.key ? '$secondary' : 'transparent'}
          >
            <Text
              fontSize={13}
              letterSpacing={0.4}
              color={active === l.key ? '$accent' : '$color11'}
              fontWeight={active === l.key ? '600' : '400'}
            >
              {l.label}
            </Text>
          </YStack>
        </Link>
      ))}
    </ScrollView>
  )
}
