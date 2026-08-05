import { useLoader } from 'one'
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
  getArtwork,
  listCollections,
  listMediums,
  updateArtwork,
  uploadStudioImage,
} from '~/lib/studio'

export const sitemap = { exclude: true }

export async function loader({ params }: { params: { id: string } }) {
  return { id: params.id }
}

export default function StudioEditWorkPage() {
  const { id } = useLoader(loader)
  const [title, setTitle] = useState('')
  const [about, setAbout] = useState('')
  const [year, setYear] = useState('')
  const [mediumId, setMediumId] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [status, setStatus] = useState('draft')
  const [mediums, setMediums] = useState<{ id: string; name: string }[]>([])
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const [work, m, c] = await Promise.all([
        getArtwork(id),
        listMediums(),
        listCollections(),
      ])
      setMediums(m)
      setCollections(c)
      if (!work) return
      setTitle(work.title)
      setAbout(work.about_artwork || '')
      setYear(work.year ? String(work.year) : '')
      setMediumId(work.medium_id || '')
      setCollectionId(work.collection_id || '')
      setImageUrl(work.image_url || '')
      setStatus(work.status)
    })()
  }, [id])

  async function onUpload(file: File) {
    setBusy(true)
    const res = await uploadStudioImage(file, 'artworks')
    setBusy(false)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setImageUrl(res.url)
  }

  async function save(nextStatus?: 'draft' | 'pending') {
    setBusy(true)
    setErr(null)
    setMsg(null)
    const res = await updateArtwork(id, {
      title,
      about,
      year,
      medium_id: mediumId || null,
      collection_id: collectionId || null,
      image_url: imageUrl || undefined,
      status: nextStatus,
    })
    setBusy(false)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    if (nextStatus) setStatus(nextStatus)
    setMsg('Saved.')
  }

  return (
    <StudioGate requireArtist>
      <GPage>
        <PageHeader eyebrow="Studio" title="Edit artwork" lede={`Status: ${status}`} />
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
            />
            {imageUrl ? (
              Platform.OS === 'web' ? (
                <img src={imageUrl} alt="" className="g-studio-thumb" />
              ) : (
                <Image source={{ uri: imageUrl }} style={{ width: 120, height: 120 }} resizeMode="cover" />
              )
            ) : null}
            {err ? <GBanner tone="error">{err}</GBanner> : null}
            {msg ? <GBanner tone="success">{msg}</GBanner> : null}
            <XStack gap="$3" flexWrap="wrap">
              <GButton disabled={busy} onPress={() => void save()}>
                Save
              </GButton>
              <GButton disabled={busy} variant="ghost" onPress={() => void save('pending')}>
                Submit for review
              </GButton>
            </XStack>
          </YStack>
        </Container>
      </GPage>
    </StudioGate>
  )
}
