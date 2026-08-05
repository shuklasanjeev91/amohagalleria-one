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
  exhibitionsByArtist,
  findArtist,
    worksByArtist,
} from '~/lib/amoha'
import { getMergedCatalogue } from '~/lib/catalogue'

export async function generateStaticParams() {
  const catalogue = await getMergedCatalogue()
  return catalogue.artists.map((a) => ({ slug: a.slug }))
}

export async function loader({ params }: { params: { slug: string } }) {
  const catalogue = await getMergedCatalogue()
  const artist = findArtist(catalogue, params.slug)
  if (!artist) return { notFound: true as const }

  const works = worksByArtist(catalogue, artist.slug)
  const shows = exhibitionsByArtist(catalogue, artist.slug)
  const index = catalogue.artists.findIndex((a) => a.slug === artist.slug)
  const next = catalogue.artists[(index + 1) % catalogue.artists.length]
  const years = [...new Set(works.map((w) => w.year).filter(Boolean))].sort()

  return { notFound: false as const, artist, works, shows, next, years }
}

export default function ArtistPage() {
  const data = useLoader(loader)

  if (data.notFound) {
    return (
      <Container pt="$12">
        <SerifHeading size="large">Artist not found</SerifHeading>
        <Muted mt="$4">This artist is not in the catalogue.</Muted>
        <ArrowLink href="/artists">Back to artists</ArrowLink>
      </Container>
    )
  }

  const { artist, works, shows, next, years } = data

  return (
    <YStack>
      <SeoHead
        title={artist.name}
        description={artist.short || artist.summary || `${artist.name} at Amoha Galleria`}
        path={`/artists/${artist.slug}`}
        image={artist.portrait || works[0]?.image}
      />
      <Container pt="$12" $gtMd={{ pt: '$20' }}>
        <Reveal>
          <XStack gap="$10" flexWrap="wrap" $gtLg={{ flexWrap: 'nowrap', gap: '$16' }}>
            <YStack flex={1} minWidth="100%" $gtLg={{ minWidth: artist.portrait ? '66%' : '100%' }}>
              <LabelCaps color="$accent">{artist.disciplines.join(' · ')}</LabelCaps>
              <SerifHeading size="titleXl" mt="$6">
                {artist.name}
              </SerifHeading>
              <Muted
                mt="$6"
                maxWidth={640}
                fontFamily="$heading"
                fontSize="$7"
                lineHeight="$7"
                $gtMd={{ fontSize: '$8' }}
              >
                {artist.short}
              </Muted>
              <XStack
                mt="$10"
                flexWrap="wrap"
                gap="$12"
                borderTopWidth={1}
                borderColor="$borderColor"
                pt="$6"
                {...(Platform.OS === 'web' ? { className: 'g-artist-page__facts' } : null)}
              >
                {artist.location && (
                  <YStack>
                    <LabelCaps color="$color11">Based</LabelCaps>
                    <Paragraph size="$3" mt="$1.5">
                      {artist.location}
                    </Paragraph>
                  </YStack>
                )}
                <YStack>
                  <LabelCaps color="$color11">Works</LabelCaps>
                  <Paragraph size="$3" mt="$1.5">
                    {artist.workCount}
                  </Paragraph>
                </YStack>
                {years.length > 0 && (
                  <YStack>
                    <LabelCaps color="$color11">In catalogue</LabelCaps>
                    <Paragraph size="$3" mt="$1.5">
                      {years[0]}
                      {years.length > 1 && ` – ${years[years.length - 1]}`}
                    </Paragraph>
                  </YStack>
                )}
              </XStack>
            </YStack>

            {artist.portrait && (
              <YStack flex={1} minWidth="100%" $gtLg={{ minWidth: '33%', maxWidth: '33%' }}>
                {Platform.OS === 'web' ? (
                  <div className="g-frame g-frame--portrait g-artist-page__portrait">
                    <GalleryImage
                      src={artist.portrait}
                      alt={`Portrait of ${artist.name}`}
                      fill
                      objectFit="cover"
                      priority
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
                      src={artist.portrait}
                      alt={`Portrait of ${artist.name}`}
                      fill
                      objectFit="cover"
                      priority
                    />
                  </YStack>
                )}
                <Paragraph mt="$3" size="$2" color="$color11" lineHeight="$4">
                  Artist photograph supplied by {artist.name}.
                </Paragraph>
              </YStack>
            )}
          </XStack>
        </Reveal>
      </Container>

      {artist.bio.length > 0 && (
        <Container mt="$20" $gtMd={{ mt: '$28' }} className="g-section">
          <Reveal>
            {Platform.OS === 'web' ? (
              <div className="g-artist-words">
                <p className="g-label" style={{ color: 'var(--gallery-muted)' }}>
                  In the artist&apos;s words
                </p>
                <div className="g-prose g-prose--wide">
                  {artist.bio.map((para, i) => (
                    <p key={i} className={i === 0 ? 'g-prose__lead' : undefined}>
                      {para}
                    </p>
                  ))}
                </div>
                <div style={{ marginTop: 28 }}>
                  <ArrowLink href={`/contact?artist=${artist.slug}`}>
                    Enquire about available works
                  </ArrowLink>
                </div>
              </div>
            ) : (
              <YStack
                gap="$6"
                borderTopWidth={1}
                borderColor="$borderColor"
                pt="$10"
              >
                <LabelCaps color="$color11">In the artist&apos;s words</LabelCaps>
                {artist.bio.map((para, i) => (
                  <Text
                    key={i}
                    fontFamily={i === 0 ? '$heading' : undefined}
                    fontSize={i === 0 ? 22 : 16}
                    lineHeight={i === 0 ? 32 : 24}
                    color={i === 0 ? '$color12' : '$color11'}
                  >
                    {para}
                  </Text>
                ))}
                <ArrowLink href={`/contact?artist=${artist.slug}`}>
                  Enquire about available works
                </ArrowLink>
              </YStack>
            )}
          </Reveal>
        </Container>
      )}

      {works.length > 0 && (
        <Container mt="$24" $gtMd={{ mt: '$36' }}>
          <Reveal>
            <SectionHeading index="01" title={`Works (${works.length})`} />
          </Reveal>
          {Platform.OS === 'web' ? (
            <div className="g-works-grid" style={{ marginTop: 48 }}>
              {works.slice(0, 24).map((work, i) => (
                <Reveal key={work.slug} delay={(i % 3) * 90}>
                  <ArtworkCard work={work} priority={i < 3} />
                </Reveal>
              ))}
            </div>
          ) : (
            <WorkGrid style={{ marginTop: 48 }}>
              {works.slice(0, 24).map((work, i) => (
                <Reveal key={work.slug} delay={(i % 3) * 90} width="100%">
                  <ArtworkCard work={work} priority={i < 3} />
                </Reveal>
              ))}
            </WorkGrid>
          )}
          {works.length > 24 && (
            <YStack mt="$14">
              <ArrowLink href="/works">See all {works.length} works in the viewing room</ArrowLink>
            </YStack>
          )}
        </Container>
      )}

      {shows.length > 0 && (
        <Container mt="$28" $gtMd={{ mt: '$36' }}>
          <Reveal>
            <SectionHeading index="02" title="Exhibitions at the gallery" />
          </Reveal>
          <YStack mt="$4">
            {shows.map((show, i) => (
              <Reveal key={show.slug} delay={i * 80}>
                <Link href={`/exhibitions/${show.slug}`}>
                  <YStack
                    borderBottomWidth={1}
                    borderColor="$borderColor"
                    py="$6"
                    gap="$2"
                    cursor="pointer"
                    $gtMd={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: '$8',
                    }}
                  >
                    <Text
                      fontFamily="$heading"
                      fontSize="$8"
                      hoverStyle={{ color: '$accent' }}
                      $gtMd={{ fontSize: '$9' }}
                      style={
                        Platform.OS === 'web'
                          ? {
                              fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
                              fontSize: 'clamp(1.5rem, 2.5vw, 1.875rem)',
                              letterSpacing: '-0.02em',
                            }
                          : undefined
                      }
                    >
                      {show.title}
                      <Text fontFamily="$body" fontSize="$3" color="$color11" ml="$3">
                        {show.status === 'Current' ? 'On view' : show.status}
                      </Text>
                    </Text>
                    <LabelCaps color="$color11" flexShrink={0}>
                      {show.dateLabel}
                    </LabelCaps>
                  </YStack>
                </Link>
              </Reveal>
            ))}
          </YStack>
        </Container>
      )}

      {next && next.slug !== artist.slug && (
        <Container mt="$28" $gtMd={{ mt: '$40' }}>
          <Reveal>
            <Link href={`/artists/${next.slug}`}>
              <YStack
                borderTopWidth={1}
                borderColor="$borderColor"
                pt="$10"
                gap="$4"
                cursor="pointer"
                $gtMd={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                }}
              >
                <YStack>
                  <LabelCaps color="$color11">Next artist</LabelCaps>
                  <SerifHeading size="next" mt="$4" hoverStyle={{ color: '$accent' }}>
                    {next.name}
                  </SerifHeading>
                </YStack>
                <Muted maxWidth={384} size="$3" lineHeight="$5">
                  {next.short}
                </Muted>
              </YStack>
            </Link>
          </Reveal>
        </Container>
      )}
    </YStack>
  )
}
