import type { Artist, Artwork, Catalogue } from './amoha'
import { getSupabase, isSupabaseConfigured } from './supabase'
import type { GalleryRole } from './auth'
import { runtimeBag } from './runtimeCache'

export type StudioArtwork = {
  id: string
  artist_id: string
  title: string
  about_artwork: string | null
  medium_id: string | null
  collection_id: string | null
  year: number | null
  status: 'draft' | 'pending' | 'published' | 'rejected'
  slug: string | null
  is_available: boolean | null
  image_url?: string | null
  medium_name?: string | null
  created_at?: string
}

export type StudioArtist = {
  id: string
  user_id: string
  artist_name: string
  profile_photo: string | null
  profile_details: string | null
  address: string | null
  is_approved: boolean
  slug: string | null
  instagram: string | null
  website: string | null
}

export type StudioUserRow = {
  id: string
  email: string | null
  full_name: string | null
  role: GalleryRole | string | null
  avatar_url?: string | null
}

/** Normalize legacy CMS roles (`user`) to gallery roles. */
export function normalizeGalleryRole(role: string | null | undefined): GalleryRole {
  if (role === 'admin' || role === 'artist' || role === 'collector') return role
  if (role === 'user') return 'collector'
  return 'collector'
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'item'
  )
}

function mapStudioArtist(row: StudioArtist, workCount: number): Artist {
  const slug = row.slug || `${slugify(row.artist_name)}-${row.id.slice(0, 6)}`
  const bio = row.profile_details ? [row.profile_details] : []
  return {
    slug,
    id: row.id,
    name: row.artist_name,
    attributed: true,
    portrait: row.profile_photo,
    location: row.address,
    bio,
    short: bio[0]?.slice(0, 140) || '',
    disciplines: [],
    discipline: '',
    workCount,
  }
}

function mapStudioArtwork(
  row: StudioArtwork,
  artist: StudioArtist | undefined,
  image: string,
): Artwork {
  const slug = row.slug || `${slugify(row.title)}-${row.id.slice(0, 6)}`
  const about = row.about_artwork ? [row.about_artwork] : []
  return {
    slug,
    id: row.id,
    title: row.title,
    artistSlug: artist?.slug || (artist ? `${slugify(artist.artist_name)}-${artist.id.slice(0, 6)}` : 'studio'),
    artistName: artist?.artist_name || 'Studio artist',
    category: row.medium_name || 'Studio',
    image,
    year: row.year ? String(row.year) : '',
    opens: '',
    closes: '',
    dateLabel: row.year ? String(row.year) : '',
    location: artist?.address || null,
    about,
    summary: about[0] || '',
  }
}

/** Published studio catalogue for public hybrid merge (anon-safe). */
const STUDIO_TTL_MS = 60_000

type StudioRuntime = {
  cache: { at: number; value: { artists: Artist[]; artworks: Artwork[] } } | null
  inflight: Promise<{ artists: Artist[]; artworks: Artwork[] }> | null
}

function studioRuntime(): StudioRuntime {
  const bag = runtimeBag()
  if (!bag.studio) {
    bag.studio = { cache: null, inflight: null } satisfies StudioRuntime
  }
  return bag.studio as StudioRuntime
}

export async function fetchPublishedCatalogue(): Promise<{
  artists: Artist[]
  artworks: Artwork[]
}> {
  if (!isSupabaseConfigured) return { artists: [], artworks: [] }
  const rt = studioRuntime()
  if (rt.cache && Date.now() - rt.cache.at < STUDIO_TTL_MS) {
    return rt.cache.value
  }
  if (rt.inflight) return rt.inflight

  const sb = getSupabase()
  if (!sb) return { artists: [], artworks: [] }

  rt.inflight = (async () => {
    try {
      const [{ data: artistsRaw }, { data: worksRaw }] = await Promise.all([
        sb.from('artists').select('*').eq('is_approved', true),
        sb.from('artworks').select('*, medium:medium_id(name)').eq('status', 'published'),
      ])

      const artistsRows = (artistsRaw || []) as StudioArtist[]
      const artistById = new Map(artistsRows.map((a) => [a.id, a]))

      const workIds = (worksRaw || []).map((w: any) => w.id)
      const imagesByWork = new Map<string, string>()
      if (workIds.length) {
        const { data: imgs } = await sb
          .from('artwork_images')
          .select('artwork_id, image_url, is_primary, sort_order')
          .in('artwork_id', workIds)
          .order('sort_order', { ascending: true })
        for (const img of imgs || []) {
          if (!imagesByWork.has(img.artwork_id) || img.is_primary) {
            imagesByWork.set(img.artwork_id, img.image_url)
          }
        }
      }

      const artworks: Artwork[] = []
      const counts = new Map<string, number>()
      for (const w of worksRaw || []) {
        const artist = artistById.get(w.artist_id)
        if (!artist) continue
        const image = imagesByWork.get(w.id)
        if (!image) continue
        const mapped = mapStudioArtwork(
          {
            ...w,
            medium_name: w.medium?.name || null,
          },
          artist,
          image,
        )
        artworks.push(mapped)
        counts.set(artist.id, (counts.get(artist.id) || 0) + 1)
      }

      const artists = artistsRows
        .filter((a) => (counts.get(a.id) || 0) > 0 || a.is_approved)
        .map((a) => mapStudioArtist(a, counts.get(a.id) || 0))

      const value = { artists, artworks }
      rt.cache = { at: Date.now(), value }
      return value
    } finally {
      rt.inflight = null
    }
  })()

  return rt.inflight
}

