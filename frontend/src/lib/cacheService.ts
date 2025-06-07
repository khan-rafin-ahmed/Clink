/**
 * Comprehensive caching service for Thirstee app
 * Provides memory and localStorage caching with TTL support
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface CacheConfig {
  defaultTTL: number
  maxMemoryItems: number
  enableLocalStorage: boolean
}

class CacheService {
  private memoryCache = new Map<string, CacheItem<any>>()
  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxMemoryItems: 100,
    enableLocalStorage: true
  }

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config }
    }
  }

  /**
   * Set data in cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    }

    // Memory cache
    this.memoryCache.set(key, cacheItem)

    // Cleanup old items if memory cache is too large
    if (this.memoryCache.size > this.config.maxMemoryItems) {
      this.cleanupMemoryCache()
    }

    // Local storage cache (for persistence across sessions)
    if (this.config.enableLocalStorage) {
      try {
        localStorage.setItem(`thirstee_cache_${key}`, JSON.stringify(cacheItem))
      } catch (error) {
        console.warn('Failed to save to localStorage:', error)
      }
    }
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(key)
    if (memoryItem && this.isValid(memoryItem)) {
      return memoryItem.data
    }

    // Check localStorage cache
    if (this.config.enableLocalStorage) {
      try {
        const stored = localStorage.getItem(`thirstee_cache_${key}`)
        if (stored) {
          const item: CacheItem<T> = JSON.parse(stored)
          if (this.isValid(item)) {
            // Restore to memory cache
            this.memoryCache.set(key, item)
            return item.data
          } else {
            // Remove expired item
            localStorage.removeItem(`thirstee_cache_${key}`)
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error)
      }
    }

    return null
  }

  /**
   * Check if cache item is still valid
   */
  private isValid(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp < item.ttl
  }

  /**
   * Remove expired items from memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now()
    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp >= item.ttl) {
        this.memoryCache.delete(key)
      }
    }

    // If still too many items, remove oldest ones
    if (this.memoryCache.size > this.config.maxMemoryItems) {
      const entries = Array.from(this.memoryCache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, entries.length - this.config.maxMemoryItems)
      toRemove.forEach(([key]) => this.memoryCache.delete(key))
    }
  }

  /**
   * Clear specific cache entry
   */
  delete(key: string): void {
    this.memoryCache.delete(key)
    if (this.config.enableLocalStorage) {
      localStorage.removeItem(`thirstee_cache_${key}`)
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear()
    if (this.config.enableLocalStorage) {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('thirstee_cache_'))
      keys.forEach(key => localStorage.removeItem(key))
    }
  }

  /**
   * Get or set pattern - fetch data if not in cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)

    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key)
      }
    }

    // Clear from localStorage
    if (this.config.enableLocalStorage) {
      const keys = Object.keys(localStorage).filter(key =>
        key.startsWith('thirstee_cache_') && regex.test(key.replace('thirstee_cache_', ''))
      )
      keys.forEach(key => localStorage.removeItem(key))
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number
    localStorageSize: number
    totalKeys: number
  } {
    const localStorageKeys = this.config.enableLocalStorage
      ? Object.keys(localStorage).filter(key => key.startsWith('thirstee_cache_')).length
      : 0

    return {
      memorySize: this.memoryCache.size,
      localStorageSize: localStorageKeys,
      totalKeys: this.memoryCache.size + localStorageKeys
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): void {
    // Memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key)
      }
    }

    // localStorage
    if (this.config.enableLocalStorage) {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith('thirstee_cache_') && key.includes(pattern)
      )
      keys.forEach(key => localStorage.removeItem(key))
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService()

// Cache key generators
export const CacheKeys = {
  userProfile: (userId: string) => `user_profile_${userId}`,
  userEvents: (userId: string) => `user_events_${userId}`,
  userCrews: (userId: string) => `user_crews_${userId}`,
  eventDetails: (eventId: string) => `event_details_${eventId}`,
  eventAttendees: (eventId: string) => `event_attendees_${eventId}`,
  eventRatings: (eventId: string) => `event_ratings_${eventId}`,
  crewDetails: (crewId: string) => `crew_details_${crewId}`,
  crewMembers: (crewId: string) => `crew_members_${crewId}`,
  discoverEvents: (filters: string) => `discover_events_${filters}`,
  userStats: (userId: string) => `user_stats_${userId}`,
}

// Cache TTL constants (in milliseconds)
export const CacheTTL = {
  SHORT: 2 * 60 * 1000,      // 2 minutes
  MEDIUM: 5 * 60 * 1000,     // 5 minutes  
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
}
