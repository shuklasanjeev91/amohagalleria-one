import type { Session, User } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import { getSupabase } from './supabase'

export type GalleryRole = 'collector' | 'artist' | 'admin'

export type GalleryUser = {
  id: string
  name: string
  email: string
  role: GalleryRole
  slug?: string | null
  avatarUrl?: string | null
  bio?: string | null
  location?: string | null
  discipline?: string | null
  signedInAt: string
}

export function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function validateOtp(token: string) {
  return /^\d{6}$/.test(token.trim())
}

function displayNameFromUser(user: User | null | undefined, fallbackEmail?: string) {
  const meta = user?.user_metadata || {}
  const name =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name === 'string' && meta.name) ||
    ''
  if (name.trim()) return name.trim()
  const email = user?.email || fallbackEmail || ''
  return email.split('@')[0] || 'Collector'
}

function roleFromUser(user: User | null | undefined, profileRole?: string | null): GalleryRole {
  const fromApp = user?.app_metadata?.role
  if (fromApp === 'admin' || fromApp === 'artist' || fromApp === 'collector') return fromApp
  if (fromApp === 'user') return 'collector'
  if (profileRole === 'admin' || profileRole === 'artist' || profileRole === 'collector') {
    return profileRole
  }
  if (profileRole === 'user') return 'collector'
  return 'collector'
}

export function userFromSession(
  session: Session | null,
  profile?: Partial<GalleryUser> | null,
): GalleryUser | null {
  if (!session?.user) return null
  const u = session.user
  return {
    id: u.id,
    name: profile?.name || displayNameFromUser(u),
    email: u.email || profile?.email || '',
    role: roleFromUser(u, profile?.role),
    slug: profile?.slug ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    bio: profile?.bio ?? null,
    location: profile?.location ?? null,
    discipline: profile?.discipline ?? null,
    signedInAt: u.last_sign_in_at || u.created_at || new Date().toISOString(),
  }
}

function notifyAuth() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('amoha-auth'))
  }
}

async function loadProfile(userId: string): Promise<Partial<GalleryUser> | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb
    .from('profiles')
    .select('full_name, email, role, slug, avatar_url, bio, location, discipline')
    .eq('id', userId)
    .maybeSingle()
  if (!data) return null
  return {
    name: data.full_name || undefined,
    email: data.email || undefined,
    role: (data.role as GalleryRole) || undefined,
    slug: data.slug,
    avatarUrl: data.avatar_url,
    bio: data.bio,
    location: data.location,
    discipline: data.discipline,
  }
}

export async function syncProfile(opts?: { fullName?: string }) {
  const sb = getSupabase()
  if (!sb) return
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return

  const fullName = opts?.fullName?.trim() || displayNameFromUser(user)
  const role = roleFromUser(user)
  const { error } = await sb.from('profiles').upsert(
    {
      id: user.id,
      email: user.email,
      full_name: fullName,
      role,
      is_public: role === 'artist' || role === 'admin',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  )
  if (error) {
    console.warn('[auth] syncProfile failed', error.message)
  }
}

/**
 * Send email OTP. Always auto-registers unknown emails (shouldCreateUser: true).
 * New users get a collector profile via DB trigger + syncProfile after verify.
 */
export async function sendEmailOtp(
  email: string,
  opts?: { fullName?: string },
) {
  const sb = getSupabase()
  if (!sb) {
    return {
      ok: false as const,
      error: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
    }
  }

  const normalized = email.trim().toLowerCase()
  if (!validateEmail(normalized)) {
    return { ok: false as const, error: 'Enter a valid email address.' }
  }

  const fullName = opts?.fullName?.trim()
  const { error } = await sb.auth.signInWithOtp({
    email: normalized,
    options: {
      // Auto-create auth.users for first-time emails (login or register)
      shouldCreateUser: true,
      data: fullName
        ? { full_name: fullName, name: fullName }
        : { full_name: normalized.split('@')[0], name: normalized.split('@')[0] },
    },
  })

  if (error) {
    const msg = error.message || 'Could not send code'
    // Friendlier copy when project has sign-ups disabled in dashboard
    if (/signups? not allowed|signup is disabled|signups disabled/i.test(msg)) {
      return {
        ok: false as const,
        error:
          'New sign-ups are disabled in Supabase Auth. Enable “Allow new users to sign up” under Authentication → Providers → Email.',
      }
    }
    return { ok: false as const, error: msg }
  }
  return { ok: true as const, email: normalized }
}

export async function verifyEmailOtp(
  email: string,
  token: string,
  opts?: { fullName?: string },
) {
  const sb = getSupabase()
  if (!sb) {
    return {
      ok: false as const,
      error: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.',
    }
  }

  const normalized = email.trim().toLowerCase()
  const code = token.trim()
  if (!validateEmail(normalized)) {
    return { ok: false as const, error: 'Enter a valid email address.' }
  }
  if (!validateOtp(code)) {
    return { ok: false as const, error: 'Enter the 6-digit code from your email.' }
  }

  const { data, error } = await sb.auth.verifyOtp({
    email: normalized,
    token: code,
    type: 'email',
  })

  if (error) return { ok: false as const, error: error.message }

  if (opts?.fullName?.trim() && data.user) {
    await sb.auth.updateUser({
      data: { full_name: opts.fullName.trim(), name: opts.fullName.trim() },
    })
  }

  await syncProfile({ fullName: opts?.fullName })
  const profile = data.user ? await loadProfile(data.user.id) : null
  notifyAuth()

  return {
    ok: true as const,
    session: data.session,
    user: userFromSession(data.session, profile),
  }
}

export async function signOut() {
  const sb = getSupabase()
  if (sb) await sb.auth.signOut()
  notifyAuth()
}

export async function getCurrentUser(): Promise<GalleryUser | null> {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  if (!data.session?.user) return null
  return enrichSession(data.session)
}

/** Profile enrich for an already-known session (avoids a second getSession). */
export async function enrichSession(session: Session): Promise<GalleryUser | null> {
  if (!session?.user) return null
  const profile = await loadProfile(session.user.id)
  return userFromSession(session, profile)
}

// Prefer importing useGalleryAuth / AuthProvider from ~/lib/AuthProvider

export function readAuth(): GalleryUser | null {
  return null
}

export function writeAuth(_user: GalleryUser) {
  /* replaced by Supabase session */
}

export function clearAuth() {
  void signOut()
}