export function invalidateStudioCatalogue() {
  const rt = studioRuntime()
  rt.cache = null
  rt.inflight = null
  // Merge cache depends on studio publish set — clear without importing catalogue (cycle).
  const merge = runtimeBag().merge as { cache: null; inflight: null } | undefined
  if (merge) {
    merge.cache = null
    merge.inflight = null
  }
}

export async function getMyArtist(): Promise<StudioArtist | null> {
  const sb = getSupabase()
  if (!sb) return null
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return null
  const { data } = await sb.from('artists').select('*').eq('user_id', user.id).maybeSingle()
  return (data as StudioArtist) || null
}

export async function updateMyArtistProfile(input: {
  artist_name: string
  profile_details?: string
  address?: string
  instagram?: string
  website?: string
  profile_photo?: string | null
}) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not signed in' }

  const artist = await getMyArtist()
  const slug = `${slugify(input.artist_name)}-${user.id.slice(0, 6)}`
  const payload = {
    user_id: user.id,
    artist_name: input.artist_name.trim(),
    profile_details: input.profile_details?.trim() || null,
    address: input.address?.trim() || null,
    instagram: input.instagram?.trim() || null,
    website: input.website?.trim() || null,
    profile_photo: input.profile_photo ?? artist?.profile_photo ?? null,
    slug: artist?.slug || slug,
    updated_at: new Date().toISOString(),
  }

  if (artist) {
    const { error } = await sb.from('artists').update(payload).eq('id', artist.id)
    if (error) return { ok: false as const, error: error.message }
  } else {
    const { error } = await sb.from('artists').insert({ ...payload, is_approved: false })
    if (error) return { ok: false as const, error: error.message }
  }

  await sb.from('profiles').upsert(
    {
      id: user.id,
      email: user.email,
      full_name: input.artist_name.trim(),
      bio: input.profile_details?.trim() || null,
      location: input.address?.trim() || null,
      avatar_url: input.profile_photo ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )

  return { ok: true as const }
}

export async function listMyArtworks(): Promise<StudioArtwork[]> {
  const sb = getSupabase()
  if (!sb) return []
  const artist = await getMyArtist()
  if (!artist) return []
  const { data } = await sb
    .from('artworks')
    .select('*, medium:medium_id(name), artwork_images(image_url, is_primary, sort_order)')
    .eq('artist_id', artist.id)
    .order('created_at', { ascending: false })
  return (data || []).map((w: any) => {
    const imgs = (w.artwork_images || []).sort(
      (a: any, b: any) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    )
    return {
      ...w,
      medium_name: w.medium?.name || null,
      image_url: imgs[0]?.image_url || null,
    } as StudioArtwork
  })
}

export async function listMediums() {
  const sb = getSupabase()
  if (!sb) return [] as { id: string; name: string }[]
  const { data } = await sb.from('medium').select('id, name').order('name')
  return (data || []) as { id: string; name: string }[]
}

export async function listCollections() {
  const sb = getSupabase()
  if (!sb) return [] as { id: string; name: string }[]
  const { data } = await sb.from('collections').select('id, name').order('name')
  return (data || []) as { id: string; name: string }[]
}

export async function uploadStudioImage(file: File | Blob, folder: 'avatars' | 'artworks') {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return { ok: false as const, error: 'Not signed in' }

  const ext =
    (file as File).name?.split('.').pop()?.toLowerCase() ||
    (file.type?.includes('png') ? 'png' : 'jpg')
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await sb.storage.from(folder).upload(path, file, {
    upsert: true,
    contentType: file.type || 'image/jpeg',
  })
  if (error) return { ok: false as const, error: error.message }
  const { data } = sb.storage.from(folder).getPublicUrl(path)
  return { ok: true as const, url: data.publicUrl, path }
}

