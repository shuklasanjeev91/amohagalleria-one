import { Link } from 'one'
import { useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import { Text, YStack } from 'tamagui'
import { AdminDataGrid } from '~/components/gallery/AdminDataGrid'
import {
  GBanner,
  GButton,
  GField,
  GPage,
} from '~/components/gallery/GControls'
import { PageHeader } from '~/components/gallery/PageHeader'
import { StudioGate, StudioNav } from '~/components/gallery/StudioShell'
import { Container, LabelCaps } from '~/components/gallery/primitives'
import {
  adminListCustomers,
  adminUpdateCustomer,
  type Customer,
} from '~/lib/enquiries'

export const sitemap = { exclude: true }

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Customer | null>(null)
  const [notes, setNotes] = useState('')
  const [phone, setPhone] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setCustomers(await adminListCustomers())
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) =>
      [c.full_name, c.email, c.phone, c.source]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    )
  }, [customers, search])

  function startEdit(c: Customer) {
    setEditing(c)
    setNotes(c.notes || '')
    setPhone(c.phone || '')
    setMsg(null)
    setErr(null)
  }

  async function save() {
    if (!editing) return
    setErr(null)
    const res = await adminUpdateCustomer(editing.id, {
      notes,
      phone,
      full_name: editing.full_name || undefined,
    })
    if (!res.ok) {
      setErr(res.error)
      return
    }
    setMsg('Customer updated')
    setEditing(null)
    await refresh()
  }

  return (
    <StudioGate requireAdmin>
      <GPage>
        <PageHeader
          eyebrow="Admin"
          title="Customers"
          lede="Visited collectors and contact leads."
        />
        <Container className="g-container" pb="$20" width="100%">
          <StudioNav active="customers" />
          {err ? <GBanner tone="error">{err}</GBanner> : null}
          {msg ? <GBanner tone="success">{msg}</GBanner> : null}

          {editing ? (
            <YStack
              className="g-admin-grid__panel"
              gap="$2"
              marginBottom="$6"
              padding="$4"
              borderWidth={1}
              borderColor="$borderColor"
              maxWidth={560}
            >
              <LabelCaps color="$accent">Edit {editing.email}</LabelCaps>
              <GField label="Phone" value={phone} onChangeText={setPhone} />
              <GField
                label="Notes"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
              <YStack flexDirection="row" gap="$3" flexWrap="wrap">
                <GButton onPress={() => void save()}>Save</GButton>
                <GButton variant="ghost" onPress={() => setEditing(null)}>
                  Cancel
                </GButton>
              </YStack>
            </YStack>
          ) : null}

          <AdminDataGrid
            title="Customer directory"
            rows={filtered}
            loading={loading}
            getRowId={(c) => c.id}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search name, email…"
            emptyLabel="No customers yet."
            columns={[
              {
                key: 'name',
                header: 'Name',
                listPrimary: true,
                render: (c) => c.full_name || '—',
              },
              {
                key: 'email',
                header: 'Email',
                listMeta: true,
                render: (c) => c.email,
              },
              {
                key: 'phone',
                header: 'Phone',
                render: (c) => c.phone || '—',
              },
              {
                key: 'source',
                header: 'Source',
                listStatus: true,
                render: (c) => c.source || '—',
              },
              {
                key: 'seen',
                header: 'Last seen',
                listHide: true,
                render: (c) => new Date(c.last_seen_at).toLocaleDateString(),
              },
              {
                key: 'actions',
                header: '',
                width: '100px',
                render: (c) =>
                  Platform.OS === 'web' ? (
                    <button type="button" onClick={() => startEdit(c)}>
                      Edit
                    </button>
                  ) : (
                    <Text color="$accent" fontSize={13} onPress={() => startEdit(c)}>
                      Edit
                    </Text>
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
