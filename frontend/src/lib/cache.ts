// Simple in-memory cache for performance optimization
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

export const cache = new SimpleCache()

// Auto cleanup every 10 minutes
setInterval(() => cache.cleanup(), 10 * 60 * 1000)

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user_profile_${userId}`,
  FOLLOW_COUNTS: (userId: string) => `follow_counts_${userId}`,
  MY_EVENTS: (userId: string) => `my_events_${userId}`,
  PUBLIC_EVENTS: 'public_events',
  USER_ACCESSIBLE_EVENTS: (userId: string) => `accessible_events_${userId}`,
  IS_FOLLOWING: (followerId: string, followingId: string) => `is_following_${followerId}_${followingId}`,
  GOOGLE_PLACES_PREDICTIONS: (query: string, options: string) => `places_predictions_${query}_${options}`,
  GOOGLE_PLACE_DETAILS: (placeId: string) => `place_details_${placeId}`,
  EVENT_ATTENDANCE: (eventId: string, userId: string) => `event_attendance_${eventId}_${userId}`
}

// Helper function for cached API calls
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetcher()

  // Cache the result
  cache.set(key, data, ttl)

  return data
}

// Invalidate related caches when data changes
export function invalidateUserCaches(userId: string): void {
  cache.delete(CACHE_KEYS.USER_PROFILE(userId))
  cache.delete(CACHE_KEYS.FOLLOW_COUNTS(userId))
  cache.delete(CACHE_KEYS.MY_EVENTS(userId))
  cache.delete(CACHE_KEYS.USER_ACCESSIBLE_EVENTS(userId))
}

export function invalidateEventCaches(): void {
  cache.delete(CACHE_KEYS.PUBLIC_EVENTS)
  // Clear all user accessible events caches
  for (const key of cache['cache'].keys()) {
    if (key.includes('accessible_events_') || key.includes('my_events_')) {
      cache.delete(key)
    }
  }
}

export function invalidateGooglePlacesCaches(): void {
  // Clear all Google Places caches
  for (const key of cache['cache'].keys()) {
    if (key.includes('places_predictions_') || key.includes('place_details_')) {
      cache.delete(key)
    }
  }
}

export function invalidateEventAttendanceCaches(eventId?: string): void {
  if (eventId) {
    // Clear specific event attendance caches
    for (const key of cache['cache'].keys()) {
      if (key.includes(`event_attendance_${eventId}_`)) {
        cache.delete(key)
      }
    }
  } else {
    // Clear all event attendance caches
    for (const key of cache['cache'].keys()) {
      if (key.includes('event_attendance_')) {
        cache.delete(key)
      }
    }
  }
}
