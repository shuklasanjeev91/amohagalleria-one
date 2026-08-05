import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

function readEnv(key: string): string {
  try {
    const meta = (import.meta as ImportMeta & { env?: Record<string, string> }).env
    if (meta?.[key]) return String(meta[key]).trim()
  } catch {
    /* native may not have import.meta.env */
  }
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return String(process.env[key]).trim()
  }
  return ''
}

const supabaseUrl =
  readEnv('VITE_SUPABASE_URL') || readEnv('EXPO_PUBLIC_SUPABASE_URL')
const supabaseAnonKey =
  readEnv('VITE_SUPABASE_ANON_KEY') || readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY')

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let client: SupabaseClient | null = null

/** Browser / app Supabase client (anon key only — never service role). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    })
  }
  return client
}

export function requireSupabase(): SupabaseClient {
  const sb = getSupabase()
  if (!sb) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env',
    )
  }
  return sb
}
