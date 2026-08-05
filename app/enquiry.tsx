import { Link } from 'one'
import { useState } from 'react'
import { Image } from 'react-native'
import { Text, YStack } from 'tamagui'
import { GBanner, GButton, GField, GListRow, GPage } from '~/components/gallery/GControls'
import { PageHeader } from '~/components/gallery/PageHeader'
import { SeoHead } from '~/components/gallery/SeoHead'
import { Container, LabelCaps, Muted } from '~/components/gallery/primitives'
import { useEnquiryCart } from '~/lib/EnquiryCartProvider'
import { submitEnquiry } from '~/lib/enquiries'
import { useGalleryAuth } from '~/lib/AuthProvider'

export default function EnquiryCartPage() {
  const { user } = useGalleryAuth()
  const { items, remove, refresh } = useEnquiryCart()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function onSubmit() {
    setBusy(true)
    setErr(null)
    const res = await submitEnquiry({
      email,
      name,
      phone,
      message,
      artworkIds: items.map((i) => i.artwork_id),
      source: 'enquiry_cart',
    })
    setBusy(false)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setDone(true)
    await refresh()
  }

  return (
    <GPage>
      <SeoHead title="Enquiry list" path="/enquiry" noIndex />
      <PageHeader
        eyebrow="Collect"
        title="Enquiry list"
        lede="Works you are considering. Submit once — the gallery will follow up with availability and pricing."
      />
      <Container className="g-container" pb="$20" width="100%">
        {done ? (
          <YStack gap="$4" maxWidth={560}>
            <LabelCaps color="$accent">Received</LabelCaps>
            <Muted>
              Thank you. Your enquiry has been sent to the gallery. We will be in touch shortly.
            </Muted>
            <GButton href="/works">Continue browsing</GButton>
          </YStack>
        ) : (
          <>
            <YStack marginBottom="$6" width="100%">
              {items.map((item) => (
                <GListRow
                  key={item.id}
                  thumb={
                    item.image_url ? (
                      <Image
                        source={{ uri: item.image_url }}
                        style={{ width: 48, height: 48 }}
                        resizeMode="cover"
                      />
                    ) : undefined
                  }
                  title={item.title || 'Work'}
                  meta={item.artist_name || undefined}
                  actions={
                    <>
                      {item.slug ? (
                        <Link href={`/works/${item.slug}` as any}>
                          <Text color="$accent" fontSize={13}>
                            View
                          </Text>
                        </Link>
                      ) : null}
                      <Text color="$accent" fontSize={13} onPress={() => void remove(item.id)}>
                        Remove
                      </Text>
                    </>
                  }
                />
              ))}
              {!items.length ? (
                <Muted>
                  Your enquiry list is empty.{' '}
                  <Link href="/works">
                    <Text color="$accent">Browse works →</Text>
                  </Link>
                </Muted>
              ) : null}
            </YStack>

            {items.length > 0 ? (
              <YStack gap="$2" maxWidth={560} width="100%">
                <LabelCaps color="$accent">Submit enquiry</LabelCaps>
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
                  numberOfLines={4}
                  placeholder="Availability, dimensions, shipping…"
                />
                <GButton disabled={busy} onPress={() => void onSubmit()}>
                  {busy ? 'Sending…' : 'Send enquiry'}
                </GButton>
              </YStack>
            ) : null}
          </>
        )}
      </Container>
    </GPage>
  )
}
