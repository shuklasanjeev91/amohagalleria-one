import { Link } from 'one'
import type { Artwork } from '~/lib/amoha'
import { Platform } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { GalleryImage } from './GalleryImage'
import { LabelCaps } from './primitives'

export function ArtworkCard({
  work,
  showCategory = true,
  priority = false,
}: {
  work: Artwork
  priority?: boolean
  showCategory?: boolean
}) {
  return (
    <Link href={`/works/${work.slug}` as any}>
      <YStack width="100%" cursor="pointer" pressStyle={{ opacity: 0.95 }}>
        {Platform.OS === 'web' ? (
          <div className="g-frame g-frame--portrait g-zoom g-card-media">
            <GalleryImage
              src={work.image}
              alt={`${work.title} by ${work.artistName}`}
              fill
              objectFit="cover"
              priority={priority}
            />
          </div>
        ) : (
          <YStack
            width="100%"
            aspectRatio={4 / 5}
            overflow="hidden"
            backgroundColor="$secondary"
            position="relative"
          >
            <GalleryImage
              src={work.image}
              alt={`${work.title} by ${work.artistName}`}
              fill
              objectFit="cover"
              priority={priority}
            />
          </YStack>
        )}

        <XStack
          marginTop={Platform.OS === 'web' ? 14 : 16}
          justifyContent="space-between"
          alignItems="flex-start"
          gap={12}
        >
          <YStack flex={1} minWidth={0} gap={6}>
            <LabelCaps numberOfLines={1}>{work.artistName}</LabelCaps>
            <Text
              fontFamily="$heading"
              fontSize={20}
              lineHeight={26}
              color="$color12"
              {...(Platform.OS === 'web'
                ? {
                    style: {
                      fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
                      fontSize: 20,
                      lineHeight: '1.25',
                    },
                  }
                : null)}
            >
              <Text fontStyle="italic" fontFamily="$heading">
                {work.title}
              </Text>
              {work.year ? (
                <Text color="$color11" fontFamily="$heading">
                  , {work.year}
                </Text>
              ) : null}
            </Text>
          </YStack>
          {showCategory ? (
            <LabelCaps flexShrink={0} paddingTop={4}>
              {work.category}
            </LabelCaps>
          ) : null}
        </XStack>
      </YStack>
    </Link>
  )
}
