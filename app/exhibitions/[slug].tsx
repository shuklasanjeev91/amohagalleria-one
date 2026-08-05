import { Link, useLoader } from 'one'
import { Platform } from 'react-native'
import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { ArrowLink } from '~/components/gallery/ArrowLink'
import { ArtworkCard } from '~/components/gallery/ArtworkCard'
import { GalleryImage } from '~/components/gallery/GalleryImage'
import { SectionHeading } from '~/components/gallery/PageHeader'
import { Reveal } from '~/components/gallery/Reveal'
import { SeoHead } from '~/components/gallery/SeoHead'
import { Container, LabelCaps, Muted, SerifHeading, WorkGrid } from '~/components/gallery/primitives'
import {
  findArtist,
  findExhibition,
    getGalleryInfo,
  exhibitionStatusLabel,
  worksInExhibition,
} from '~/lib/amoha'
import { getMergedCatalogue } from '~/lib/catalogue'
import { ExhibitionStatusBadge } from '~/components/gallery/ExhibitionCard'

export async function loader({ params }: { params: { slug: string } }) {
  const [catalogue, info] = await Promise.all([getMergedCatalogue(), getGalleryInfo()])
  const show = findExhibition(catalogue, params.slug)
  if (!show) return { notFound: true as const }

  const works = worksInExhibition(catalogue, show)
  const showArtists = show.artistSlugs
    .map((s) => findArtist(catalogue, s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
  const named = showArtists.filter((a) => a.attributed)

  return { notFound: false as const, show, info, works, named }
}

export default function ExhibitionPage() {
  const data = useLoader(loader)

  if (data.notFound) {
    return (
      <Container pt="$12">
        <SerifHeading size="large">Exhibition not found</SerifHeading>
        <Muted mt="$4">This exhibition is not in the programme.</Muted>
        <ArrowLink href="/exhibitions">Back to exhibitions</ArrowLink>
      </Container>
    )
  }

  const { show, info, works, named } = data

  const worksDescription =
    works.length > 0
      ? show.status === 'Current'
        ? `${works.length} works from the Amoha Galleria catalogue are listed as on display across this exhibition${
            named.length > 0
              ? `, including work by ${named
                  .slice(0, 4)
                  .map((a) => a.name)
                  .join(', ')}${named.length > 4 ? ` and ${named.length - 4} others` : ''}`
              : ''
          }.`
        : `${works.length} works from the Amoha Galleria catalogue were associated with this ${exhibitionStatusLabel(show.status).toLowerCase()} exhibition${
            named.length > 0
              ? `, including work by ${named
                  .slice(0, 4)
                  .map((a) => a.name)
                  .join(', ')}${named.length > 4 ? ` and ${named.length - 4} others` : ''}`
              : ''
          }.`
      : show.status === 'Upcoming'
        ? 'Works for this upcoming exhibition have not yet been listed in the gallery catalogue.'
        : 'Works for this exhibition have not been listed in the gallery catalogue.'

  return (
    <YStack>
      <SeoHead
        title={show.title}
        description={show.tagline || `${show.title} at Amoha Galleria`}
        path={`/exhibitions/${show.slug}`}
        image={show.images?.[0] || show.image || null}
      />
      <Container pt="$12" $gtMd={{ pt: '$20' }}>
        <Reveal>
          <XStack flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$4">
            <ExhibitionStatusBadge status={show.status} />
            {show.dateLabel && <LabelCaps color="$color11">{show.dateLabel}</LabelCaps>}
          </XStack>
          <SerifHeading size="hero" mt="$6" maxWidth={900}>
            {show.title}
          </SerifHeading>
          {show.tagline && (
            <Muted
              mt="$5"
              maxWidth={640}
              fontFamily="$heading"
              fontSize="$7"
              fontStyle="italic"
              className={Platform.OS === 'web' ? 'g-italic' : undefined}
              $gtMd={{ fontSize: '$8' }}
            >
              {show.tagline}
            </Muted>
          )}
        </Reveal>

        {(show.images?.length ? show.images : show.image ? [show.image] : []).length > 0 && (
          <Reveal delay={100} mt="$12" $gtMd={{ mt: '$16' }}>
            {Platform.OS === 'web' ? (
              <div className="g-img-grid">
                {(show.images?.length ? show.images : [show.image!]).map((src, i) => (
                  <div key={src} className="g-img-grid__cell">
                    <GalleryImage
                      src={src}
                      alt={`${show.title} — image ${i + 1}`}
                      fill
                      objectFit="cover"
                      priority={i < 6}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <XStack flexWrap="wrap" gap="$3">
                {(show.images?.length ? show.images : [show.image!]).map((src, i) => (
                  <YStack
                    key={src}
                    width="47%"
                    aspectRatio={4 / 5}
                    overflow="hidden"
                    backgroundColor="$secondary"
                    position="relative"
                  >
                    <GalleryImage
                      src={src}
                      alt={`${show.title} — image ${i + 1}`}
                      fill
                      objectFit="cover"
                      priority={i < 4}
                    />
                  </YStack>
                ))}
              </XStack>
            )}
          </Reveal>
        )}
      </Container>

      <Container mt="$20" $gtMd={{ mt: '$28' }}>
        <XStack
          gap="$12"
          borderTopWidth={1}
          borderColor="$borderColor"
          pt="$12"
          flexWrap="wrap"
          $gtLg={{ flexWrap: 'nowrap', gap: '$16' }}
        >
          <Reveal flex={1} $gtLg={{ maxWidth: '33%' }}>
            <YStack gap="$6">
              {show.preview && (
                <YStack>
                  <LabelCaps color="$color11">Preview</LabelCaps>
                  <Paragraph size="$3" mt="$2" lineHeight="$5">
                    {show.preview}
                  </Paragraph>
                </YStack>
              )}
              {show.timing && (
                <YStack>
                  <LabelCaps color="$color11">Daily timing</LabelCaps>
                  <Paragraph size="$3" mt="$2" lineHeight="$5">
                    {show.timing}
                  </Paragraph>
                </YStack>
              )}
              {show.venue.length > 0 && (
                <YStack>
                  <LabelCaps color="$color11">Venue</LabelCaps>
                  <YStack mt="$2" gap="$1">
                    {show.venue.map((line) => (
                      <Paragraph key={line} size="$3" lineHeight="$5">
                        {line}
                      </Paragraph>
                    ))}
                  </YStack>
                </YStack>
              )}
              {named.length > 0 && (
                <YStack>
                  <LabelCaps color="$color11">Artists ({named.length})</LabelCaps>
                  <YStack mt="$2" gap="$1">
                    {named.map((a) => (
                      <Link key={a.slug} href={`/artists/${a.slug}`}>
                        <Paragraph size="$3" hoverStyle={{ color: '$accent' }}>
                          {a.name}
                        </Paragraph>
                      </Link>
                    ))}
                  </YStack>
                </YStack>
              )}
              <ArrowLink href="/exhibitions">
                {show.status === 'Current' ? 'All exhibitions' : 'Back to programme'}
              </ArrowLink>
              <ArrowLink href="/contact">Enquire about works</ArrowLink>
            </YStack>
          </Reveal>

          <Reveal delay={80} flex={2} maxWidth={640}>
            {show.tagline ? (
              Platform.OS === 'web' ? (
                <p className="g-prose__lead" style={{ margin: 0, maxWidth: '42ch' }}>
                  {show.tagline}
                </p>
              ) : (
                <Text fontFamily="$heading" fontSize={22} lineHeight={32}>
                  {show.tagline}
                </Text>
              )
            ) : null}
            <Muted mt="$6" size="$4" lineHeight="$6">
              {worksDescription}
            </Muted>
            {info.project && (
              <Muted mt="$6" size="$4" lineHeight="$6">
                {info.project}
              </Muted>
            )}
          </Reveal>
        </XStack>
      </Container>

      {works.length > 0 && (
        <Container mt="$24" $gtMd={{ mt: '$36' }}>
          <Reveal>
            <SectionHeading
              index="01"
              title={
                show.status === 'Current'
                  ? `Works on display (${works.length})`
                  : `Works from this exhibition (${works.length})`
              }
              action={<ArrowLink href="/works">All works</ArrowLink>}
            />
          </Reveal>
          {Platform.OS === 'web' ? (
            <div className="g-grid-3" style={{ marginTop: 48 }}>
              {works.slice(0, 18).map((work, i) => (
                <Reveal key={work.slug} delay={(i % 3) * 90}>
                  <ArtworkCard work={work} priority={i < 3} />
                </Reveal>
              ))}
            </div>
          ) : (
            <WorkGrid style={{ marginTop: 48 }}>
              {works.slice(0, 18).map((work, i) => (
                <Reveal key={work.slug} delay={(i % 3) * 90} width="100%">
                  <ArtworkCard work={work} priority={i < 3} />
                </Reveal>
              ))}
            </WorkGrid>
          )}
        </Container>
      )}
    </YStack>
  )
}
