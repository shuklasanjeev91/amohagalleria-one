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

export type Enquiry = {
  id: string
  customer_id: string | null
  user_id: string | null
  email: string
  name: string | null
  phone: string | null
  message: string | null
  status: 'new' | 'in_progress' | 'closed'
  artwork_ids: string[]
  created_at: string
}

export type CartItem = {
  id: string
  artwork_id: string
  created_at: string
  title?: string | null
  artist_name?: string | null
  image_url?: string | null
  slug?: string | null
}

const SESSION_KEY = 'amoha_enquiry_session'

export function getEnquirySessionKey(): string {
  if (typeof window === 'undefined') return 'server'
  try {
    let key = localStorage.getItem(SESSION_KEY)
    if (!key) {
      key =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem(SESSION_KEY, key)
    }
    return key
  } catch {
    return `tmp-${Date.now()}`
  }
}

export async function listCart(): Promise<CartItem[]> {
  if (!isSupabaseConfigured) return []
  const sb = getSupabase()
  if (!sb) return []

  const {
    data: { user },
  } = await sb.auth.getUser()

  let query = sb
    .from('enquiry_cart_items')
    .select(
      'id, artwork_id, created_at, artworks(title, slug, artwork_images(image_url, is_primary), artists(artist_name))',
    )
    .order('created_at', { ascending: false })

  if (user) {
    query = query.eq('user_id', user.id)
  } else {
    query = query.eq('session_key', getEnquirySessionKey())
  }

  const { data } = await query
  return (data || []).map((row: any) => {
    const imgs = (row.artworks?.artwork_images || []) as { image_url: string; is_primary: boolean }[]
    const primary = imgs.find((i) => i.is_primary) || imgs[0]
    return {
      id: row.id as string,
      artwork_id: row.artwork_id as string,
      created_at: row.created_at as string,
      title: row.artworks?.title ?? null,
      slug: row.artworks?.slug ?? null,
      artist_name: row.artworks?.artists?.artist_name ?? null,
      image_url: primary?.image_url ?? null,
    }
  })
}

export async function addToCart(artworkId: string) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }

  const {
    data: { user },
  } = await sb.auth.getUser()

  const payload = user
    ? { user_id: user.id, artwork_id: artworkId, session_key: null }
    : { user_id: null, session_key: getEnquirySessionKey(), artwork_id: artworkId }

  const { error } = await sb.from('enquiry_cart_items').upsert(payload, {
    onConflict: user ? 'user_id,artwork_id' : 'session_key,artwork_id',
    ignoreDuplicates: true,
  })

  // Partial unique indexes may not work with onConflict — fallback insert
  if (error) {
    const { error: insertErr } = await sb.from('enquiry_cart_items').insert(payload)
    if (insertErr && !/duplicate|unique/i.test(insertErr.message)) {
      return { ok: false as const, error: insertErr.message }
    }
  }
  return { ok: true as const }
}

export async function removeFromCart(itemId: string) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const { error } = await sb.from('enquiry_cart_items').delete().eq('id', itemId)
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}

export async function clearCart() {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const {
    data: { user },
  } = await sb.auth.getUser()
  let q = sb.from('enquiry_cart_items').delete()
  if (user) q = q.eq('user_id', user.id)
  else q = q.eq('session_key', getEnquirySessionKey())
  const { error } = await q
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}

/** Merge anonymous session cart into signed-in user cart. */
export async function mergeCartOnLogin() {
  const sb = getSupabase()
  if (!sb) return
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return
  const sessionKey = getEnquirySessionKey()
  const { data: anonItems } = await sb
    .from('enquiry_cart_items')
    .select('artwork_id')
    .eq('session_key', sessionKey)
  for (const item of anonItems || []) {
    await sb.from('enquiry_cart_items').upsert(
      { user_id: user.id, artwork_id: item.artwork_id, session_key: null },
      { ignoreDuplicates: true },
    )
  }
  await sb.from('enquiry_cart_items').delete().eq('session_key', sessionKey)
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

  let artworkIds = input.artworkIds
  if (!artworkIds?.length) {
    const cart = await listCart()
    artworkIds = cart.map((c) => c.artwork_id)
  }

  const { data, error } = await sb.rpc('submit_enquiry', {
    p_email: input.email.trim(),
    p_name: input.name?.trim() || null,
    p_phone: input.phone?.trim() || null,
    p_message: input.message?.trim() || null,
    p_artwork_ids: artworkIds || [],
    p_session_key: user ? null : getEnquirySessionKey(),
    p_source: input.source || 'enquiry',
  })

  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const, id: data as string }
}

export async function adminListCustomers(): Promise<Customer[]> {
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

export async function adminListEnquiries(): Promise<Enquiry[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data } = await sb
    .from('enquiries')
    .select('id, customer_id, user_id, email, name, phone, message, status, artwork_ids, created_at')
    .order('created_at', { ascending: false })
  return (data || []) as Enquiry[]
}

export async function adminUpdateEnquiryStatus(
  id: string,
  status: 'new' | 'in_progress' | 'closed',
) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const { error } = await sb.rpc('admin_update_enquiry_status', {
    target: id,
    new_status: status,
  })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}
