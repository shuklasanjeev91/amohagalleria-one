import { Link, useRouter } from 'one'
import { useEffect, useMemo, useState } from 'react'
import { Image, Platform } from 'react-native'
import { Text, YStack } from 'tamagui'
import { AdminDataGrid } from '~/components/gallery/AdminDataGrid'
import { GBanner, GPage, GSelect } from '~/components/gallery/GControls'
import { PageHeader } from '~/components/gallery/PageHeader'
import { StudioGate, StudioNav } from '~/components/gallery/StudioShell'
import { Container } from '~/components/gallery/primitives'
import {
  adminDeleteArtwork,
  adminListArtworks,
  adminSetArtworkStatus,
  type StudioArtwork,
} from '~/lib/studio'

export const sitemap = { exclude: true }

type WorkRow = StudioArtwork & { artists?: { artist_name?: string } | null }

export default function AdminArtworksPage() {
  const router = useRouter()
  const [works, setWorks] = useState<WorkRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | WorkRow['status']>('all')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setWorks((await adminListArtworks()) as WorkRow[])
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return works.filter((w) => {
      if (statusFilter !== 'all' && w.status !== statusFilter) return false
      if (!q) return true
      const artist = w.artists?.artist_name || ''
      return [w.title, w.status, w.medium_name, artist, w.slug]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
  }, [works, search, statusFilter])

  async function setStatus(id: string, status: 'published' | 'rejected' | 'pending' | 'draft') {
    setErr(null)
    setMsg(null)
    const res = await adminSetArtworkStatus(id, status)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setMsg(`Artwork marked ${status}`)
    await refresh()
  }

  async function remove(id: string, title: string) {
    if (typeof confirm === 'function' && !confirm(`Delete artwork “${title}”?`)) return
    setErr(null)
    const res = await adminDeleteArtwork(id)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setMsg('Artwork deleted')
    await refresh()
  }

  const statusExtra =
    Platform.OS === 'web' ? (
      <select
        className="g-admin-grid__search"
        style={{ minWidth: '9rem' }}
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        aria-label="Filter by status"
      >
        <option value="all">All statuses</option>
        <option value="draft">Draft</option>
        <option value="pending">Pending</option>
        <option value="published">Published</option>
        <option value="rejected">Rejected</option>
      </select>
    ) : (
      <GSelect
        label="Status"
        value={statusFilter}
        onChange={(v) => setStatusFilter(v as typeof statusFilter)}
        options={[
          { value: 'all', label: 'All statuses' },
          { value: 'draft', label: 'Draft' },
          { value: 'pending', label: 'Pending' },
          { value: 'published', label: 'Published' },
          { value: 'rejected', label: 'Rejected' },
        ]}
      />
    )

  return (
    <StudioGate requireAdmin>
      <GPage>
        <PageHeader
          eyebrow="Admin"
          title="Artworks"
          lede="Browse the works grid, filter by status, then edit or add."
        />
        <Container className="g-container" pb="$20" width="100%">
          <StudioNav active="artworks" />
          {err ? <GBanner tone="error">{err}</GBanner> : null}
          {msg ? <GBanner tone="success">{msg}</GBanner> : null}

          <AdminDataGrid
            title="Artwork catalogue"
            rows={filtered}
            loading={loading}
            getRowId={(w) => w.id}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search title, artist, status…"
            addLabel="Add artwork"
            onAdd={() => router.push('/studio/works/new' as any)}
            emptyLabel="No artworks match. Use Add artwork to create one."
            toolbarExtra={statusExtra}
            columns={[
              {
                key: 'image',
                header: '',
                width: '64px',
                listThumb: true,
                render: (w) =>
                  w.image_url ? (
                    Platform.OS === 'web' ? (
                      <img src={w.image_url} alt="" className="g-admin-grid__thumb" />
                    ) : (
                      <Image
                        source={{ uri: w.image_url }}
                        style={{ width: 48, height: 48 }}
                        resizeMode="cover"
                      />
                    )
                  ) : Platform.OS === 'web' ? (
                    <div className="g-admin-grid__thumb g-admin-grid__thumb--empty" />
                  ) : null,
              },
              {
                key: 'title',
                header: 'Title',
                listPrimary: true,
                render: (w) => w.title,
              },
              {
                key: 'artist',
                header: 'Artist',
                listMeta: true,
                render: (w) => w.artists?.artist_name || '—',
              },
              {
                key: 'status',
                header: 'Status',
                width: '120px',
                listStatus: true,
                render: (w) => w.status,
              },
              {
                key: 'medium',
                header: 'Medium',
                listHide: true,
                render: (w) => w.medium_name || '—',
              },
              {
                key: 'actions',
                header: 'Actions',
                width: '280px',
                render: (w) =>
                  Platform.OS === 'web' ? (
                    <div className="g-studio-table__actions">
                      <Link href={`/studio/works/${w.id}` as any}>Edit</Link>
                      <button type="button" onClick={() => void setStatus(w.id, 'published')}>
                        Publish
                      </button>
                      <button type="button" onClick={() => void setStatus(w.id, 'pending')}>
                        Pending
                      </button>
                      <button type="button" onClick={() => void setStatus(w.id, 'rejected')}>
                        Reject
                      </button>
                      <button type="button" onClick={() => void remove(w.id, w.title)}>
                        Delete
                      </button>
                    </div>
                  ) : (
                    <>
                      <Link href={`/studio/works/${w.id}` as any}>
                        <Text color="$accent" fontSize={13}>
                          Edit
                        </Text>
                      </Link>
                      <Text
                        color="$accent"
                        fontSize={13}
                        onPress={() => void setStatus(w.id, 'published')}
                      >
                        Publish
                      </Text>
                      <Text
                        color="$accent"
                        fontSize={13}
                        onPress={() => void setStatus(w.id, 'pending')}
                      >
                        Pending
                      </Text>
                      <Text
                        color="$accent"
                        fontSize={13}
                        onPress={() => void setStatus(w.id, 'rejected')}
                      >
                        Reject
                      </Text>
                      <Text
                        color="$accent"
                        fontSize={13}
                        onPress={() => void remove(w.id, w.title)}
                      >
                        Delete
                      </Text>
                    </>
                  ),
              },
            ]}
          />
          <Link href="/studio/admin">
            <Text color="$accent">← Dashboard</Text>
          </Link>
        </Container>
      </GPage>
    </StudioGate>
  )
}
