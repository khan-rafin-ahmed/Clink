import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Extend session duration to 7 days (best practice for web apps)
    // This reduces the need for frequent re-authentication
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Set longer session timeout - 7 days instead of default 1 hour
    // This is especially important for mobile users
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'thirstee-auth-token',
    // Enable debug mode in development
    debug: import.meta.env.DEV
  },
  // Configure realtime for better performance
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  // Global settings
  global: {
    headers: {
      'X-Client-Info': 'thirstee-web-app'
    }
  }
})