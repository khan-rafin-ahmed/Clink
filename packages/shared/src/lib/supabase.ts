import { createClient } from '@supabase/supabase-js'

// Use process.env for both web and mobile - Vite will inject these at build time
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Platform-agnostic storage with error handling
function getStorage() {
  // Web environment
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }

  // React Native - try to import AsyncStorage with better error handling
  try {
    // Check if we're in React Native environment
    if (typeof global !== 'undefined' && global.HermesInternal) {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default
      return AsyncStorage
    }
  } catch (error) {
    console.warn('AsyncStorage not available, using default storage:', error)
  }

  // Fallback to undefined (Supabase will use memory storage)
  return undefined
}

// Create Supabase client with error handling
let supabaseClient: any

try {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: typeof window !== 'undefined', // Only detect URL in web
      flowType: 'pkce',
      storage: getStorage(),
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
        'X-Client-Info': typeof window !== 'undefined' ? 'thirstee-web-app' : 'thirstee-mobile-app'
      }
    }
  })
} catch (error) {
  console.error('Failed to create Supabase client:', error)
  throw new Error('Supabase client initialization failed')
}

export const supabase = supabaseClient
