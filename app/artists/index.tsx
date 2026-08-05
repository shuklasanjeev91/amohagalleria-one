import { Link, useLoader } from 'one'
import { Platform } from 'react-native'
import { Paragraph, Text, YStack } from 'tamagui'
import { ArtistIndex } from '~/components/gallery/ArtistIndex'
import { GalleryImage } from '~/components/gallery/GalleryImage'
import { PageHeader, SectionHeading } from '~/components/gallery/PageHeader'
import { Reveal } from '~/components/gallery/Reveal'
import { SeoHead } from '~/components/gallery/SeoHead'
import { Container, LabelCaps } from '~/components/gallery/primitives'
import { worksByArtist } from '~/lib/amoha'
import { getMergedCatalogue } from '~/lib/catalogue'

export async function loader() {
  const catalogue = await getMergedCatalogue()
  const artists = catalogue.artists.map((a) => {
    if (a.portrait) return a
    const first = worksByArtist(catalogue, a.slug)[0]
    return { ...a, portrait: first?.image ?? null }
  })
  const withPortraits = artists.filter((a) => a.portrait)
  return {
    catalogue: { ...catalogue, artists },
    withPortraits,
  }
}

export default function ArtistsPage() {
  const { catalogue, withPortraits } = useLoader(loader)

  return (
    <YStack width="100%">
      <SeoHead
        title="Artists"
        description="Meet the artists represented in the Amoha Galleria catalogue."
        path="/artists"
      />
      <PageHeader
        eyebrow="Roster"
        title="Artists"
        lede={
          catalogue.ok
            ? `${catalogue.artists.length} artists from across the world have work in the gallery's catalogue, spanning ${catalogue.categories.length} disciplines.`
            : 'The artist list is briefly unavailable. Please try again in a moment.'
        }
      />

      <Container className="g-container" width="100%" maxWidth="100%">
        <Reveal>
          <ArtistIndex artists={catalogue.artists} />
        </Reveal>
      </Container>

      {withPortraits.length > 0 && (
        <Container className="g-container" mt="$20" $gtMd={{ mt: '$28' }} width="100%" maxWidth="100%" pb="$16" $gtMd={{ pb: '$24' }}>
          <Reveal>
            <SectionHeading index="—" title="In the studio" />
          </Reveal>
          {Platform.OS === 'web' ? (
            <ul className="g-grid-4" style={{ marginTop: 48, listStyle: 'none', padding: 0, width: '100%' }}>
              {withPortraits.map((artist, i) => (
                <Reveal key={artist.slug} delay={(i % 4) * 90}>
                  <li>
                    <Link href={`/artists/${artist.slug}`}>
                      <div className="group" style={{ display: 'block', width: '100%' }}>
                        <div className="g-frame g-frame--portrait g-zoom g-artist-page__portrait">
                          <GalleryImage
                            src={artist.portrait || '/placeholder.svg'}
                            alt={`Portrait of ${artist.name}`}
                            fill
                            objectFit="cover"
                          />
                        </div>
                        <Text
                          mt="$4"
                          fontFamily="$heading"
                          fontSize="$6"
                          lineHeight="$5"
                          display="block"
                          hoverStyle={{ color: '$accent' }}
                          style={{
                            fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
                            fontSize: 20,
                            lineHeight: '1.3',
                            marginTop: 16,
                          }}
                        >
                          {artist.name}
                        </Text>
                        <Paragraph mt="$1" size="$3" color="$color11">
                          {artist.discipline} · {artist.workCount}{' '}
                          {artist.workCount === 1 ? 'work' : 'works'}
                        </Paragraph>
                      </div>
                    </Link>
                  </li>
                </Reveal>
              ))}
            </ul>
          ) : (
            <YStack mt="$12" gap="$14" flexWrap="wrap" flexDirection="row">
              {withPortraits.map((artist, i) => (
                <Reveal
                  key={artist.slug}
                  delay={(i % 4) * 90}
                  width="100%"
                  $gtSm={{ width: 'calc(50% - 16px)' }}
                  $gtLg={{ width: 'calc(25% - 24px)' }}
                >
                  <Link href={`/artists/${artist.slug}`}>
                    <YStack cursor="pointer">
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
                        />
                      </YStack>
                      <Text
                        mt="$4"
                        fontFamily="$heading"
                        fontSize="$6"
                        lineHeight="$5"
                        hoverStyle={{ color: '$accent' }}
                      >
                        {artist.name}
                      </Text>
                      <Paragraph mt="$1" size="$3" color="$color11">
                        {artist.discipline} · {artist.workCount}{' '}
                        {artist.workCount === 1 ? 'work' : 'works'}
                      </Paragraph>
                    </YStack>
                  </Link>
                </Reveal>
              ))}
            </YStack>
          )}
        </Container>
      )}
    </YStack>
  )
}
