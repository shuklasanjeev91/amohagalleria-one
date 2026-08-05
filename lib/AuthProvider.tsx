import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import {
  enrichSession,
  signOut as authSignOut,
  userFromSession,
  type GalleryUser,
} from './auth'
import { warmCatalogueCache } from './catalogue'
import { getSupabase, isSupabaseConfigured } from './supabase'

type AuthContextValue = {
  user: GalleryUser | null
  loading: boolean
  configured: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
  isArtist: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GalleryUser | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const configured = isSupabaseConfigured

  const refresh = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) {
      setUser(null)
      setLoading(false)
      return
    }
    const { data } = await sb.auth.getSession()
    if (!data.session) {
      setUser(null)
      setLoading(false)
      return
    }
    setUser(userFromSession(data.session))
    setLoading(false)
    const full = await enrichSession(data.session)
    if (full) setUser(full)
  }, [])

  useEffect(() => {
    // Warm shared catalogue cache so the first bottom-tab click is not cold.
    warmCatalogueCache()

    const sb = getSupabase()
    if (!sb) {
      setLoading(false)
      return
    }

    let mounted = true

    // Instant: session from storage, then enrich profile once
    void sb.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      if (data.session) {
        setUser(userFromSession(data.session))
        setLoading(false)
        const full = await enrichSession(data.session)
        if (mounted && full) setUser(full)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return
      if (!session) {
        setUser(null)
        setLoading(false)
        return
      }
      setUser(userFromSession(session))
      setLoading(false)
      void enrichSession(session).then((full) => {
        if (mounted && full) setUser(full)
      })
    })

    const onCustom = () => {
      void refresh()
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('amoha-auth', onCustom)
    }

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('amoha-auth', onCustom)
      }
    }
  }, [refresh])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured,
      refresh,
      signOut: async () => {
        await authSignOut()
        setUser(null)
      },
      isArtist: user?.role === 'artist',
      isAdmin: user?.role === 'admin',
    }),
    [user, loading, configured, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useGalleryAuth() {
  const ctx = useContext(AuthContext)
  if (ctx) return ctx

  // Fallback if used outside provider (shouldn't happen in app shell)
  return {
    user: null,
    loading: false,
    configured: isSupabaseConfigured,
    refresh: async () => {},
    signOut: async () => {
      await authSignOut()
    },
    isArtist: false,
    isAdmin: false,
  }
}
