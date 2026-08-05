import { Link } from 'one'
import { useEffect, useMemo, useState } from 'react'
import { Image, Platform } from 'react-native'
import { Text, YStack } from 'tamagui'
import { AdminDataGrid } from '~/components/gallery/AdminDataGrid'
import {
  GBanner,
  GButton,
  GCheckField,
  GField,
  GPage,
} from '~/components/gallery/GControls'
import { PageHeader } from '~/components/gallery/PageHeader'
import { StudioGate, StudioNav } from '~/components/gallery/StudioShell'
import { Container, LabelCaps } from '~/components/gallery/primitives'
import {
  adminDeleteArtist,
  adminListArtists,
  adminUpsertArtist,
  type StudioArtist,
} from '~/lib/studio'

export const sitemap = { exclude: true }

const emptyForm = {
  id: '' as string,
  artist_name: '',
  profile_details: '',
  address: '',
  instagram: '',
  website: '',
  profile_photo: '',
  is_approved: false,
}

type Mode = 'list' | 'add' | 'edit'

export default function AdminArtistsPage() {
  const [artists, setArtists] = useState<StudioArtist[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<Mode>('list')
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setArtists(await adminListArtists())
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return artists
    return artists.filter((a) =>
      [a.artist_name, a.slug, a.address, a.instagram, a.website]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [artists, search])

  function openAdd() {
    setForm(emptyForm)
    setMode('add')
    setMsg(null)
    setErr(null)
  }

  function openEdit(a: StudioArtist) {
    setForm({
      id: a.id,
      artist_name: a.artist_name || '',
      profile_details: a.profile_details || '',
      address: a.address || '',
      instagram: a.instagram || '',
      website: a.website || '',
      profile_photo: a.profile_photo || '',
      is_approved: !!a.is_approved,
    })
    setMode('edit')
    setMsg(null)
    setErr(null)
  }

  function closeForm() {
    setMode('list')
    setForm(emptyForm)
  }

  async function save() {
    setBusy(true)
    setErr(null)
    setMsg(null)
    const res = await adminUpsertArtist({
      id: form.id || undefined,
      artist_name: form.artist_name,
      profile_details: form.profile_details,
      address: form.address,
      instagram: form.instagram,
      website: form.website,
      profile_photo: form.profile_photo || null,
      is_approved: form.is_approved,
    })
    setBusy(false)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setMsg(form.id ? 'Artist updated' : 'Artist created')
    closeForm()
    await refresh()
  }

  async function remove(id: string, name: string) {
    if (typeof confirm === 'function' && !confirm(`Delete artist “${name}” and all their artworks?`))
      return
    setErr(null)
    const res = await adminDeleteArtist(id)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setMsg('Artist deleted')
    if (form.id === id) closeForm()
    await refresh()
  }

  return (
    <StudioGate requireAdmin>
      <GPage>
        <PageHeader
          eyebrow="Admin"
          title="Artists"
          lede="Browse the artist directory, then add or edit records."
        />
        <Container className="g-container" pb="$20" width="100%">
          <StudioNav active="artists" />
          {err ? <GBanner tone="error">{err}</GBanner> : null}
          {msg ? <GBanner tone="success">{msg}</GBanner> : null}

          {mode !== 'list' ? (
            <YStack
              className="g-admin-grid__panel"
              gap="$2"
              marginBottom="$6"
              padding="$4"
              borderWidth={1}
              borderColor="$borderColor"
              maxWidth={560}
            >
              <YStack
                flexDirection="row"
                justifyContent="space-between"
                alignItems="center"
                marginBottom="$3"
                flexWrap="wrap"
                gap="$2"
              >
                <LabelCaps color="$accent">
                  {mode === 'edit' ? 'Edit artist' : 'Add artist'}
                </LabelCaps>
                <GButton variant="ghost" onPress={closeForm}>
                  Back to list
                </GButton>
              </YStack>
              <GField
                label="Artist name"
                value={form.artist_name}
                onChangeText={(v) => setForm((f) => ({ ...f, artist_name: v }))}
                required
              />
              <GField
                label="Bio"
                value={form.profile_details}
                onChangeText={(v) => setForm((f) => ({ ...f, profile_details: v }))}
                multiline
                numberOfLines={3}
              />
              <GField
                label="Address"
                value={form.address}
                onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
              />
              <GField
                label="Instagram"
                value={form.instagram}
                onChangeText={(v) => setForm((f) => ({ ...f, instagram: v }))}
              />
              <GField
                label="Website"
                value={form.website}
                onChangeText={(v) => setForm((f) => ({ ...f, website: v }))}
                keyboardType="url"
                autoCapitalize="none"
              />
              <GField
                label="Photo URL"
                value={form.profile_photo}
                onChangeText={(v) => setForm((f) => ({ ...f, profile_photo: v }))}
                keyboardType="url"
                autoCapitalize="none"
              />
              <GCheckField
                label="Approved"
                checked={form.is_approved}
                onChange={(v) => setForm((f) => ({ ...f, is_approved: v }))}
              />
              <GButton disabled={busy} onPress={() => void save()}>
                {mode === 'edit' ? 'Save changes' : 'Create artist'}
              </GButton>
            </YStack>
          ) : null}

          {mode === 'list' ? (
            <AdminDataGrid
              title="Artist directory"
              rows={filtered}
              loading={loading}
              getRowId={(a) => a.id}
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search name, slug, location…"
              addLabel="Add artist"
              onAdd={openAdd}
              emptyLabel="No artists yet. Use Add artist to create one."
              columns={[
                {
                  key: 'photo',
                  header: '',
                  width: '64px',
                  listThumb: true,
                  render: (a) =>
                    a.profile_photo ? (
                      Platform.OS === 'web' ? (
                        <img src={a.profile_photo} alt="" className="g-admin-grid__thumb" />
                      ) : (
                        <Image
                          source={{ uri: a.profile_photo }}
                          style={{ width: 48, height: 48 }}
                          resizeMode="cover"
                        />
                      )
                    ) : Platform.OS === 'web' ? (
                      <div className="g-admin-grid__thumb g-admin-grid__thumb--empty" />
                    ) : null,
                },
                {
                  key: 'name',
                  header: 'Name',
                  listPrimary: true,
                  render: (a) => a.artist_name,
                },
                {
                  key: 'status',
                  header: 'Status',
                  width: '120px',
                  listStatus: true,
                  render: (a) => (a.is_approved ? 'Approved' : 'Pending'),
                },
                {
                  key: 'location',
                  header: 'Location',
                  listMeta: true,
                  render: (a) => a.address || a.slug || '—',
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  width: '180px',
                  render: (a) =>
                    Platform.OS === 'web' ? (
                      <div className="g-studio-table__actions">
                        <button type="button" onClick={() => openEdit(a)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => void remove(a.id, a.artist_name)}>
                          Delete
                        </button>
                      </div>
                    ) : (
                      <>
                        <Text color="$accent" fontSize={13} onPress={() => openEdit(a)}>
                          Edit
                        </Text>
                        <Text
                          color="$accent"
                          fontSize={13}
                          onPress={() => void remove(a.id, a.artist_name)}
                        >
                          Delete
                        </Text>
                      </>
                    ),
                },
              ]}
            />
          ) : null}
          <Link href="/studio/admin">
            <Text color="$accent">← Dashboard</Text>
          </Link>
        </Container>
      </GPage>
    </StudioGate>
  )
}
