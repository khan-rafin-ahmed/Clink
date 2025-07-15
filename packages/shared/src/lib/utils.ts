import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a username from display name and user ID
 */
export function generateUsernameFromDisplayName(displayName: string, userId: string): string {
  // Clean the display name: remove special chars, convert to lowercase
  const cleanName = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15) // Limit length

  // Use last 6 characters of user ID for uniqueness
  const userIdSuffix = userId.slice(-6)
  
  return `${cleanName}${userIdSuffix}`
}

/**
 * Generate a random username
 */
export function generateUsername(): string {
  const adjectives = ['cool', 'awesome', 'epic', 'wild', 'chill', 'rad', 'fresh', 'smooth']
  const nouns = ['tiger', 'eagle', 'shark', 'wolf', 'lion', 'bear', 'fox', 'hawk']
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 1000)
  
  return `${adjective}${noun}${number}`
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format time for display
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  return new Date(date) < new Date()
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  const today = new Date()
  const checkDate = new Date(date)
  
  return today.toDateString() === checkDate.toDateString()
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: string | Date): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffMs = targetDate.getTime() - now.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (Math.abs(diffMinutes) < 60) {
    if (diffMinutes === 0) return 'now'
    return diffMinutes > 0 ? `in ${diffMinutes}m` : `${Math.abs(diffMinutes)}m ago`
  }

  if (Math.abs(diffHours) < 24) {
    return diffHours > 0 ? `in ${diffHours}h` : `${Math.abs(diffHours)}h ago`
  }

  return diffDays > 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(text: string): string {
  return text.replace(/\b\w/g, l => l.toUpperCase())
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
