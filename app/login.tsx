import { Link } from 'one'
import { Platform } from 'react-native'
import { Text, YStack } from 'tamagui'
import { AuthForm } from '~/components/gallery/AuthForm'
import { AuthShell } from '~/components/gallery/AuthShell'
import { LabelCaps, Muted } from '~/components/gallery/primitives'
import { useGalleryAuth } from '~/lib/AuthProvider'

export const sitemap = { exclude: true }

export default function LoginPage() {
  const { user, signOut, configured, isArtist, isAdmin } = useGalleryAuth()

  return (
    <AuthShell
      mode="login"
      title="Sign in"
      lede="Enter your email to receive a private one-time code. New addresses are registered automatically."
      seoTitle="Login"
      seoPath="/login"
    >
      {!configured ? (
        Platform.OS === 'web' ? (
          <p className="g-auth-error g-auth-config">
            Configure Supabase in <code>.env</code> (see <code>.env.example</code>).
          </p>
        ) : (
          <Muted marginBottom={24}>Configure Supabase in .env to enable sign-in.</Muted>
        )
      ) : null}

      {user ? (
        Platform.OS === 'web' ? (
          <div className="g-auth-session">
            <p className="g-label g-auth-session__eyebrow">Signed in</p>
            <h3 className="g-auth-session__name">{user.name}</h3>
            <p className="g-auth-session__email">{user.email}</p>
            <p className="g-auth-session__role">
              {isAdmin ? 'Admin' : isArtist ? 'Artist' : 'Collector'}
            </p>
            <div className="g-auth-session__actions">
              {isAdmin ? (
                <Link href="/studio/admin" className="g-auth-submit g-auth-submit--ghost">
                  <span>Open admin</span>
                  <span className="g-arrow-icon" aria-hidden>
                    →
                  </span>
                </Link>
              ) : null}
              {isArtist ? (
                <Link href="/studio" className="g-auth-submit g-auth-submit--ghost">
                  <span>Open studio</span>
                  <span className="g-arrow-icon" aria-hidden>
                    →
                  </span>
                </Link>
              ) : null}
              <button type="button" className="g-auth-submit" onClick={() => void signOut()}>
                <span>Sign out</span>
                <span className="g-arrow-icon" aria-hidden>
                  →
                </span>
              </button>
            </div>
          </div>
        ) : (
          <YStack gap="$4" maxWidth={480}>
            <LabelCaps color="$accent">Signed in</LabelCaps>
            <Text fontFamily="$heading" fontSize={28} lineHeight={32}>
              {user.name}
            </Text>
            <Muted>{user.email}</Muted>
            {isAdmin ? (
              <Link href="/studio/admin">
                <LabelCaps color="$accent">Open admin →</LabelCaps>
              </Link>
            ) : null}
            {isArtist ? (
              <Link href="/studio">
                <LabelCaps color="$accent">Open studio →</LabelCaps>
              </Link>
            ) : null}
            <Text color="$accent" onPress={() => void signOut()}>
              Sign out →
            </Text>
          </YStack>
        )
      ) : (
        <AuthForm mode="login" />
      )}
    </AuthShell>
  )
}
