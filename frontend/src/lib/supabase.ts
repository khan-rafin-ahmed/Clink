import { createClient } from '@supabase/supabase-js'
import { isLocalEnvironment } from './envUtils'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Disable configuration logging to reduce console noise
// if (isLocalEnvironment()) {
//   console.log('🔧 Supabase Configuration:', {
//     url: supabaseUrl,
//     environment: import.meta.env.VITE_ENVIRONMENT || 'auto-detected',
//     isDev: import.meta.env.DEV,
//   })
// }

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'thirstee-auth-token',
    debug: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': `thirstee-web-app-${isLocalEnvironment() ? 'local' : 'prod'}`
    }
  }
})

// Disable global exposure logging to reduce console noise
// if (typeof window !== 'undefined' && (import.meta.env.DEV || isLocalEnvironment())) {
//   (window as any).supabase = supabase
//   console.log('🔧 Supabase client exposed globally for debugging')
// }