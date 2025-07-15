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
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return !!user
}

/**
 * Get user ID safely
 */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id || null
}

/**
 * Get user email safely
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.email || null
}

/**
 * Check if user is new (created within last minute)
 */
export function isNewUser(user: any): boolean {
  if (!user?.created_at) return false

  const userCreatedAt = new Date(user.created_at)
  const now = new Date()
  const isNew = (now.getTime() - userCreatedAt.getTime()) < 60000 // Less than 1 minute old

  return isNew
}
