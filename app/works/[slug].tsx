import { Link, useLoader } from 'one'
import { useState } from 'react'
import { Platform } from 'react-native'
import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { ArrowLink } from '~/components/gallery/ArrowLink'
import { ArtworkCard } from '~/components/gallery/ArtworkCard'
import { ArtworkViewer } from '~/components/gallery/ArtworkViewer'
import { SectionHeading } from '~/components/gallery/PageHeader'
import { Reveal } from '~/components/gallery/Reveal'
import { SeoHead } from '~/components/gallery/SeoHead'
import { Container, LabelCaps, Muted, SerifHeading, WorkGrid } from '~/components/gallery/primitives'
import {
  exhibitionForWork,
  findArtist,
  findArtwork,
  getGalleryInfo,
  worksByArtist,
} from '~/lib/amoha'
import { getMergedCatalogue } from '~/lib/catalogue'
import { useEnquiryCart } from '~/lib/EnquiryCartProvider'

function isStudioUuid(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

function AddToEnquiryButton({ artworkId, slug }: { artworkId: string; slug: string }) {
  const cart = useEnquiryCart()
  const [busy, setBusy] = useState(false)
  const [added, setAdded] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const canCart = isStudioUuid(artworkId)

  if (!canCart) {
    return (
      <Link href={`/contact?work=${slug}`}>
        <YStack
          backgroundColor="$color12"
          px="$6"
          py="$4"
          alignItems="center"
          justifyContent="center"
          hoverStyle={{ backgroundColor: '$accent' }}
        >
          <LabelCaps color="$background">Enquire about this work</LabelCaps>
        </YStack>
      </Link>
    )
  }

  return (
    <YStack gap="$3">
      <YStack
        backgroundColor="$color12"
        px="$6"
        py="$4"
        alignItems="center"
        justifyContent="center"
        opacity={busy ? 0.6 : 1}
        cursor="pointer"
        hoverStyle={{ backgroundColor: '$accent' }}
        onPress={() => {
          if (busy) return
          setBusy(true)
          setErr(null)
          void cart.add(artworkId).then((res) => {
            setBusy(false)
            if (!res.ok) {
              setErr(res.error)
              return
            }
            setAdded(true)
          })
        }}
      >
        <LabelCaps color="$background">
          {added ? 'Added to enquiry list' : busy ? 'Adding…' : 'Add to enquiry list'}
        </LabelCaps>
      </YStack>
      {added ? (
        <Link href="/enquiry">
          <LabelCaps color="$accent">View enquiry list →</LabelCaps>
        </Link>
      ) : null}
      {err ? <Muted color="$accent">{err}</Muted> : null}
    </YStack>
  )
}

export async function loader({ params }: { params: { slug: string } }) {
  const [catalogue, info] = await Promise.all([getMergedCatalogue(), getGalleryInfo()])
  const work = findArtwork(catalogue, params.slug)
  if (!work) return { notFound: true as const }

  const { artworks } = catalogue
  const artist = findArtist(catalogue, work.artistSlug)
  const show = exhibitionForWork(catalogue, work.slug)
  const index = artworks.findIndex((w) => w.slug === work.slug)
  const prev = artworks[(index - 1 + artworks.length) % artworks.length]
  const next = artworks[(index + 1) % artworks.length]
  const related = worksByArtist(catalogue, work.artistSlug)
    .filter((w) => w.slug !== work.slug)
    .slice(0, 3)

  return { notFound: false as const, work, info, artist, show, prev, next, related }
}

function NavDivider() {
  if (Platform.OS === 'web') {
    return (
      <span
        aria-hidden="true"
        style={{ height: 16, width: 1, background: 'var(--gallery-border)', flexShrink: 0 }}
      />
    )
  }
  return <YStack width={1} height={16} backgroundColor="$borderColor" flexShrink={0} />
}

export default function ArtworkPage() {
  const data = useLoader(loader)

  if (data.notFound) {
    return (
      <Container pt="$12">
        <SerifHeading size="large">Work not found</SerifHeading>
        <Muted mt="$4">This work is not in the catalogue.</Muted>
        <ArrowLink href="/works">Back to works</ArrowLink>
      </Container>
    )
  }

  const { work, info, artist, show, prev, next, related } = data
  const caption = [work.artistName, work.title, work.year].filter(Boolean).join(', ')

  const details = [
    { k: 'Category', v: work.category },
    ...(work.location ? [{ k: 'Origin', v: work.location }] : []),
    ...(work.dateLabel ? [{ k: 'Dated', v: work.dateLabel }] : []),
    { k: 'Price', v: 'On request' },
    ...(show ? [{ k: 'Exhibited', v: `${show.title}, ${show.dateLabel}` }] : []),
  ]

  return (
    <Container pt="$8" $gtMd={{ pt: '$12' }}>
      <SeoHead
        title={work.title}
        description={[work.title, work.artistName, work.category, work.year]
          .filter(Boolean)
          .join(' · ')}
        path={`/works/${work.slug}`}
        image={work.image}
        type="product"
      />
      <XStack
        alignItems="center"
        justifyContent="space-between"
        gap="$6"
        borderBottomWidth={1}
        borderColor="$borderColor"
        pb="$4"
      >
        <XStack alignItems="center" gap="$2" flex={1} minWidth={0} aria-label="Breadcrumb">
          <Link href="/works">
            <LabelCaps color="$color11" hoverStyle={{ color: '$accent' }}>
              Works
            </LabelCaps>
          </Link>
          <Text color="$color11">/</Text>
          <LabelCaps color="$color12" numberOfLines={1} flex={1}>
            {work.title}
          </LabelCaps>
        </XStack>
        <XStack alignItems="center" gap="$4" flexShrink={0}>
          <Link href={`/works/${prev.slug}`}>
            <XStack alignItems="center" gap="$1.5" hoverStyle={{ color: '$accent' }}>
              <Text fontSize="$2">←</Text>
              <LabelCaps display="none" $gtSm={{ display: 'flex' }}>
                Previous
              </LabelCaps>
            </XStack>
          </Link>
          <NavDivider />
          <Link href={`/works/${next.slug}`}>
            <XStack alignItems="center" gap="$1.5" hoverStyle={{ color: '$accent' }}>
              <LabelCaps display="none" $gtSm={{ display: 'flex' }}>
                Next
              </LabelCaps>
              <Text fontSize="$2">→</Text>
            </XStack>
          </Link>
        </XStack>
      </XStack>

      <XStack
        mt="$10"
        gap="$12"
        flexWrap="wrap"
        $gtLg={{ flexWrap: 'nowrap', gap: '$16' }}
        {...(Platform.OS === 'web' ? { className: 'g-work-detail' } : null)}
      >
        <Reveal flex={1} minWidth="100%" $gtLg={{ minWidth: '58%', maxWidth: '66%' }}>
          <ArtworkViewer
            src={work.image}
            alt={`${work.title} by ${work.artistName}`}
            caption={`${caption}. ${work.category}.`}
          />
        </Reveal>

        <Reveal delay={100} flex={1} minWidth="100%" $gtLg={{ minWidth: '33%', maxWidth: '42%' }}>
          <YStack $gtLg={{ position: 'sticky', top: 112 }}>
            <Link href={`/artists/${work.artistSlug}`}>
              <LabelCaps color="$color11" hoverStyle={{ color: '$accent' }}>
                {work.artistName}
              </LabelCaps>
            </Link>
            <SerifHeading size="work" mt="$4">
              <Text fontStyle="italic">{work.title}</Text>
            </SerifHeading>
            {work.year && (
              <Text mt="$2" fontFamily="$heading" fontSize="$7" color="$color11">
                {work.year}
              </Text>
            )}

            {work.about.length > 0 && (
              <YStack mt="$8" gap="$4">
                {work.about.slice(0, 3).map((para, i) => (
                  <Muted key={i} size="$4" lineHeight="$6">
                    {para}
                  </Muted>
                ))}
              </YStack>
            )}

            <YStack mt="$10" borderTopWidth={1} borderColor="$borderColor">
              {details.map((row) => (
                <XStack
                  key={row.k}
                  justifyContent="space-between"
                  gap="$6"
                  borderBottomWidth={1}
                  borderColor="$borderColor"
                  py="$3.5"
                >
                  <LabelCaps color="$color11" flexShrink={0}>
                    {row.k}
                  </LabelCaps>
                  <Paragraph size="$3" textAlign="right">
                    {row.v}
                  </Paragraph>
                </XStack>
              ))}
            </YStack>

            <YStack mt="$10" gap="$5">
              <AddToEnquiryButton artworkId={work.id} slug={work.slug} />
              <Link href={`/contact?work=${work.slug}`}>
                <YStack
                  borderWidth={1}
                  borderColor="$borderColor"
                  px="$6"
                  py="$4"
                  alignItems="center"
                  justifyContent="center"
                  hoverStyle={{ borderColor: '$accent' }}
                >
                  <LabelCaps>Contact the gallery</LabelCaps>
                </YStack>
              </Link>
              <Paragraph size="$2" color="$color11" lineHeight="$4">
                Condition reports, additional images and shipping estimates are available on
                request. Private viewings can be arranged with the gallery.
              </Paragraph>
            </YStack>
          </YStack>
        </Reveal>
      </XStack>

      {related.length > 0 && artist && (
        <YStack mt="$28" $gtMd={{ mt: '$40' }}>
          <Reveal>
            <SectionHeading
              index="—"
              title={`More by ${artist.name}`}
              action={<ArrowLink href={`/artists/${artist.slug}`}>Artist page</ArrowLink>}
            />
          </Reveal>
          {Platform.OS === 'web' ? (
            <div className="g-grid-3" style={{ marginTop: 48 }}>
              {related.map((w, i) => (
                <Reveal key={w.slug} delay={(i % 3) * 90}>
                  <ArtworkCard work={w} />
                </Reveal>
              ))}
            </div>
          ) : (
            <WorkGrid style={{ marginTop: 48 }}>
              {related.map((w, i) => (
                <Reveal key={w.slug} delay={(i % 3) * 90} width="100%">
                  <ArtworkCard work={w} />
                </Reveal>
              ))}
            </WorkGrid>
          )}
        </YStack>
      )}
    </Container>
  )
}
