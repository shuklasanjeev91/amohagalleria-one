import { Link, usePathname } from 'one'
import type { ReactNode } from 'react'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'
import { useGalleryAuth } from '~/lib/AuthProvider'

const ACTIVE = '#7a3228'
const INACTIVE = '#6b645c'

function WebIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      {children}
    </svg>
  )
}

function TabGlyph({
  active,
  web,
  native,
}: {
  active: boolean
  web: (color: string) => ReactNode
  native: string
}) {
  const color = active ? ACTIVE : INACTIVE
  if (Platform.OS === 'web') {
    return <WebIcon>{web(color)}</WebIcon>
  }
  return (
    <Text fontSize={18} lineHeight={22} color={active ? '$accent' : '$color11'}>
      {native}
    </Text>
  )
}

const navTabs = [
  {
    href: '/',
    label: 'Home',
    native: '⌂',
    web: (c: string) => (
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5.2v-5.4H10.2V21H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={c}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
    match: (p: string) => p === '/',
  },
  {
    href: '/works',
    label: 'Works',
    native: '◇',
    web: (c: string) => (
      <>
        <rect x="4" y="5" width="16" height="14" rx="1.2" stroke={c} strokeWidth="1.6" />
        <path
          d="M4 15.5 9.2 11l3.3 3.1 2.4-2.2L20 16"
          stroke={c}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="9" r="1.35" fill={c} />
      </>
    ),
    match: (p: string) => p.startsWith('/works'),
  },
  {
    href: '/artists',
    label: 'Artists',
    native: '◌',
    web: (c: string) => (
      <>
        <circle cx="12" cy="8.5" r="3.2" stroke={c} strokeWidth="1.6" />
        <path
          d="M5.5 19.5c.8-3.2 3.2-4.8 6.5-4.8s5.7 1.6 6.5 4.8"
          stroke={c}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </>
    ),
    match: (p: string) => p.startsWith('/artists'),
  },
  {
    href: '/exhibitions',
    label: 'Shows',
    native: '▦',
    web: (c: string) => (
      <>
        <rect x="3.5" y="5" width="17" height="14" rx="1.5" stroke={c} strokeWidth="1.6" />
        <path d="M8 9.5h8M8 12.5h8M8 15.5h5" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
    match: (p: string) => p.startsWith('/exhibitions'),
  },
] as const

const authIcon = {
  native: '◎',
  web: (c: string) => (
    <>
      <circle cx="12" cy="8.2" r="3" stroke={c} strokeWidth="1.6" />
      <path
        d="M5.2 19.2c1-3.4 3.4-5.1 6.8-5.1s5.8 1.7 6.8 5.1"
        stroke={c}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.6" />
    </>
  ),
}

function TabLabel({ active, children }: { active: boolean; children: string }) {
  return (
    <Text
      fontSize={10}
      letterSpacing={0.6}
      textTransform="uppercase"
      fontWeight={active ? '600' : '500'}
      color={active ? '$accent' : '$color11'}
    >
      {children}
    </Text>
  )
}

export function BottomTabBar() {
  const pathname = usePathname() || '/'
  const insets = useSafeAreaInsets()
  const bottomPad = Platform.OS === 'web' ? 0 : Math.max(insets.bottom, 8)
  const { user, isArtist, isAdmin } = useGalleryAuth()

  const authHref = isAdmin ? '/studio/admin' : isArtist ? '/studio' : '/login'
  const authActive =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/studio')
  const authLabel = user
    ? isAdmin
      ? 'Admin'
      : isArtist
        ? 'Studio'
        : user.name.split(' ')[0] || 'Account'
    : 'Account'
  const authHighlighted = !!(authActive || user)

  if (Platform.OS === 'web') {
    return (
      <nav className="g-bottom-tabs g-native-only" aria-label="Primary">
        <div className="g-bottom-tabs__inner">
          {navTabs.map((tab) => {
            const active = tab.match(pathname)
            return (
              <Link
                key={tab.href}
                href={tab.href as any}
                className={`g-bottom-tabs__item${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="g-bottom-tabs__icon" aria-hidden>
                  <TabGlyph active={active} web={tab.web} native={tab.native} />
                </span>
                <span className="g-bottom-tabs__label">{tab.label}</span>
              </Link>
            )
          })}
          <Link
            href={authHref as any}
            className={`g-bottom-tabs__item${authHighlighted ? ' is-active' : ''}`}
            aria-current={authActive ? 'page' : undefined}
            aria-label={authLabel}
          >
            <span className="g-bottom-tabs__icon" aria-hidden>
              <TabGlyph active={authHighlighted} web={authIcon.web} native={authIcon.native} />
            </span>
            <span className="g-bottom-tabs__label">{authLabel}</span>
          </Link>
        </div>
      </nav>
    )
  }

  return (
    <YStack
      width="100%"
      maxWidth="100%"
      alignSelf="stretch"
      borderTopWidth={1}
      borderTopColor="$borderColor"
      backgroundColor="$background"
      paddingBottom={bottomPad}
      paddingTop={6}
      zIndex={60}
      style={{
        shadowColor: '#0e0c0a',
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
        elevation: 8,
      }}
    >
      <XStack
        width="100%"
        alignItems="stretch"
        justifyContent="space-between"
        minHeight={52}
      >
        {navTabs.map((tab) => {
          const active = tab.match(pathname)
          return (
            <Link key={tab.href} href={tab.href as any} style={{ flex: 1 }}>
              <YStack
                flex={1}
                width="100%"
                alignItems="center"
                justifyContent="center"
                gap={3}
                paddingVertical={6}
                paddingHorizontal={2}
                opacity={active ? 1 : 0.72}
                pressStyle={{ opacity: 0.85, scale: 0.96 }}
              >
                <TabGlyph active={active} web={tab.web} native={tab.native} />
                <TabLabel active={active}>{tab.label}</TabLabel>
              </YStack>
            </Link>
          )
        })}
        <Link href={authHref as any} style={{ flex: 1 }}>
          <YStack
            flex={1}
            width="100%"
            alignItems="center"
            justifyContent="center"
            gap={3}
            paddingVertical={6}
            paddingHorizontal={2}
            opacity={authHighlighted ? 1 : 0.72}
            pressStyle={{ opacity: 0.85, scale: 0.96 }}
          >
            <TabGlyph
              active={authHighlighted}
              web={authIcon.web}
              native={authIcon.native}
            />
            <TabLabel active={authHighlighted}>{authLabel}</TabLabel>
          </YStack>
        </Link>
      </XStack>
    </YStack>
  )
}
