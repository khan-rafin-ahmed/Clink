// Enhanced in-memory cache for performance optimization
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccessed: number
}

class EnhancedCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_ENTRIES = 1000 // Prevent memory leaks
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Start cleanup interval
    this.startCleanupInterval()
  }

  private startCleanupInterval(): void {
    // Clean up every 2 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000)
  }

  private evictLRU(): void {
    if (this.cache.size <= this.MAX_ENTRIES) return

    // Find least recently used entry
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // Evict LRU if cache is full
    this.evictLRU()

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now()
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

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = now

    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clear expired entries and get cache stats
  cleanup(): void {
    const now = Date.now()
    let expiredCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        expiredCount++
      }
    }
  }

  // Get cache statistics
  getStats(): {
    size: number
    maxSize: number
    hitRate: number
    totalEntries: number
  } {
    let totalAccess = 0
    let totalEntries = 0

    for (const entry of this.cache.values()) {
      totalAccess += entry.accessCount
      totalEntries++
    }

    return {
      size: this.cache.size,
      maxSize: this.MAX_ENTRIES,
      hitRate: totalAccess > 0 ? (totalAccess / totalEntries) : 0,
      totalEntries
    }
  }

  // Destroy cache and cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }
}

export const cache = new EnhancedCache()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cache.destroy()
  })
}

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
  EVENT_ATTENDANCE: (eventId: string, userId: string) => `event_attendance_${eventId}_${userId}`,
  // Navigation and page caching
  EVENT_DETAIL: (eventId: string) => `event_detail_${eventId}`,
  EVENT_RATINGS: (eventId: string) => `event_ratings_${eventId}`,
  USER_EVENT_RATING: (eventId: string, userId: string) => `user_event_rating_${eventId}_${userId}`,
  PAGE_DATA: (pageKey: string, path: string) => `page_data_${pageKey}_${path}`,
  NAVIGATION_STATE: (path: string) => `nav_state_${path}`,
  DISCOVER_EVENTS: (filters: string) => `discover_events_${filters}`,
  CREW_DETAILS: (crewId: string) => `crew_details_${crewId}`,
  CREW_MEMBERS: (crewId: string) => `crew_members_${crewId}`
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
