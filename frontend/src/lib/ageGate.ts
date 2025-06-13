/**
 * Age Gate utilities for Thirstee app
 * Handles age verification and localStorage management
 */

import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Constants
const AGE_VERIFICATION_KEY = 'thirstee_age_verified_at'
const AGE_VERIFICATION_EXPIRY_DAYS = 30
const MINIMUM_AGE = 19

export interface AgeVerificationStatus {
  isVerified: boolean
  needsVerification: boolean
  isUnderAge: boolean
  hasProfileAge: boolean
  profileAge?: number
}

/**
 * Check if age verification is still valid (within 30 days)
 */
export function isAgeVerificationValid(): boolean {
  try {
    const verifiedAt = localStorage.getItem(AGE_VERIFICATION_KEY)
    if (!verifiedAt) return false

    const verificationDate = new Date(verifiedAt)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - verificationDate.getTime()) / (1000 * 60 * 60 * 24))

    return daysDiff < AGE_VERIFICATION_EXPIRY_DAYS
  } catch (error) {
    console.warn('Error checking age verification:', error)
    return false
  }
}

/**
 * Set age verification timestamp in localStorage
 */
export function setAgeVerification(): void {
  try {
    localStorage.setItem(AGE_VERIFICATION_KEY, new Date().toISOString())
    
    // Dispatch storage event for cross-tab synchronization
    window.dispatchEvent(new StorageEvent('storage', {
      key: AGE_VERIFICATION_KEY,
      newValue: new Date().toISOString(),
      storageArea: localStorage
    }))
  } catch (error) {
    console.warn('Error setting age verification:', error)
  }
}

/**
 * Clear age verification from localStorage
 */
export function clearAgeVerification(): void {
  try {
    localStorage.removeItem(AGE_VERIFICATION_KEY)
    
    // Dispatch storage event for cross-tab synchronization
    window.dispatchEvent(new StorageEvent('storage', {
      key: AGE_VERIFICATION_KEY,
      newValue: null,
      storageArea: localStorage
    }))
  } catch (error) {
    console.warn('Error clearing age verification:', error)
  }
}

/**
 * Get user's age from their profile
 */
export async function getUserAge(userId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('age')
      .eq('user_id', userId)
      .single()

    if (error || !data) return null
    return data.age || null
  } catch (error) {
    console.warn('Error fetching user age:', error)
    return null
  }
}

/**
 * Check comprehensive age verification status for a user
 */
export async function checkAgeVerificationStatus(user: User | null): Promise<AgeVerificationStatus> {
  // Default status for non-authenticated users
  if (!user) {
    return {
      isVerified: isAgeVerificationValid(),
      needsVerification: !isAgeVerificationValid(),
      isUnderAge: false,
      hasProfileAge: false
    }
  }

  // Get user's profile age
  const profileAge = await getUserAge(user.id)
  const hasProfileAge = profileAge !== null

  // If user has age in profile and is under minimum age, they're blocked
  if (hasProfileAge && profileAge! < MINIMUM_AGE) {
    return {
      isVerified: false,
      needsVerification: false,
      isUnderAge: true,
      hasProfileAge: true,
      profileAge: profileAge!
    }
  }

  // If user has valid age in profile, they don't need verification modal
  if (hasProfileAge && profileAge! >= MINIMUM_AGE) {
    return {
      isVerified: true,
      needsVerification: false,
      isUnderAge: false,
      hasProfileAge: true,
      profileAge: profileAge!
    }
  }

  // User doesn't have age in profile, check localStorage verification
  const localVerification = isAgeVerificationValid()
  
  return {
    isVerified: localVerification,
    needsVerification: !localVerification,
    isUnderAge: false,
    hasProfileAge: false
  }
}

/**
 * Validate age input (for profile forms)
 */
export function validateAge(age: number | string): { isValid: boolean; error?: string } {
  const numAge = typeof age === 'string' ? parseInt(age, 10) : age
  
  if (isNaN(numAge)) {
    return { isValid: false, error: 'Please enter a valid age' }
  }
  
  if (numAge < MINIMUM_AGE) {
    return { isValid: false, error: `You must be at least ${MINIMUM_AGE} years old to use Thirstee` }
  }
  
  if (numAge > 120) {
    return { isValid: false, error: 'Please enter a valid age' }
  }
  
  return { isValid: true }
}

/**
 * Set up cross-tab synchronization for age verification
 */
export function setupAgeVerificationSync(callback: () => void): () => void {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === AGE_VERIFICATION_KEY) {
      callback()
    }
  }

  window.addEventListener('storage', handleStorageChange)
  
  return () => {
    window.removeEventListener('storage', handleStorageChange)
  }
}
