import { Link } from 'one'
import { useEffect, useState } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { GBanner, GButton, GListRow, GPage } from '~/components/gallery/GControls'
import { PageHeader } from '~/components/gallery/PageHeader'
import { StudioGate, StudioNav } from '~/components/gallery/StudioShell'
import { Container, LabelCaps, Muted } from '~/components/gallery/primitives'
import { adminDashboardCounts, adminListUsers, adminSetRole, type StudioUserRow } from '~/lib/studio'
import type { GalleryRole } from '~/lib/auth'

export const sitemap = { exclude: true }

export default function StudioAdminDashboard() {
  const [counts, setCounts] = useState({
    artists: 0,
    artworks: 0,
    customers: 0,
    enquiries: 0,
    pendingWorks: 0,
  })
  const [users, setUsers] = useState<StudioUserRow[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function refresh() {
    setCounts(await adminDashboardCounts())
    setUsers(await adminListUsers())
  }

  useEffect(() => {
    void refresh()
  }, [])

  async function setRole(id: string, role: GalleryRole) {
    setErr(null)
    setMsg(null)
    const res = await adminSetRole(id, role)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setMsg(`Updated role to ${role}`)
    await refresh()
  }

  const cards = [
    { href: '/studio/admin/artists', label: 'Artists', value: counts.artists },
    { href: '/studio/admin/artworks', label: 'Artworks', value: counts.artworks },
    { href: '/studio/admin/customers', label: 'Customers', value: counts.customers },
    { href: '/studio/admin/enquiries', label: 'New enquiries', value: counts.enquiries },
  ]

  return (
    <StudioGate requireAdmin>
      <GPage>
        <PageHeader
          eyebrow="Admin"
          title="Gallery console"
          lede="Manage artists, artworks, visited customers, and enquiries."
        />
        <Container className="g-container" pb="$20" width="100%">
          <StudioNav active="admin" />
          {err ? <GBanner tone="error">{err}</GBanner> : null}
          {msg ? <GBanner tone="success">{msg}</GBanner> : null}

          <XStack flexWrap="wrap" gap="$3" marginBottom="$6">
            {cards.map((c) => (
              <Link key={c.href} href={c.href as any} style={{ minWidth: '42%', flexGrow: 1 }}>
                <YStack
                  className="g-admin-tile"
                  padding="$4"
                  borderWidth={1}
                  borderColor="$borderColor"
                  backgroundColor="$color1"
                  minHeight={100}
                  justifyContent="space-between"
                >
                  <LabelCaps color="$color11">{c.label}</LabelCaps>
                  <Text fontFamily="$heading" fontSize={36} color="$color" marginTop="$2">
                    {c.value}
                  </Text>
                  <Text fontSize={13} color="$accent" marginTop="$2">
                    Open →
                  </Text>
                </YStack>
              </Link>
            ))}
          </XStack>

          {counts.pendingWorks > 0 ? (
            <Muted marginBottom={24}>
              {counts.pendingWorks} artwork{counts.pendingWorks === 1 ? '' : 's'} awaiting review.{' '}
              <Link href="/studio/admin/artworks">
                <Text color="$accent">Review artworks →</Text>
              </Link>
            </Muted>
          ) : null}

          <LabelCaps color="$accent" marginBottom={12}>
            Users & roles
          </LabelCaps>
          {users.map((u) => (
            <GListRow
              key={u.id}
              title={u.full_name || u.email}
              meta={`${u.email} · ${u.role || 'collector'}`}
              actions={
                <>
                  <GButton variant="ghost" onPress={() => void setRole(u.id, 'artist')}>
                    Artist
                  </GButton>
                  <GButton variant="ghost" onPress={() => void setRole(u.id, 'collector')}>
                    Collector
                  </GButton>
                  <GButton variant="ghost" onPress={() => void setRole(u.id, 'admin')}>
                    Admin
                  </GButton>
                </>
              }
            />
          ))}
          {!users.length ? <Muted>No users yet.</Muted> : null}
        </Container>
      </GPage>
    </StudioGate>
  )
}
