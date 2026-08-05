import { getSupabase, isSupabaseConfigured } from './supabase'

export type Customer = {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  source: string | null
  notes: string | null
  last_seen_at: string
  created_at: string
}

export async function submitEnquiry(input: {
  email: string
  name?: string
  phone?: string
  message?: string
  artworkIds?: string[]
  source?: string
}) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }

  const {
    data: { user },
  } = await sb.auth.getUser()

  const { data, error } = await sb.rpc('submit_enquiry', {
    p_email: input.email.trim(),
    p_name: input.name?.trim() || null,
    p_phone: input.phone?.trim() || null,
    p_message: input.message?.trim() || null,
    p_artwork_ids: input.artworkIds || [],
    p_session_key: user ? null : null,
    p_source: input.source || 'contact',
  })

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, id: data as string }
}

export async function adminListCustomers(): Promise<Customer[]> {
  if (!isSupabaseConfigured) return []
  const sb = getSupabase()
  if (!sb) return []
  const { data } = await sb
    .from('customers')
    .select('id, email, full_name, phone, source, notes, last_seen_at, created_at')
    .order('last_seen_at', { ascending: false })
  return (data || []) as Customer[]
}

export async function adminUpdateCustomer(
  id: string,
  patch: { full_name?: string; phone?: string; notes?: string; source?: string },
) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const { error } = await sb.rpc('admin_update_customer', {
    target: id,
    p_full_name: patch.full_name ?? null,
    p_phone: patch.phone ?? null,
    p_notes: patch.notes ?? null,
    p_source: patch.source ?? null,
  })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}
