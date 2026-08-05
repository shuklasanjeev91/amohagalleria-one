import { useLoader } from 'one'
import { Platform } from 'react-native'
import { useEffect, useState } from 'react'
import { Paragraph, YStack } from 'tamagui'
import { PageHeader } from '~/components/gallery/PageHeader'
import { SeoHead } from '~/components/gallery/SeoHead'
import { WorksBrowser } from '~/components/gallery/WorksBrowser'
import { Container } from '~/components/gallery/primitives'
import { getMergedCatalogue } from '~/lib/catalogue'

export async function loader() {
  const catalogue = await getMergedCatalogue()
  return { catalogue }
}

export default function WorksPage() {
  const { catalogue } = useLoader(loader)
  const [initialQuery, setInitialQuery] = useState('')

  useEffect(() => {
    if (Platform.OS !== 'web') return
    setInitialQuery(new URLSearchParams(window.location.search).get('q') || '')
  }, [])

  return (
    <YStack width="100%">
      <SeoHead
        title="Works"
        description="Browse the Amoha Galleria viewing room — paintings and works available from the live catalogue."
        path="/works"
      />
      <PageHeader
        eyebrow="Viewing room"
        title="Works"
        lede={
          catalogue.ok
            ? `${catalogue.artworks.length} works from ${catalogue.artists.length} artists, live from the Amoha Galleria catalogue. Prices are shared on request, and viewings can be arranged in person or by video.`
            : 'The catalogue is briefly unavailable. Please try again in a moment.'
        }
      />
      <Container className="g-container" width="100%" maxWidth="100%" pb="$16" $gtMd={{ pb: '$24' }}>
        {catalogue.ok ? (
          <WorksBrowser
            artworks={catalogue.artworks}
            artists={catalogue.artists}
            categories={catalogue.categories}
            countries={catalogue.countries}
            initialQuery={initialQuery}
          />
        ) : (
          <Paragraph
            borderTopWidth={1}
            borderBottomWidth={1}
            borderColor="$borderColor"
            py="$16"
            fontFamily="$heading"
            fontSize="$8"
            fontStyle="italic"
            color="$color11"
            className={Platform.OS === 'web' ? 'g-italic' : undefined}
          >
            We could not reach the gallery catalogue just now.
          </Paragraph>
        )}
      </Container>
    </YStack>
  )
}
