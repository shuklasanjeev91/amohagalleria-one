import { Link } from 'one'
import { Platform } from 'react-native'
import type { Artist } from '~/lib/amoha'
import { Text, XStack, YStack } from 'tamagui'
import { GalleryImage } from './GalleryImage'
import { LabelCaps, Muted } from './primitives'

export function ArtistIndex({ artists }: { artists: Artist[] }) {
  if (Platform.OS === 'web') {
    return (
      <div className="g-artist-index">
        {artists.map((artist, i) => (
          <Link
            key={artist.slug}
            href={`/artists/${artist.slug}` as any}
            className="g-artist-index__row"
          >
            <span className="g-artist-index__num g-label">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="g-artist-index__portrait g-frame">
              {artist.portrait ? (
                <GalleryImage
                  src={artist.portrait}
                  alt={`Portrait of ${artist.name}`}
                  fill
                  objectFit="cover"
                />
              ) : (
                <span className="g-artist-index__fallback" aria-hidden>
                  {artist.name.slice(0, 1)}
                </span>
              )}
            </span>
            <span className="g-artist-index__name">{artist.name}</span>
            <span className="g-artist-index__blurb">{artist.short}</span>
            <span className="g-artist-index__meta g-label">
              {artist.discipline}
              {artist.workCount
                ? ` · ${artist.workCount} ${artist.workCount === 1 ? 'work' : 'works'}`
                : ''}
              {artist.location ? ` · ${artist.location}` : ''}
            </span>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <YStack borderTopWidth={1} borderTopColor="$borderColor">
      {artists.map((artist, i) => (
        <Link key={artist.slug} href={`/artists/${artist.slug}` as any}>
          <XStack
            borderBottomWidth={1}
            borderBottomColor="$borderColor"
            paddingVertical={24}
            gap={16}
            alignItems="center"
            pressStyle={{ opacity: 0.85 }}
          >
            <LabelCaps width={40} flexShrink={0}>
              {String(i + 1).padStart(2, '0')}
            </LabelCaps>
            {artist.portrait ? (
              <YStack
                width={72}
                height={90}
                overflow="hidden"
                backgroundColor="$secondary"
                position="relative"
                flexShrink={0}
              >
                <GalleryImage
                  src={artist.portrait}
                  alt={artist.name}
                  fill
                  objectFit="cover"
                />
              </YStack>
            ) : null}
            <YStack flex={1} gap={6} minWidth={0}>
              <Text fontFamily="$heading" fontSize={24} lineHeight={28}>
                {artist.name}
              </Text>
              <Muted fontSize={14} numberOfLines={2}>
                {artist.short}
              </Muted>
              <LabelCaps>
                {artist.discipline}
                {artist.workCount ? ` · ${artist.workCount} works` : ''}
              </LabelCaps>
            </YStack>
          </XStack>
        </Link>
      ))}
    </YStack>
  )
}
