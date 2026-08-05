import { useRouter } from 'one'
import { useEffect, useState } from 'react'
import { Image, Platform } from 'react-native'
import { XStack, YStack } from 'tamagui'
import {
  GBanner,
  GButton,
  GField,
  GPage,
  GSelect,
} from '~/components/gallery/GControls'
import { PageHeader } from '~/components/gallery/PageHeader'
import { StudioGate, StudioNav } from '~/components/gallery/StudioShell'
import { Container } from '~/components/gallery/primitives'
import {
  createArtwork,
  listCollections,
  listMediums,
  uploadStudioImage,
} from '~/lib/studio'

export const sitemap = { exclude: true }

export default function StudioNewWorkPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [about, setAbout] = useState('')
  const [year, setYear] = useState('')
  const [mediumId, setMediumId] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [mediums, setMediums] = useState<{ id: string; name: string }[]>([])
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setMediums(await listMediums())
      setCollections(await listCollections())
    })()
  }, [])

  async function onUpload(file: File) {
    setBusy(true)
    setErr(null)
    const res = await uploadStudioImage(file, 'artworks')
    setBusy(false)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setImageUrl(res.url)
  }

  async function submit(status: 'draft' | 'pending') {
    if (!imageUrl) {
      setErr('Add an image URL or upload an image first.')
      return
    }
    setBusy(true)
    setErr(null)
    const res = await createArtwork({
      title,
      about,
      year,
      medium_id: mediumId || undefined,
      collection_id: collectionId || undefined,
      image_url: imageUrl,
      status,
    })
    setBusy(false)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    router.push(`/studio/works/${res.id}` as any)
  }

  return (
    <StudioGate requireArtist>
      <GPage>
        <PageHeader
          eyebrow="Studio"
          title="Upload artwork"
          lede="Add an image and details, then save as draft or submit for admin review."
        />
        <Container className="g-container" pb="$20" width="100%">
          <StudioNav active="works" />
          <YStack gap="$2" maxWidth={560} width="100%">
            <GField label="Title" value={title} onChangeText={setTitle} required />
            <GField
              label="About"
              value={about}
              onChangeText={setAbout}
              multiline
              numberOfLines={4}
            />
            <GField label="Year" value={year} onChangeText={setYear} keyboardType="numeric" />
            <GSelect
              label="Medium"
              value={mediumId}
              onChange={setMediumId}
              options={[
                { value: '', label: 'Select…' },
                ...mediums.map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
            <GSelect
              label="Collection"
              value={collectionId}
              onChange={setCollectionId}
              options={[
                { value: '', label: 'Select…' },
                ...collections.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            {Platform.OS === 'web' ? (
              <GField label="Image">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void onUpload(f)
                  }}
                />
              </GField>
            ) : null}
            <GField
              label="Image URL"
              value={imageUrl}
              onChangeText={setImageUrl}
              keyboardType="url"
              autoCapitalize="none"
              placeholder="https://…"
              required
            />
            {imageUrl ? (
              Platform.OS === 'web' ? (
                <img src={imageUrl} alt="" className="g-studio-thumb" />
              ) : (
                <Image source={{ uri: imageUrl }} style={{ width: 120, height: 120 }} resizeMode="cover" />
              )
            ) : null}
            {err ? <GBanner tone="error">{err}</GBanner> : null}
            <XStack gap="$3" flexWrap="wrap">
              <GButton disabled={busy} variant="ghost" onPress={() => void submit('draft')}>
                Save draft
              </GButton>
              <GButton disabled={busy} onPress={() => void submit('pending')}>
                {busy ? 'Saving…' : 'Submit for review'}
              </GButton>
            </XStack>
          </YStack>
        </Container>
      </GPage>
    </StudioGate>
  )
}
