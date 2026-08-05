import { useEffect, useMemo, useState } from 'react'
import { Platform, TextInput } from 'react-native'
import type { Artist, Artwork } from '~/lib/amoha'
import { Text, XStack, YStack } from 'tamagui'
import { ArtworkCard } from './ArtworkCard'
import { LabelCaps, Muted } from './primitives'

const PAGE = 36

export function WorksBrowser({
  artworks,
  artists,
  categories,
  countries,
  initialQuery = '',
}: {
  artworks: Artwork[]
  artists: Artist[]
  categories: string[]
  countries: string[]
  initialQuery?: string
}) {
  const [category, setCategory] = useState('all')
  const [artist, setArtist] = useState('all')
  const [country, setCountry] = useState('all')
  const [attributedOnly, setAttributedOnly] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    setQuery(initialQuery)
    setLimit(PAGE)
  }, [initialQuery])

  const attributed = useMemo(
    () => new Set(artists.filter((a) => a.attributed).map((a) => a.slug)),
    [artists],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return artworks.filter((work) => {
      if (category !== 'all' && work.category !== category) return false
      if (artist !== 'all' && work.artistSlug !== artist) return false
      if (country !== 'all' && work.location !== country) return false
      if (attributedOnly && !attributed.has(work.artistSlug)) return false
      if (
        q &&
        !work.title.toLowerCase().includes(q) &&
        !work.artistName.toLowerCase().includes(q) &&
        !work.category.toLowerCase().includes(q)
      ) {
        return false
      }
      return true
    })
  }, [artworks, category, artist, country, attributedOnly, attributed, query])

  function resetCategory(value: string) {
    setCategory(value)
    setLimit(PAGE)
  }

  return (
    <YStack>
      {Platform.OS === 'web' ? (
        <div className="g-works-search">
          <input
            className="g-search__input"
            type="search"
            value={query}
            placeholder="Filter works by title or artist…"
            onChange={(e) => {
              setQuery(e.target.value)
              setLimit(PAGE)
            }}
          />
        </div>
      ) : (
        <YStack marginBottom="$4">
          <TextInput
            value={query}
            onChangeText={(v) => {
              setQuery(v)
              setLimit(PAGE)
            }}
            placeholder="Filter works by title or artist…"
            placeholderTextColor="#6f6860"
            style={{
              borderWidth: 1,
              borderColor: '#ddd6cb',
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 16,
              color: '#141210',
              backgroundColor: 'rgba(255,253,249,0.9)',
            }}
          />
        </YStack>
      )}

      <YStack
        borderTopWidth={1}
        borderBottomWidth={1}
        borderColor="$borderColor"
        paddingVertical={20}
        gap={24}
        $gtLg={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <XStack flexWrap="wrap" gap={24} alignItems="center">
          {['all', ...categories].map((c) => {
            const active = category === c
            const label = c === 'all' ? 'All works' : c
            if (Platform.OS === 'web') {
              return (
                <button
                  key={c}
                  type="button"
                  className={`g-underline g-label ${active ? 'is-active' : ''}`}
                  onClick={() => resetCategory(c)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0 0 4px',
                    cursor: 'pointer',
                    color: active ? 'var(--gallery-fg)' : 'var(--gallery-muted)',
                  }}
                >
                  {label}
                </button>
              )
            }
            return (
              <YStack key={c} onPress={() => resetCategory(c)} pressStyle={{ opacity: 0.7 }}>
                <LabelCaps color={active ? '$color12' : '$color11'}>{label}</LabelCaps>
              </YStack>
            )
          })}
        </XStack>

        <XStack flexWrap="wrap" gap={24} alignItems="center">
          <NativeSelect
            label="Artist"
            value={artist}
            onChange={(v) => {
              setArtist(v)
              setLimit(PAGE)
            }}
            options={[
              { value: 'all', label: 'Everyone' },
              ...artists.map((a) => ({
                value: a.slug,
                label: `${a.name} (${a.workCount})`,
              })),
            ]}
          />
          <NativeSelect
            label="Origin"
            value={country}
            onChange={(v) => {
              setCountry(v)
              setLimit(PAGE)
            }}
            options={[
              { value: 'all', label: 'Everywhere' },
              ...countries.map((c) => ({ value: c, label: c })),
            ]}
          />
          <XStack
            alignItems="center"
            gap={8}
            cursor="pointer"
            onPress={() => {
              setAttributedOnly((v) => !v)
              setLimit(PAGE)
            }}
            pressStyle={{ opacity: 0.7 }}
          >
            <YStack
              width={12}
              height={12}
              borderWidth={1}
              borderColor={attributedOnly ? '$accent' : '$color11'}
              backgroundColor={attributedOnly ? '$accent' : 'transparent'}
            />
            <LabelCaps color={attributedOnly ? '$accent' : '$color11'}>
              Named artists only
            </LabelCaps>
          </XStack>
        </XStack>
      </YStack>

      <Muted marginTop={24} fontSize={14}>
        {results.length} {results.length === 1 ? 'work' : 'works'}
        {results.length > limit ? ` · showing ${limit}` : ''}
      </Muted>

      {results.length === 0 ? (
        <Text
          marginTop={64}
          fontFamily="$heading"
          fontSize={24}
          fontStyle="italic"
          color="$color11"
        >
          Nothing matches that combination. Try widening the filters.
        </Text>
      ) : (
        <>
          {Platform.OS === 'web' ? (
            <div className="g-works-grid">
              {results.slice(0, limit).map((work, i) => (
                <ArtworkCard key={work.slug} work={work} priority={i < 3} />
              ))}
            </div>
          ) : (
            <XStack flexWrap="wrap" gap={32} rowGap={64} marginTop={32}>
              {results.slice(0, limit).map((work, i) => (
                <YStack key={work.slug} width="100%" $gtSm={{ width: '47%' }} $gtLg={{ width: '30%' }}>
                  <ArtworkCard work={work} priority={i < 3} />
                </YStack>
              ))}
            </XStack>
          )}

          {results.length > limit ? (
            <XStack justifyContent="center" marginTop={64}>
              {Platform.OS === 'web' ? (
                <button
                  type="button"
                  className="g-arrow g-label"
                  onClick={() => setLimit((l) => l + PAGE)}
                  style={{ background: 'none', cursor: 'pointer' }}
                >
                  Load more works
                </button>
              ) : (
                <YStack onPress={() => setLimit((l) => l + PAGE)} pressStyle={{ opacity: 0.7 }}>
                  <LabelCaps color="$color12">Load more works</LabelCaps>
                </YStack>
              )}
            </XStack>
          ) : null}
        </>
      )}
    </YStack>
  )
}

function NativeSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  if (Platform.OS === 'web') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="g-label" style={{ color: 'var(--gallery-muted)' }}>
          {label}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="g-field"
          style={{
            maxWidth: 176,
            paddingBottom: 4,
            borderBottomColor: 'var(--gallery-fg)',
            fontSize: 14,
            appearance: 'none',
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <YStack gap="$2" width="100%" maxWidth={280}>
      <LabelCaps>{label}</LabelCaps>
      <YStack gap="$1">
        {options.map((opt) => {
          const selected = opt.value === value
          return (
            <YStack
              key={opt.value}
              onPress={() => onChange(opt.value)}
              pressStyle={{ opacity: 0.7 }}
              paddingVertical={8}
              paddingHorizontal={10}
              borderWidth={1}
              borderColor={selected ? '$accent' : '$borderColor'}
              backgroundColor={selected ? '$secondary' : 'transparent'}
              marginBottom={4}
            >
              <Text fontSize={14} color={selected ? '$accent' : '$color'}>
                {opt.label}
              </Text>
            </YStack>
          )
        })}
      </YStack>
    </YStack>
  )
}
