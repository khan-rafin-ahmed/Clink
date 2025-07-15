import { supabase } from './supabase'
import { ensureUserProfileExists } from './userService'
import { isNewUser } from './authUtils'

/**
 * Platform-agnostic authentication service
 * Handles user authentication without UI dependencies
 */

export interface AuthResult {
  success: boolean
  error?: string
  profile?: any
  isNewUser?: boolean
}

/**
 * Get auth callback URL based on environment
 */
function getAuthCallbackUrl(): string {
  // For web
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`
  }
  
  // For mobile - this would be configured with deep linking
  return 'thirstee://auth/callback'
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const callbackUrl = getAuthCallbackUrl()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: callbackUrl,
        skipBrowserRedirect: false,
        scopes: 'openid email profile'
      }
    })

    if (error) {
      console.error('❌ Google OAuth Error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('❌ signInWithGoogle failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Handle auth callback and setup user profile
 */
export async function handleAuthCallback(): Promise<AuthResult> {
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return { success: false, error: error.message }
    }

    if (!session?.user) {
      return { success: false, error: 'No session found' }
    }

    const user = session.user
    const userIsNew = isNewUser(user)

    // Ensure user profile exists
    const profileResult = await ensureUserProfileExists(user)
    
    if (!profileResult.success) {
      return { success: false, error: profileResult.error }
    }

    return { 
      success: true, 
      profile: profileResult.data,
      isNewUser: userIsNew
    }

  } catch (error: any) {
    console.error('❌ handleAuthCallback failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sign out user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    // Use local scope to ensure tokens are cleared even if refresh token is invalid
    const { error } = await supabase.auth.signOut({ scope: 'local' })

    if (error && error.status !== 401 && error.status !== 403) {
      return { success: false, error: error.message }
    }

    // Attempt global sign out but ignore invalid token errors
    const { error: globalError } = await supabase.auth.signOut({ scope: 'global' })
    if (globalError && globalError.status !== 401 && globalError.status !== 403) {
      return { success: false, error: globalError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('❌ signOut failed:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: session }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Refresh session
 */
export async function refreshSession() {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: session }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}
