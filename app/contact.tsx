import { Link, useLoader, useParams } from 'one'
import { useState } from 'react'
import { Paragraph, Text, XStack, YStack } from 'tamagui'
import { GBanner, GButton, GField, GPage } from '~/components/gallery/GControls'
import { PageHeader, SectionHeading } from '~/components/gallery/PageHeader'
import { SeoHead } from '~/components/gallery/SeoHead'
import { Container, LabelCaps, Muted } from '~/components/gallery/primitives'
import { findArtist, findArtwork, getGalleryInfo } from '~/lib/amoha'
import { getMergedCatalogue } from '~/lib/catalogue'
import { submitEnquiry } from '~/lib/enquiries'
import { useGalleryAuth } from '~/lib/AuthProvider'

export async function loader() {
  const [info, catalogue] = await Promise.all([getGalleryInfo(), getMergedCatalogue()])
  return { info, catalogue }
}

export default function ContactPage() {
  const { info, catalogue } = useLoader(loader)
  const { work: workSlug, artist: artistSlug } = useParams<{ work?: string; artist?: string }>()
  const work = workSlug ? findArtwork(catalogue, workSlug) : undefined
  const artist = !work && artistSlug ? findArtist(catalogue, artistSlug) : undefined
  const { user } = useGalleryAuth()

  const title = work
    ? 'Enquire about this work'
    : artist
      ? 'Enquire about available works'
      : 'Contact the gallery'

  const lede = work
    ? `Ask about availability, dimensions and pricing for ${work.title} by ${work.artistName}.`
    : artist
      ? `Ask about availability and pricing for works by ${artist.name}.`
      : 'For available works, viewings, press requests or artist submissions.'

  const defaultMessage = work
    ? `I would like more information about ${work.title}${work.year ? ` (${work.year})` : ''} by ${work.artistName}.`
    : artist
      ? `I would like more information about available works by ${artist.name}.`
      : ''

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState(defaultMessage)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const mailto = info.email
    ? `mailto:${info.email}?subject=${encodeURIComponent(
        work
          ? `Message: ${work.title} by ${work.artistName}`
          : artist
            ? `Message: works by ${artist.name}`
            : 'Message from Amoha Galleria site',
      )}${defaultMessage ? `&body=${encodeURIComponent(defaultMessage)}` : ''}`
    : null

  async function onSubmit() {
    setBusy(true)
    setErr(null)
    const artworkIds =
      work?.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(work.id)
        ? [work.id]
        : []
    const res = await submitEnquiry({
      email,
      name,
      phone,
      message,
      artworkIds,
      source: work ? 'contact_work' : artist ? 'contact_artist' : 'contact',
    })
    setBusy(false)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setDone(true)
  }

  return (
    <GPage>
      <SeoHead title={title} description={lede} path="/contact" />
      <PageHeader eyebrow="Contact" title={title} lede={lede} />

      <Container className="g-container" pb="$16" $gtMd={{ pb: '$24' }} width="100%" maxWidth="100%">
        <XStack
          gap="$8"
          flexWrap="wrap"
          width="100%"
          $gtMd={{ flexWrap: 'nowrap', gap: '$12' }}
          $gtLg={{ gap: '$16' }}
        >
          <YStack flex={1} minWidth="100%" $gtMd={{ minWidth: 0, flex: 7 }} gap="$8" width="100%">
            <SectionHeading index="01" title="Write to us" />
            {done ? (
              <YStack gap="$4" maxWidth={560}>
                <LabelCaps color="$accent">Received</LabelCaps>
                <Muted>
                  Thank you. Your message has been sent to the gallery. We will follow up shortly.
                </Muted>
                <Link href="/works">
                  <LabelCaps color="$accent">Browse works →</LabelCaps>
                </Link>
              </YStack>
            ) : (
              <YStack gap="$2" maxWidth={560} width="100%">
                {err ? <GBanner tone="error">{err}</GBanner> : null}
                <GField label="Full name" value={name} onChangeText={setName} required />
                <GField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  required
                />
                <GField label="Phone" value={phone} onChangeText={setPhone} />
                <GField
                  label="Message"
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  numberOfLines={5}
                  required
                />
                <GButton disabled={busy} onPress={() => void onSubmit()}>
                  {busy ? 'Sending…' : 'Send message'}
                </GButton>
                {mailto ? (
                  <Muted fontSize={13} marginTop="$3">
                    Prefer email?{' '}
                    <Link href={mailto as any}>
                      <Text color="$accent">Write to {info.email}</Text>
                    </Link>
                  </Muted>
                ) : null}
              </YStack>
            )}
          </YStack>

          <YStack
            flex={1}
            minWidth="100%"
            width="100%"
            $gtMd={{
              minWidth: 0,
              flex: 5,
              borderLeftWidth: 1,
              borderColor: '$borderColor',
              pl: '$10',
            }}
            $gtLg={{ pl: '$14' }}
          >
            <SectionHeading index="02" title="Direct" />

            <YStack pt="$6">
              <LabelCaps color="$accent">Gallery</LabelCaps>
              <Text mt="$3" fontFamily="$heading" fontSize="$6" lineHeight="$5">
                {info.fullName ?? info.name}
              </Text>
            </YStack>

            <YStack mt="$8" gap="$2" borderTopWidth={1} borderColor="$borderColor" pt="$6">
              {info.email ? (
                <>
                  <LabelCaps color="$color11">Email</LabelCaps>
                  <Paragraph size="$3">{info.email}</Paragraph>
                </>
              ) : null}
            </YStack>

            {info.phone ? (
              <YStack mt="$8" borderTopWidth={1} borderColor="$borderColor" pt="$6">
                <LabelCaps color="$color11">Phone</LabelCaps>
                <Paragraph size="$3" mt="$2">
                  {info.phone}
                </Paragraph>
              </YStack>
            ) : null}

            <YStack mt="$8" borderTopWidth={1} borderColor="$borderColor" pt="$6">
              <LabelCaps color="$color11">Viewings</LabelCaps>
              <Paragraph size="$3" mt="$2" color="$color11">
                Prefer a private viewing? Mention it in your message and the gallery will follow up.
              </Paragraph>
            </YStack>
          </YStack>
        </XStack>
      </Container>
    </GPage>
  )
}