export async function createArtwork(input: {
  title: string
  about?: string
  year?: string
  medium_id?: string
  collection_id?: string
  image_url: string
  status?: 'draft' | 'pending'
}) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const artist = await getMyArtist()
  if (!artist) return { ok: false as const, error: 'Artist profile required' }
  if (!artist.is_approved) {
    return { ok: false as const, error: 'Your artist account is awaiting admin approval.' }
  }

  const status = input.status || 'pending'
  const slug = `${slugify(input.title)}-${Date.now().toString(36)}`
  const { data, error } = await sb
    .from('artworks')
    .insert({
      artist_id: artist.id,
      title: input.title.trim(),
      about_artwork: input.about?.trim() || null,
      year: input.year ? Number(input.year) || null : null,
      medium_id: input.medium_id || null,
      collection_id: input.collection_id || null,
      status,
      is_available: false,
      slug,
      height: 0,
      width: 0,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false as const, error: error?.message || 'Create failed' }

  const { error: imgErr } = await sb.from('artwork_images').insert({
    artwork_id: data.id,
    image_url: input.image_url,
    is_primary: true,
    sort_order: 0,
  })
  if (imgErr) return { ok: false as const, error: imgErr.message }
  invalidateStudioCatalogue()
  return { ok: true as const, id: data.id as string }
}

export async function updateArtwork(
  id: string,
  input: {
    title?: string
    about?: string
    year?: string
    medium_id?: string | null
    collection_id?: string | null
    image_url?: string
    status?: 'draft' | 'pending' | 'published' | 'rejected'
  },
) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }

  const patch: Record<string, unknown> = {}
  if (input.title != null) patch.title = input.title.trim()
  if (input.about != null) patch.about_artwork = input.about.trim() || null
  if (input.year != null) patch.year = input.year ? Number(input.year) || null : null
  if (input.medium_id !== undefined) patch.medium_id = input.medium_id
  if (input.collection_id !== undefined) patch.collection_id = input.collection_id
  if (input.status) {
    patch.status = input.status
    patch.is_available = input.status === 'published'
  }

  const { error } = await sb.from('artworks').update(patch).eq('id', id)
  if (error) return { ok: false as const, error: error.message }

  if (input.image_url) {
    await sb.from('artwork_images').delete().eq('artwork_id', id)
    await sb.from('artwork_images').insert({
      artwork_id: id,
      image_url: input.image_url,
      is_primary: true,
      sort_order: 0,
    })
  }
  invalidateStudioCatalogue()
  return { ok: true as const }
}

export async function getArtwork(id: string): Promise<StudioArtwork | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb
    .from('artworks')
    .select('*, medium:medium_id(name), artwork_images(image_url, is_primary, sort_order)')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  const imgs = (data.artwork_images || []).sort(
    (a: any, b: any) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  )
  return {
    ...data,
    medium_name: data.medium?.name || null,
    image_url: imgs[0]?.image_url || null,
  } as StudioArtwork
}

export async function adminListUsers(): Promise<StudioUserRow[]> {
  const sb = getSupabase()
  if (!sb) return []

  // Canonical roles live on profiles (collector | artist | admin).
  const { data: profiles, error } = await sb
    .from('profiles')
    .select('id, email, full_name, role, avatar_url')
    .order('updated_at', { ascending: false })

  if (!error && profiles?.length) {
    return profiles.map((row) => ({
      ...row,
      role: normalizeGalleryRole(row.role),
    })) as StudioUserRow[]
  }

  // Fallback: legacy CMS table (role "user" = collector)
  const { data } = await sb
    .from('user_profiles')
    .select('id, email, full_name, role, avatar_url')
    .order('created_at', { ascending: false })
  return (data || []).map((row) => ({
    ...row,
    role: normalizeGalleryRole(row.role),
  })) as StudioUserRow[]
}

export async function adminSetRole(userId: string, role: GalleryRole) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const { error } = await sb.rpc('admin_set_role', { target: userId, new_role: role })
  if (error) return { ok: false as const, error: error.message }
  return { ok: true as const }
}

export async function adminListArtworks(): Promise<StudioArtwork[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data } = await sb
    .from('artworks')
    .select('*, medium:medium_id(name), artwork_images(image_url, is_primary, sort_order), artists(artist_name)')
    .order('created_at', { ascending: false })
  return (data || []).map((w: any) => {
    const imgs = (w.artwork_images || []).sort(
      (a: any, b: any) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    )
    return {
      ...w,
      medium_name: w.medium?.name || null,
      image_url: imgs[0]?.image_url || null,
    } as StudioArtwork
  })
}

