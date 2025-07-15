import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

/**
 * Get current user from session (no API call, avoids race conditions)
 * This is the preferred method for getting user in data fetching functions
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
  } catch (error) {
    console.error('Error getting current user from session:', error)
    return null
  }
}

/**
 * Get current user with retry logic for race conditions
 * Use this when you need to be absolutely sure about auth state
 */
export async function getCurrentUserWithRetry(maxRetries: number = 3, delay: number = 100): Promise<User | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        return session.user
      }
      
      // If no session, wait a bit and try again (except on last attempt)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    } catch (error) {
      console.error(`Error getting user (attempt ${i + 1}):`, error)
      if (i === maxRetries - 1) {
        return null
      }
    }
  }
  
  return null
}

/**
 * Check if user is authenticated without making API calls
 * Uses session state which is more reliable than getUser()
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return !!session?.user
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

/**
 * Get user ID safely without race conditions
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id || null
}

/**
 * Wrapper for functions that require authentication
 * Automatically handles auth checks and provides user context
 */
export async function withAuth<T>(
  fn: (user: User) => Promise<T>,
  options: {
    retries?: number
    errorMessage?: string
  } = {}
): Promise<T> {
  const { retries = 1, errorMessage = 'Authentication required' } = options
  
  const user = await getCurrentUserWithRetry(retries)
  
  if (!user) {
    throw new Error(errorMessage)
  }
  
  return await fn(user)
}

/**
 * Wrapper for functions that work with optional authentication
 * Provides user context if available, null otherwise
 */
export async function withOptionalAuth<T>(
  fn: (user: User | null) => Promise<T>
): Promise<T> {
  const user = await getCurrentUser()
  return await fn(user)
}

/**
 * Enhanced auth state checker that waits for initialization
 * Use this in components that need to wait for auth to be ready
 */
export async function waitForAuthReady(timeout: number = 5000): Promise<{ user: User | null; isReady: boolean }> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // If we have a session or enough time has passed, consider auth ready
      if (session !== null || Date.now() - startTime > 1000) {
        return {
          user: session?.user || null,
          isReady: true
        }
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 50))
    } catch (error) {
      console.error('Error waiting for auth ready:', error)
      break
    }
  }
  
  return {
    user: null,
    isReady: true // Consider ready even if we timed out
  }
}

/**
 * Check if current user has access to a private resource
 * Generic helper for permission checking
 */
export async function checkUserAccess(
  resourceId: string,
  checkFunction: (userId: string, resourceId: string) => Promise<boolean>
): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return false
    }
    
    return await checkFunction(user.id, resourceId)
  } catch (error) {
    console.error('Error checking user access:', error)
    return false
  }
}

/**
 * Safe auth state for components
 * Returns consistent state without race conditions
 */
export interface SafeAuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  userId: string | null
}

export async function getSafeAuthState(): Promise<SafeAuthState> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user || null
    
    return {
      user,
      isAuthenticated: !!user,
      isLoading: false,
      userId: user?.id || null
    }
  } catch (error) {
    console.error('Error getting safe auth state:', error)
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      userId: null
    }
  }
}
