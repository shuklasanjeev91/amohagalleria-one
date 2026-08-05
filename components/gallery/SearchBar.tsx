import { Link, useRouter } from 'one'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, Pressable, TextInput } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { GalleryImage } from './GalleryImage'

export type SearchHit = {
  kind: 'work' | 'artist'
  slug: string
  title: string
  meta: string
  image: string | null
}

export function SearchBar({
  items,
  compact = false,
}: {
  items: SearchHit[]
  compact?: boolean
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    return items
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.meta.toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [items, query])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function go(hit: SearchHit) {
    setOpen(false)
    setQuery('')
    const href = hit.kind === 'work' ? `/works/${hit.slug}` : `/artists/${hit.slug}`
    router.push(href as any)
  }

  function submit() {
    const q = query.trim()
    if (!q) return
    if (results[active]) {
      go(results[active])
      return
    }
    setOpen(false)
    router.push(`/works?q=${encodeURIComponent(q)}` as any)
  }

  if (Platform.OS !== 'web') {
    return (
      <YStack flex={1} width="100%" position="relative" zIndex={40}>
        <XStack
          borderWidth={1}
          borderColor="$borderColor"
          backgroundColor="$color1"
          alignItems="center"
          paddingHorizontal={12}
          minHeight={compact ? 40 : 44}
        >
          <TextInput
            value={query}
            onChangeText={(v) => {
              setQuery(v)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search art, artist…"
            placeholderTextColor="#6f6860"
            returnKeyType="search"
            onSubmitEditing={submit}
            style={{ flex: 1, fontSize: 15, color: '#141210', paddingVertical: 10 }}
          />
        </XStack>
        {open && query.trim().length >= 2 ? (
          <YStack
            position="absolute"
            top="100%"
            left={0}
            right={0}
            marginTop={4}
            backgroundColor="$background"
            borderWidth={1}
            borderColor="$borderColor"
            zIndex={50}
            maxHeight={320}
            style={{ elevation: 12 }}
          >
            {results.length === 0 ? (
              <YStack padding="$3">
                <Text fontSize={13} color="$color11">
                  No matches
                </Text>
              </YStack>
            ) : (
              results.map((hit) => (
                <Pressable key={`${hit.kind}-${hit.slug}`} onPress={() => go(hit)}>
                  <XStack gap="$3" padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
                    <YStack width={40} height={40} backgroundColor="$secondary" overflow="hidden">
                      {hit.image ? (
                        <GalleryImage src={hit.image} alt="" fill objectFit="cover" />
                      ) : null}
                    </YStack>
                    <YStack flex={1} gap={2}>
                      <Text fontSize={10} letterSpacing={1} textTransform="uppercase" color="$color11">
                        {hit.kind}
                      </Text>
                      <Text fontSize={15} fontWeight="600" numberOfLines={1}>
                        {hit.title}
                      </Text>
                      <Text fontSize={12} color="$color11" numberOfLines={1}>
                        {hit.meta}
                      </Text>
                    </YStack>
                  </XStack>
                </Pressable>
              ))
            )}
            <Link href={`/works?q=${encodeURIComponent(query.trim())}` as any} onPress={() => setOpen(false)}>
              <YStack padding="$3">
                <Text fontSize={12} color="$accent">
                  View all in works →
                </Text>
              </YStack>
            </Link>
          </YStack>
        ) : null}
      </YStack>
    )
  }

  return (
    <div ref={rootRef} className={`g-search ${compact ? 'g-search--compact' : ''}`}>
      <form
        className="g-search__form"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <input
          className="g-search__input"
          type="search"
          name="q"
          placeholder="Search by art, artist…"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
        />
        <button type="submit" className="g-search__btn" aria-label="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M21 21l-5.2-5.2M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </form>

      {open && query.trim().length >= 2 ? (
        <div className="g-search__panel" role="listbox">
          {results.length === 0 ? (
            <div className="g-search__empty">
              <span className="g-label">No matches</span>
              <p>Try another title or artist name.</p>
            </div>
          ) : (
            results.map((hit, i) => (
              <button
                key={`${hit.kind}-${hit.slug}`}
                type="button"
                role="option"
                aria-selected={i === active}
                className={`g-search__hit ${i === active ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(hit)}
              >
                <span className="g-search__thumb">
                  {hit.image ? (
                    <GalleryImage src={hit.image} alt="" fill objectFit="cover" />
                  ) : null}
                </span>
                <span className="g-search__copy">
                  <span className="g-label">{hit.kind === 'work' ? 'Work' : 'Artist'}</span>
                  <strong>{hit.title}</strong>
                  <em>{hit.meta}</em>
                </span>
              </button>
            ))
          )}
          <Link
            href={`/works?q=${encodeURIComponent(query.trim())}` as any}
            className="g-search__all"
            onClick={() => setOpen(false)}
          >
            <span className="g-label">View all results in works →</span>
          </Link>
        </div>
      ) : null}
    </div>
  )
}