export async function adminSetArtworkStatus(
  id: string,
  status: 'draft' | 'pending' | 'published' | 'rejected',
) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const { error } = await sb.rpc('admin_set_artwork_status', {
    target: id,
    new_status: status,
  })
  if (error) return { ok: false as const, error: error.message }
  invalidateStudioCatalogue()
  return { ok: true as const }
}

export async function adminListArtists(): Promise<StudioArtist[]> {
  const sb = getSupabase()
  if (!sb) return []
  const { data } = await sb.from('artists').select('*').order('updated_at', { ascending: false })
  return (data || []) as StudioArtist[]
}

export async function adminUpsertArtist(input: {
  id?: string
  user_id?: string | null
  artist_name: string
  profile_details?: string
  address?: string
  instagram?: string
  website?: string
  profile_photo?: string | null
  is_approved?: boolean
  slug?: string
}) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const { data, error } = await sb.rpc('admin_upsert_artist', {
    p_id: input.id || null,
    p_user_id: input.user_id ?? null,
    p_artist_name: input.artist_name,
    p_profile_details: input.profile_details ?? null,
    p_address: input.address ?? null,
    p_instagram: input.instagram ?? null,
    p_website: input.website ?? null,
    p_profile_photo: input.profile_photo ?? null,
    p_is_approved: input.is_approved ?? null,
    p_slug: input.slug ?? null,
  })
  if (error) return { ok: false as const, error: error.message }
  invalidateStudioCatalogue()
  return { ok: true as const, id: data as string }
}

export async function adminDeleteArtist(id: string) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const { error } = await sb.rpc('admin_delete_artist', { target: id })
  if (error) return { ok: false as const, error: error.message }
  invalidateStudioCatalogue()
  return { ok: true as const }
}

export async function adminDeleteArtwork(id: string) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const { error } = await sb.rpc('admin_delete_artwork', { target: id })
  if (error) return { ok: false as const, error: error.message }
  invalidateStudioCatalogue()
  return { ok: true as const }
}

export async function deleteOwnArtwork(id: string) {
  const sb = getSupabase()
  if (!sb) return { ok: false as const, error: 'Supabase not configured' }
  const { error } = await sb.rpc('delete_own_artwork', { target: id })
  if (error) return { ok: false as const, error: error.message }
  invalidateStudioCatalogue()
  return { ok: true as const }
}

export async function adminDashboardCounts() {
  const sb = getSupabase()
  if (!sb) return { artists: 0, artworks: 0, customers: 0, enquiries: 0, pendingWorks: 0 }
  const [artists, artworks, customers, enquiries, pending] = await Promise.all([
    sb.from('artists').select('id', { count: 'exact', head: true }),
    sb.from('artworks').select('id', { count: 'exact', head: true }),
    sb.from('customers').select('id', { count: 'exact', head: true }),
    sb.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    sb.from('artworks').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  return {
    artists: artists.count || 0,
    artworks: artworks.count || 0,
    customers: customers.count || 0,
    enquiries: enquiries.count || 0,
    pendingWorks: pending.count || 0,
  }
}

export function mergeCatalogue(
  remote: Catalogue,
  studio: { artists: Artist[]; artworks: Artwork[] },
): Catalogue {
  const artworksBySlug = new Map<string, Artwork>()
  for (const w of remote.artworks) artworksBySlug.set(w.slug, w)
  for (const w of studio.artworks) artworksBySlug.set(w.slug, w)

  const artistsBySlug = new Map<string, Artist>()
  for (const a of remote.artists) artistsBySlug.set(a.slug, a)
  for (const a of studio.artists) artistsBySlug.set(a.slug, { ...a })

  const artworks = [...artworksBySlug.values()]
  const counts = new Map<string, number>()
  for (const w of artworks) {
    counts.set(w.artistSlug, (counts.get(w.artistSlug) || 0) + 1)
  }
  const artists = [...artistsBySlug.values()].map((a) => ({
    ...a,
    workCount: counts.get(a.slug) ?? a.workCount,
  }))

  const categories = [...new Set(artworks.map((w) => w.category).filter(Boolean))].sort()
  const countries = [
    ...new Set(
      [...artists.map((a) => a.location), ...artworks.map((w) => w.location)].filter(
        Boolean,
      ) as string[],
    ),
  ].sort()

  return {
    ...remote,
    artworks,
    artists,
    categories,
    countries,
    ok: remote.ok || artworks.length > 0,
  }
}
