import { supabase } from './supabase'

/**
 * Session management utilities for better mobile and web compatibility
 * Handles session persistence, refresh, and validation
 */

// Custom storage implementation that works better on mobile
class ThirsteeSessionStorage {
  private prefix = 'thirstee-session-'

  set(key: string, value: string): void {
    try {
      // Try localStorage first
      localStorage.setItem(this.prefix + key, value)
    } catch (error) {
      console.warn('localStorage failed, falling back to sessionStorage:', error)
      try {
        window.sessionStorage.setItem(this.prefix + key, value)
      } catch (sessionError) {
        console.warn('sessionStorage also failed:', sessionError)
      }
    }
  }

  get(key: string): string | null {
    try {
      // Try localStorage first
      const value = localStorage.getItem(this.prefix + key)
      if (value) return value

      // Fallback to sessionStorage
      return window.sessionStorage.getItem(this.prefix + key)
    } catch (error) {
      console.warn('Storage access failed:', error)
      return null
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key)
      window.sessionStorage.removeItem(this.prefix + key)
    } catch (error) {
      console.warn('Storage removal failed:', error)
    }
  }

  clear(): void {
    try {
      // Clear all thirstee session data
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix))
      keys.forEach(key => localStorage.removeItem(key))

      const sessionKeys = Object.keys(window.sessionStorage).filter(key => key.startsWith(this.prefix))
      sessionKeys.forEach(key => window.sessionStorage.removeItem(key))
    } catch (error) {
      console.warn('Storage clear failed:', error)
    }
  }
}

export const thirsteeSessionStorage = new ThirsteeSessionStorage()

/**
 * Check if the current session is valid and not expired
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return false
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    
    // Consider session invalid if it expires within 1 minute
    return expiresAt > now + 60
  } catch (error) {
    console.warn('Session validation failed:', error)
    return false
  }
}

/**
 * Refresh the current session if it's close to expiring
 */
export async function refreshSessionIfNeeded(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return false
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    
    // Refresh if session expires within 10 minutes
    if (expiresAt - now < 600) {
      console.log('Refreshing session proactively...')
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.warn('Session refresh failed:', refreshError)
        return false
      }
      
      if (refreshData.session) {
        console.log('Session refreshed successfully')
        return true
      }
    }
    
    return true
  } catch (error) {
    console.warn('Session refresh check failed:', error)
    return false
  }
}

/**
 * Get session info for debugging
 */
export async function getSessionInfo(): Promise<{
  hasSession: boolean
  expiresAt?: number
  expiresIn?: number
  userId?: string
}> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return { hasSession: false }
    }

    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    const expiresIn = expiresAt - now

    return {
      hasSession: true,
      expiresAt,
      expiresIn,
      userId: session.user?.id
    }
  } catch (error) {
    console.warn('Failed to get session info:', error)
    return { hasSession: false }
  }
}

/**
 * Force session refresh
 */
export async function forceSessionRefresh(): Promise<boolean> {
  try {
    console.log('Forcing session refresh...')
    const { data, error } = await supabase.auth.refreshSession()
    
    if (error) {
      console.warn('Forced session refresh failed:', error)
      return false
    }
    
    if (data.session) {
      console.log('Session force refreshed successfully')
      return true
    }
    
    return false
  } catch (error) {
    console.warn('Force session refresh error:', error)
    return false
  }
}

/**
 * Setup automatic session refresh for mobile compatibility
 */
export function setupSessionRefresh(): () => void {
  let refreshInterval: NodeJS.Timeout | null = null
  let visibilityListener: (() => void) | null = null

  // Set up periodic refresh (every 15 minutes to reduce HTTP requests)
  refreshInterval = setInterval(async () => {
    await refreshSessionIfNeeded()
  }, 15 * 60 * 1000)

  // Refresh when app becomes visible (mobile focus handling)
  if (typeof document !== 'undefined') {
    visibilityListener = async () => {
      if (!document.hidden) {
        console.log('App became visible, checking session...')
        await refreshSessionIfNeeded()
      }
    }
    
    document.addEventListener('visibilitychange', visibilityListener)
  }

  // Return cleanup function
  return () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
    if (visibilityListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityListener)
    }
  }
}

/**
 * Handle session errors gracefully
 */
export function handleSessionError(error: any): void {
  console.warn('Session error:', error)

  // Clear potentially corrupted session data
  thirsteeSessionStorage.clear()

  // If it's an auth error, redirect to login
  if (error?.message?.includes('JWT') || error?.message?.includes('session')) {
    console.log('Session appears corrupted, redirecting to login...')
    window.location.href = '/login?error=session_expired'
  }
}
