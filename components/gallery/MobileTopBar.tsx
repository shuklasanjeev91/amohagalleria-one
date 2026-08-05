import { Link } from 'one'
import { useEffect, useRef, useState } from 'react'
import { Platform, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, XStack, YStack } from 'tamagui'
import { GalleryImage } from './GalleryImage'
import { SearchBar, type SearchHit } from './SearchBar'

const NOTICES = [
  {
    id: '1',
    title: 'New works in Artist Spotlight',
    body: 'Fresh pieces from the current programme are now live.',
    time: 'Today',
  },
  {
    id: '2',
    title: 'Exhibition update',
    body: 'Opening hours and viewing requests for this month’s show.',
    time: 'Yesterday',
  },
  {
    id: '3',
    title: 'Concierge reply',
    body: 'Your message has been received — we will follow up shortly.',
    time: 'This week',
  },
]

function BellIcon({ color = '#141210' }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.6c-2.9 0-5.2 2.2-5.2 5v2.4c0 .9-.3 1.8-.9 2.5l-.8.9c-.5.6-.1 1.6.7 1.6h12.4c.8 0 1.2-1 .7-1.6l-.8-.9c-.6-.7-.9-1.6-.9-2.5V8.6c0-2.8-2.3-5-5.2-5Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10 19.2a2 2 0 0 0 4 0"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NotificationPanel({
  open,
  onClose,
  unread,
  onClear,
}: {
  open: boolean
  onClose: () => void
  unread: number
  onClear: () => void
}) {
  if (!open) return null

  if (Platform.OS === 'web') {
    return (
      <div className="g-notify-panel" role="dialog" aria-label="Notifications">
        <div className="g-notify-panel__head">
          <span className="g-label">Notifications</span>
          {unread > 0 ? (
            <button type="button" className="g-notify-panel__clear" onClick={onClear}>
              Mark read
            </button>
          ) : (
            <span className="g-notify-panel__meta">You’re up to date</span>
          )}
        </div>
        <ul className="g-notify-panel__list">
          {NOTICES.map((n) => (
            <li key={n.id} className="g-notify-panel__item">
              <strong>{n.title}</strong>
              <p>{n.body}</p>
              <span>{n.time}</span>
            </li>
          ))}
        </ul>
        <Link href="/contact" className="g-notify-panel__foot" onClick={onClose}>
          Enquire with the gallery →
        </Link>
      </div>
    )
  }

  return (
    <YStack
      position="absolute"
      top="100%"
      right={0}
      marginTop={8}
      width={300}
      maxWidth="92vw"
      backgroundColor="$background"
      borderWidth={1}
      borderColor="$borderColor"
      padding={14}
      zIndex={90}
      gap={10}
      style={{
        shadowColor: '#0e0c0a',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
      }}
    >
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize={11} letterSpacing={1.4} textTransform="uppercase" fontWeight="600">
          Notifications
        </Text>
        {unread > 0 ? (
          <Pressable onPress={onClear}>
            <Text fontSize={11} color="$accent">
              Mark read
            </Text>
          </Pressable>
        ) : (
          <Text fontSize={11} color="$color11">
            You’re up to date
          </Text>
        )}
      </XStack>
      {NOTICES.map((n) => (
        <YStack key={n.id} gap={2} paddingVertical={6} borderTopWidth={1} borderTopColor="$borderColor">
          <Text fontWeight="600" fontSize={14}>
            {n.title}
          </Text>
          <Text fontSize={13} color="$color11" lineHeight={18}>
            {n.body}
          </Text>
          <Text fontSize={11} color="$color10">
            {n.time}
          </Text>
        </YStack>
      ))}
      <Link href="/contact" onPress={onClose}>
        <Text fontSize={12} color="$accent" paddingTop={4}>
          Enquire with the gallery →
        </Text>
      </Link>
    </YStack>
  )
}

export function MobileTopBar({
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
  const insets = useSafeAreaInsets()
  const topPad = Platform.OS === 'web' ? 0 : Math.max(insets.top, 0)
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [unread, setUnread] = useState(2)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!notifyOpen || Platform.OS !== 'web') return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setNotifyOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifyOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [notifyOpen])

  function toggleNotify() {
    setNotifyOpen((v) => !v)
  }

  function clearUnread() {
    setUnread(0)
  }

  const actions = (
    <div className="g-mobile-topbar__actions" ref={rootRef as any}>
      <button
        type="button"
        className={`g-mobile-topbar__notify${notifyOpen ? ' is-open' : ''}`}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={notifyOpen}
        onClick={toggleNotify}
      >
        <BellIcon />
        {unread > 0 ? <span className="g-mobile-topbar__badge" aria-hidden /> : null}
      </button>
      <NotificationPanel
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        unread={unread}
        onClear={clearUnread}
      />
    </div>
  )

  const inner = (
    <>
      <div className="g-mobile-topbar__row">
        <Link href="/" className="g-mobile-topbar__brand">
          {logo ? (
            <span className="g-mobile-topbar__logo">
              <GalleryImage
                src={logo}
                alt={name || shortName}
                fill
                objectFit="contain"
                priority
              />
            </span>
          ) : (
            <span className="g-mobile-topbar__title">{shortName}</span>
          )}
        </Link>
        {actions}
      </div>
      {searchIndex.length > 0 ? (
        <div className="g-mobile-topbar__search">
          <SearchBar items={searchIndex} compact />
        </div>
      ) : null}
    </>
  )

  if (Platform.OS === 'web') {
    return (
      <header className="g-mobile-topbar g-native-only" role="banner">
        {inner}
      </header>
    )
  }

  return (
    <YStack
      className="g-mobile-topbar"
      backgroundColor="$background"
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      paddingTop={topPad}
      paddingHorizontal={16}
      paddingBottom={10}
      zIndex={60}
    >
      <XStack alignItems="center" justifyContent="space-between" minHeight={48} gap={12}>
        <Link href="/">
          {logo ? (
            <YStack height={36} width={140} position="relative">
              <GalleryImage
                src={logo}
                alt={name || shortName}
                fill
                objectFit="contain"
                priority
              />
            </YStack>
          ) : (
            <Text fontFamily="$heading" fontSize={20} letterSpacing={-0.3}>
              {shortName}
            </Text>
          )}
        </Link>
        <XStack alignItems="center" gap={10} position="relative">
          <Pressable
            onPress={toggleNotify}
            accessibilityRole="button"
            accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
            hitSlop={8}
          >
            <YStack width={40} height={40} alignItems="center" justifyContent="center">
              <Text fontSize={20} color="$color12">
                ●
              </Text>
              {unread > 0 ? (
                <YStack
                  position="absolute"
                  top={8}
                  right={8}
                  width={8}
                  height={8}
                  borderRadius={999}
                  backgroundColor="$accent"
                />
              ) : null}
            </YStack>
          </Pressable>
          <NotificationPanel
            open={notifyOpen}
            onClose={() => setNotifyOpen(false)}
            unread={unread}
            onClear={clearUnread}
          />
        </XStack>
      </XStack>
      {searchIndex.length > 0 ? (
        <YStack marginTop={8}>
          <SearchBar items={searchIndex} compact />
        </YStack>
      ) : null}
    </YStack>
  )
}
