import { createClient } from '@supabase/supabase-js'
import { isLocalEnvironment } from './envUtils'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Log configuration in local development
if (isLocalEnvironment()) {
  console.log('🔧 Supabase Configuration:', {
    url: supabaseUrl,
    environment: import.meta.env.VITE_ENVIRONMENT || 'auto-detected',
    isDev: import.meta.env.DEV,
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Extend session duration to 7 days (best practice for web apps)
    // This reduces the need for frequent re-authentication
    persistSession: true,
    autoRefreshToken: true,
    // SECURITY: Enable URL detection but handle token clearing in AuthCallback
    // This allows Supabase to process tokens while we immediately clear them
    detectSessionInUrl: true,
    // Prefer authorization code flow over implicit flow for better security
    flowType: 'pkce',
    // Set longer session timeout - 7 days instead of default 1 hour
    // This is especially important for mobile users
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'thirstee-auth-token',
    // Enable debug mode in development and local environments
    debug: import.meta.env.DEV || isLocalEnvironment()
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
      'X-Client-Info': `thirstee-web-app-${isLocalEnvironment() ? 'local' : 'prod'}`
    }
  }
})