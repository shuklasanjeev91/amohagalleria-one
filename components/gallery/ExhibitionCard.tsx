import { Link } from 'one'
import { Platform } from 'react-native'
import { Paragraph, Text, XStack, YStack } from 'tamagui'
import type { Exhibition } from '~/lib/amoha'
import { exhibitionStatusLabel, exhibitionStatusTone } from '~/lib/amoha'
import { GalleryImage } from './GalleryImage'
import { LabelCaps, Muted, SerifHeading } from './primitives'

export function ExhibitionStatusBadge({
  status,
}: {
  status: Exhibition['status']
}) {
  const tone = exhibitionStatusTone(status)
  const label = exhibitionStatusLabel(status)

  if (Platform.OS === 'web') {
    return <span className={`g-ex-badge g-ex-badge--${tone}`}>{label}</span>
  }

  return (
    <LabelCaps color={status === 'Past' ? '$color11' : '$accent'}>{label}</LabelCaps>
  )
}

export function ExhibitionCard({
  show,
  index = 0,
  featured = false,
}: {
  show: Exhibition
  index?: number
  featured?: boolean
}) {
  const image = show.image || show.images?.[0] || '/placeholder.svg'

  return (
    <Link href={`/exhibitions/${show.slug}` as any}>
      <YStack
        width="100%"
        cursor="pointer"
        pressStyle={{ opacity: 0.95 }}
        {...(Platform.OS === 'web'
          ? {
              className: `g-ex-card ${featured ? 'g-ex-card--featured' : ''}`,
            }
          : null)}
      >
        {Platform.OS === 'web' ? (
          <div
            className={`g-frame g-zoom ${featured ? 'g-frame--hero' : 'g-frame--wide'}`}
          >
            <GalleryImage
              src={image}
              alt={`${show.title} exhibition`}
              fill
              objectFit="cover"
              priority={index === 0}
            />
          </div>
        ) : (
          <YStack
            width="100%"
            aspectRatio={featured ? 16 / 10 : 16 / 11}
            overflow="hidden"
            backgroundColor="$secondary"
            position="relative"
          >
            <GalleryImage
              src={image}
              alt={`${show.title} exhibition`}
              fill
              objectFit="cover"
              priority={index === 0}
            />
          </YStack>
        )}

        <YStack marginTop={featured ? 28 : 20} gap={12}>
          <XStack alignItems="center" justifyContent="space-between" gap={16} flexWrap="wrap">
            <ExhibitionStatusBadge status={show.status} />
            {show.workSlugs.length > 0 ? (
              <LabelCaps color="$color11">{show.workSlugs.length} works</LabelCaps>
            ) : null}
          </XStack>

          <SerifHeading size={featured ? 'large' : 'medium'}>{show.title}</SerifHeading>

          {show.tagline ? (
            <Muted
              maxWidth={featured ? 640 : 480}
              fontFamily="$heading"
              fontSize={featured ? 18 : 16}
              lineHeight={featured ? 28 : 24}
              fontStyle="italic"
              className={Platform.OS === 'web' ? 'g-italic' : undefined}
            >
              {show.tagline}
            </Muted>
          ) : null}

          <XStack marginTop={8} flexWrap="wrap" gap={28}>
            {show.dateLabel ? (
              <YStack>
                <LabelCaps color="$color11">Dates</LabelCaps>
                <Paragraph size="$3" marginTop={6}>
                  {show.dateLabel}
                </Paragraph>
              </YStack>
            ) : null}
            {show.timing ? (
              <YStack>
                <LabelCaps color="$color11">Hours</LabelCaps>
                <Paragraph size="$3" marginTop={6}>
                  {show.timing}
                </Paragraph>
              </YStack>
            ) : null}
            {show.venue[0] ? (
              <YStack maxWidth={240}>
                <LabelCaps color="$color11">Venue</LabelCaps>
                <Paragraph size="$3" marginTop={6}>
                  {show.venue[0]}
                </Paragraph>
              </YStack>
            ) : null}
          </XStack>

          {Platform.OS === 'web' ? (
            <span className="g-ex-card__cta g-label">
              {show.status === 'Current'
                ? 'Enter exhibition'
                : show.status === 'Upcoming'
                  ? 'Preview exhibition'
                  : 'View archive'}{' '}
              →
            </span>
          ) : (
            <Text marginTop={8} fontSize={12} letterSpacing={1.5} textTransform="uppercase">
              {show.status === 'Current' ? 'Enter exhibition' : 'View exhibition'} →
            </Text>
          )}
        </YStack>
      </YStack>
    </Link>
  )
}
