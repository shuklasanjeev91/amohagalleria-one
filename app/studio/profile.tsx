import { useEffect, useState } from 'react'
import { Image, Platform } from 'react-native'
import { YStack } from 'tamagui'
import {
  GBanner,
  GButton,
  GField,
  GPage,
} from '~/components/gallery/GControls'
import { PageHeader } from '~/components/gallery/PageHeader'
import { StudioGate, StudioNav } from '~/components/gallery/StudioShell'
import { Container, LabelCaps, Muted } from '~/components/gallery/primitives'
import { getMyArtist, updateMyArtistProfile, uploadStudioImage } from '~/lib/studio'

export const sitemap = { exclude: true }

export default function StudioProfilePage() {
  const [name, setName] = useState('')
  const [details, setDetails] = useState('')
  const [address, setAddress] = useState('')
  const [instagram, setInstagram] = useState('')
  const [website, setWebsite] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    void (async () => {
      const artist = await getMyArtist()
      if (!artist) return
      setName(artist.artist_name || '')
      setDetails(artist.profile_details || '')
      setAddress(artist.address || '')
      setInstagram(artist.instagram || '')
      setWebsite(artist.website || '')
      setPhoto(artist.profile_photo)
      setApproved(!!artist.is_approved)
    })()
  }, [])

  async function onUpload(file: File) {
    setBusy(true)
    setErr(null)
    const res = await uploadStudioImage(file, 'avatars')
    setBusy(false)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setPhoto(res.url)
  }

  async function save() {
    setBusy(true)
    setErr(null)
    setMsg(null)
    const res = await updateMyArtistProfile({
      artist_name: name,
      profile_details: details,
      address,
      instagram,
      website,
      profile_photo: photo,
    })
    setBusy(false)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setMsg('Profile saved.')
  }

  return (
    <StudioGate requireArtist>
      <GPage>
        <PageHeader
          eyebrow="Studio"
          title="Artist profile"
          lede="Update the public-facing details shown when your works are published."
        />
        <Container className="g-container" pb="$20" width="100%">
          <StudioNav active="profile" />
          {!approved ? (
            <Muted marginBottom={16}>
              Your artist record exists but is not approved yet. An admin must approve before
              works go live.
            </Muted>
          ) : null}
          <YStack gap="$2" maxWidth={560} width="100%">
            <GField label="Name" value={name} onChangeText={setName} required />
            <GField
              label="Bio"
              value={details}
              onChangeText={setDetails}
              multiline
              numberOfLines={5}
            />
            <GField label="Location / address" value={address} onChangeText={setAddress} />
            <GField label="Instagram" value={instagram} onChangeText={setInstagram} />
            <GField
              label="Website"
              value={website}
              onChangeText={setWebsite}
              keyboardType="url"
              autoCapitalize="none"
            />
            {Platform.OS === 'web' ? (
              <GField label="Portrait">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void onUpload(f)
                  }}
                />
              </GField>
            ) : (
              <GField
                label="Portrait URL"
                value={photo || ''}
                onChangeText={(v) => setPhoto(v || null)}
                keyboardType="url"
                autoCapitalize="none"
                placeholder="https://…"
              />
            )}
            {photo ? (
              Platform.OS === 'web' ? (
                <img src={photo} alt="" className="g-studio-thumb" />
              ) : (
                <Image source={{ uri: photo }} style={{ width: 96, height: 96 }} resizeMode="cover" />
              )
            ) : null}
            {err ? <GBanner tone="error">{err}</GBanner> : null}
            {msg ? <GBanner tone="success">{msg}</GBanner> : null}
            <GButton disabled={busy} onPress={() => void save()}>
              {busy ? 'Saving…' : 'Save profile'}
            </GButton>
          </YStack>
          <LabelCaps marginTop={24} color="$color11">
            Changes sync to the public gallery when works are published.
          </LabelCaps>
        </Container>
      </GPage>
    </StudioGate>
  )
}
