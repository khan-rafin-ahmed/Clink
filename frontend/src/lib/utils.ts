import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a username from display name
 * Converts display name to lowercase, removes special characters, and replaces spaces with underscores
 */
export function generateUsernameFromDisplayName(displayName: string): string {
  if (!displayName || typeof displayName !== 'string') {
    return 'user'
  }

  return displayName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 30) // Limit length
    || 'user' // Fallback if result is empty
}