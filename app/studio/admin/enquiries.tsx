import { Link } from 'one'
import { useEffect, useMemo, useState } from 'react'
import { Text, XStack, YStack } from 'tamagui'
import { GBanner, GButton, GEmpty, GListRow, GPage } from '~/components/gallery/GControls'
import { PageHeader } from '~/components/gallery/PageHeader'
import { StudioGate, StudioNav } from '~/components/gallery/StudioShell'
import { Container, LabelCaps } from '~/components/gallery/primitives'
import {
  adminListEnquiries,
  adminUpdateEnquiryStatus,
  type Enquiry,
} from '~/lib/enquiries'

export const sitemap = { exclude: true }

export default function AdminEnquiriesPage() {
  const [items, setItems] = useState<Enquiry[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | Enquiry['status']>('all')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    setItems(await adminListEnquiries())
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return items
    return items.filter((e) => e.status === statusFilter)
  }, [items, statusFilter])

  async function setStatus(id: string, status: Enquiry['status']) {
    setErr(null)
    setMsg(null)
    const res = await adminUpdateEnquiryStatus(id, status)
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setMsg(`Enquiry marked ${status}`)
    await refresh()
  }

  const filters: { value: typeof statusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'closed', label: 'Closed' },
  ]

  return (
    <StudioGate requireAdmin>
      <GPage>
        <PageHeader
          eyebrow="Admin"
          title="Enquiries"
          lede="Inbox for contact forms and enquiry-cart submissions."
        />
        <Container className="g-container" pb="$20" width="100%">
          <StudioNav active="enquiries" />
          {err ? <GBanner tone="error">{err}</GBanner> : null}
          {msg ? <GBanner tone="success">{msg}</GBanner> : null}

          <XStack gap="$2" flexWrap="wrap" marginBottom="$4">
            {filters.map((f) => (
              <GButton
                key={f.value}
                variant={statusFilter === f.value ? 'primary' : 'ghost'}
                onPress={() => setStatusFilter(f.value)}
              >
                {f.label}
              </GButton>
            ))}
          </XStack>

          <LabelCaps color="$color11" marginBottom="$3">
            {filtered.length} enquir{filtered.length === 1 ? 'y' : 'ies'}
          </LabelCaps>

          {loading ? <GEmpty>Loading…</GEmpty> : null}
          {!loading && !filtered.length ? <GEmpty>No enquiries yet.</GEmpty> : null}
          {!loading
            ? filtered.map((e) => (
                <GListRow
                  key={e.id}
                  title={`${e.name || e.email} · ${e.status}`}
                  meta={[
                    e.email,
                    e.phone,
                    e.artwork_ids?.length
                      ? `${e.artwork_ids.length} work${e.artwork_ids.length === 1 ? '' : 's'}`
                      : null,
                    new Date(e.created_at).toLocaleString(),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                  status={e.message ? <Text fontSize={13}>{e.message}</Text> : undefined}
                  actions={
                    <>
                      <GButton variant="ghost" onPress={() => void setStatus(e.id, 'new')}>
                        New
                      </GButton>
                      <GButton
                        variant="ghost"
                        onPress={() => void setStatus(e.id, 'in_progress')}
                      >
                        In progress
                      </GButton>
                      <GButton variant="ghost" onPress={() => void setStatus(e.id, 'closed')}>
                        Closed
                      </GButton>
                      {e.customer_id ? (
                        <Link href="/studio/admin/customers">
                          <Text color="$accent" fontSize={13}>
                            Customer →
                          </Text>
                        </Link>
                      ) : null}
                    </>
                  }
                />
              ))
            : null}

          <YStack marginTop="$6">
            <Link href="/studio/admin">
              <Text color="$accent">← Dashboard</Text>
            </Link>
          </YStack>
        </Container>
      </GPage>
    </StudioGate>
  )
}
