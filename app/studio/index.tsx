import { Link } from 'one'
import { YStack } from 'tamagui'
import { useGalleryAuth } from '~/lib/AuthProvider'
import { PageHeader } from '~/components/gallery/PageHeader'
import { SeoHead } from '~/components/gallery/SeoHead'
import { StudioGate, StudioNav } from '~/components/gallery/StudioShell'
import { Container, LabelCaps, Muted } from '~/components/gallery/primitives'

export const sitemap = { exclude: true }

export default function StudioHomePage() {
  const { user, isArtist, isAdmin } = useGalleryAuth()

  const title = isAdmin ? 'Admin studio' : isArtist ? 'Artist studio' : 'Studio'
  const lede = isAdmin
    ? 'Review collector accounts, promote artists, and moderate submitted works.'
    : isArtist
      ? 'Manage your profile and artworks. Published works appear on the public gallery alongside the live Amoha catalogue.'
      : 'Sign in with an artist or admin account to use studio tools.'

  return (
    <StudioGate>
      <YStack width="100%">
        <SeoHead title={title} path="/studio" noIndex />
        <PageHeader eyebrow="Studio" title={title} lede={lede} />
        <Container className="g-container" pb="$20" width="100%" maxWidth="100%">
          <StudioNav active="home" />
          <YStack gap="$4" className="g-account-panel" maxWidth={640}>
            <LabelCaps color="$accent">Signed in</LabelCaps>
            <Muted>
              {user?.name} · {user?.email} · {user?.role}
            </Muted>

            {isArtist ? (
              <div className="g-studio-actions">
                <Link href="/studio/profile" className="g-auth-submit">
                  Edit profile →
                </Link>
                <Link href="/studio/works/new" className="g-auth-submit">
                  Upload artwork →
                </Link>
                <Link href="/studio/works" className="g-auth-submit g-auth-submit--ghost">
                  My works →
                </Link>
              </div>
            ) : null}

            {isAdmin ? (
              <div className="g-studio-actions">
                <Link href="/studio/admin" className="g-auth-submit">
                  Admin console →
                </Link>
              </div>
            ) : null}

            {!isArtist && !isAdmin ? (
              <Muted>
                You are registered as a collector. An admin must promote you to artist before
                uploads are available.
              </Muted>
            ) : null}
          </YStack>
        </Container>
      </YStack>
    </StudioGate>
  )
}
