import { Link, usePathname } from 'one'
import { Platform } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { useGalleryAuth } from '~/lib/AuthProvider'
import { useEnquiryCart } from '~/lib/EnquiryCartProvider'
import { GalleryImage } from './GalleryImage'
import { SearchBar, type SearchHit } from './SearchBar'
import { Container, LabelCaps } from './primitives'

const nav = [
  { href: '/exhibitions', label: 'Exhibitions' },
  { href: '/artists', label: 'Artists' },
  { href: '/works', label: 'Works' },
  { href: '/contact', label: 'Contact' },
]

function accountLabel(name?: string | null, email?: string | null) {
  const raw = (name || email || 'Account').trim()
  const base = raw.includes('@') ? raw.split('@')[0] : raw
  const first = base.includes(' ')
    ? base.split(/\s+/)[0]
    : base.includes('.')
      ? base.split('.')[0]
      : base
  if (!first) return 'Account'
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

/** Desktop header (≥1024px). Mobile uses MobileTopBar + BottomTabBar. */
export function SiteHeader({
  shortName,
  logo,
  name,
  searchIndex = [],
}: {
  shortName: string
  logo?: string | null
  name?: string
  searchIndex?: SearchHit[]
}) {
  const pathname = usePathname()
  const { user, isArtist, isAdmin } = useGalleryAuth()
  const { count: cartCount } = useEnquiryCart()
  const navItems = nav
  const accountHref = isAdmin ? '/studio/admin' : isArtist ? '/studio' : '/login'
  const accountTitle = isAdmin
    ? 'Admin console'
    : isArtist
      ? 'Artist studio'
      : 'Account & sign out'

  return (
    <YStack
      width="100%"
      {...(Platform.OS === 'web'
        ? { className: 'g-site-chrome' }
        : {
            zIndex: 50,
            borderBottomWidth: 1,
            borderBottomColor: '$borderColor',
            backgroundColor: '$background',
          })}
    >
      <YStack
        width="100%"
        {...(Platform.OS === 'web' ? { className: 'g-site-header' } : null)}
      >
        <Container className="g-container" width="100%" maxWidth="100%">
            <XStack
            className="g-site-header__row"
            minHeight={88}
            alignItems="center"
            justifyContent="space-between"
            gap={16}
            paddingVertical={14}
            width="100%"
            $gtLg={{ minHeight: 96, gap: 24, paddingVertical: 16 }}
          >
            <Link href="/" className="g-site-header__brand">
              {logo ? (
                <YStack height={44} width={170} cursor="pointer" position="relative" $gtLg={{ height: 48, width: 190 }}>
                  <GalleryImage
                    src={logo}
                    alt={name || shortName}
                    fill
                    objectFit="contain"
                    priority
                  />
                </YStack>
              ) : (
                <Text
                  fontFamily="$heading"
                  fontSize={24}
                  letterSpacing={-0.4}
                  cursor="pointer"
                  $gtLg={{ fontSize: 26 }}
                >
                  {shortName} Galleria
                </Text>
              )}
            </Link>

            <YStack flex={1} minWidth={160} maxWidth={640} className="g-site-header__search">
              <SearchBar items={searchIndex} />
            </YStack>

            <XStack gap={20} alignItems="center" className="g-site-header__nav" $gtXl={{ gap: 28 }}>
              {navItems.map((item) => {
                const active = pathname.startsWith(item.href)
                if (Platform.OS === 'web') {
                  return (
                    <Link
                      key={item.href}
                      href={item.href as any}
                      className={`g-underline g-label ${active ? 'is-active' : ''}`}
                      style={{
                        color: active ? 'var(--gallery-fg)' : 'var(--gallery-muted)',
                        paddingTop: 6,
                        paddingBottom: 6,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.label}
                    </Link>
                  )
                }
                return (
                  <Link key={item.href} href={item.href as any}>
                    <LabelCaps color={active ? '$color12' : '$color11'}>
                      {item.label}
                    </LabelCaps>
                  </Link>
                )
              })}

              {Platform.OS === 'web' ? (
                <Link href="/enquiry" className="g-label" style={{ whiteSpace: 'nowrap' }}>
                  Enquiry{cartCount > 0 ? ` (${cartCount})` : ''}
                </Link>
              ) : null}

              {Platform.OS === 'web' ? (
                user ? (
                  <Link
                    href={accountHref as any}
                    className="g-auth-cta g-auth-cta--account"
                    aria-label={`Account for ${user.name}`}
                    title={accountTitle}
                  >
                    <span className="g-auth-cta__dot" aria-hidden />
                    <span className="g-auth-cta__label">{accountLabel(user.name, user.email)}</span>
                    <span className="g-auth-cta__arrow" aria-hidden>
                      →
                    </span>
                  </Link>
                ) : (
                  <Link href="/login" className="g-auth-cta" aria-label="Login or register">
                    <span className="g-auth-cta__label">Login / Register</span>
                    <span className="g-auth-cta__arrow" aria-hidden>
                      →
                    </span>
                  </Link>
                )
              ) : null}
            </XStack>
          </XStack>
        </Container>
      </YStack>
    </YStack>
  )
}
