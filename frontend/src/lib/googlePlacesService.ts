import { loadGoogleMapsAPI } from './googleMapsLoader'
import type { LocationData } from '@/types'

// Cache for Google Places API responses
interface PlaceCacheEntry {
  data: google.maps.places.AutocompletePrediction[]
  timestamp: number
}

interface PlaceDetailsCacheEntry {
  data: LocationData
  timestamp: number
}

class GooglePlacesService {
  private autocompleteService: google.maps.places.AutocompleteService | null = null
  private placesService: google.maps.places.PlacesService | null = null
  private dummyDiv: HTMLDivElement | null = null
  
  // Caches with TTL
  private predictionsCache = new Map<string, PlaceCacheEntry>()
  private detailsCache = new Map<string, PlaceDetailsCacheEntry>()
  
  // Cache TTL (5 minutes for predictions, 1 hour for details)
  private readonly PREDICTIONS_TTL = 5 * 60 * 1000
  private readonly DETAILS_TTL = 60 * 60 * 1000
  
  // Debounce timer for predictions
  private debounceTimer: NodeJS.Timeout | null = null
  private readonly DEBOUNCE_DELAY = 300 // 300ms debounce
  
  // Rate limiting
  private lastRequestTime = 0
  private readonly MIN_REQUEST_INTERVAL = 100 // Minimum 100ms between requests

  async initialize(): Promise<void> {
    if (this.autocompleteService && this.placesService) {
      return // Already initialized
    }

    try {
      await loadGoogleMapsAPI()
      
      // Create dummy div for PlacesService
      if (!this.dummyDiv) {
        this.dummyDiv = document.createElement('div')
      }
      
      // Initialize services
      this.autocompleteService = new window.google.maps.places.AutocompleteService()
      this.placesService = new window.google.maps.places.PlacesService(this.dummyDiv)
    } catch (error) {
      console.error('Failed to initialize Google Places services:', error)
      throw error
    }
  }

  /**
   * Get place predictions with caching and debouncing
   */
  async getPredictions(
    input: string,
    options?: {
      types?: string[]
      componentRestrictions?: { country: string }
    }
  ): Promise<google.maps.places.AutocompletePrediction[]> {
    // Input validation
    if (!input || input.length < 3) {
      return []
    }

    // Normalize input for cache key
    const cacheKey = `${input.toLowerCase()}_${JSON.stringify(options || {})}`
    
    // Check cache first
    const cached = this.getCachedPredictions(cacheKey)
    if (cached) {
      return cached
    }

    // Ensure services are initialized
    await this.initialize()
    
    if (!this.autocompleteService) {
      throw new Error('AutocompleteService not initialized')
    }

    // Rate limiting
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest))
    }

    return new Promise((resolve, reject) => {
      // Clear existing debounce timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }

      // Debounce the request
      this.debounceTimer = setTimeout(() => {
        this.lastRequestTime = Date.now()
        
        this.autocompleteService!.getPlacePredictions(
          {
            input,
            types: options?.types || ['establishment', 'geocode'],
            componentRestrictions: options?.componentRestrictions
          },
          (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              // Cache the results
              this.predictionsCache.set(cacheKey, {
                data: predictions,
                timestamp: Date.now()
              })
              resolve(predictions)
            } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              // Cache empty results to avoid repeated requests
              this.predictionsCache.set(cacheKey, {
                data: [],
                timestamp: Date.now()
              })
              resolve([])
            } else {
              console.warn('Places API error:', status)
              resolve([]) // Return empty array instead of rejecting
            }
          }
        )
      }, this.DEBOUNCE_DELAY)
    })
  }

  /**
   * Get place details with caching
   */
  async getPlaceDetails(placeId: string): Promise<LocationData | null> {
    if (!placeId) {
      return null
    }

    // Check cache first
    const cached = this.getCachedDetails(placeId)
    if (cached) {
      return cached
    }

    // Ensure services are initialized
    await this.initialize()
    
    if (!this.placesService) {
      throw new Error('PlacesService not initialized')
    }

    return new Promise((resolve) => {
      this.placesService!.getDetails(
        { 
          placeId,
          fields: ['place_id', 'formatted_address', 'name', 'geometry'] // Only request needed fields
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            const locationData: LocationData = {
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
              place_id: place.place_id || '',
              place_name: place.name || place.formatted_address || '',
              address: place.formatted_address
            }

            // Cache the result
            this.detailsCache.set(placeId, {
              data: locationData,
              timestamp: Date.now()
            })

            resolve(locationData)
          } else {
            console.warn('Place details API error:', status)
            resolve(null)
          }
        }
      )
    })
  }

  /**
   * Get cached predictions if still valid
   */
  private getCachedPredictions(key: string): google.maps.places.AutocompletePrediction[] | null {
    const cached = this.predictionsCache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.PREDICTIONS_TTL
    if (isExpired) {
      this.predictionsCache.delete(key)
      return null
    }

    return cached.data
  }

  /**
   * Get cached place details if still valid
   */
  private getCachedDetails(placeId: string): LocationData | null {
    const cached = this.detailsCache.get(placeId)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.DETAILS_TTL
    if (isExpired) {
      this.detailsCache.delete(placeId)
      return null
    }

    return cached.data
  }

  /**
   * Clear expired cache entries
   */
  cleanup(): void {
    const now = Date.now()

    // Clean predictions cache
    for (const [key, entry] of this.predictionsCache.entries()) {
      if (now - entry.timestamp > this.PREDICTIONS_TTL) {
        this.predictionsCache.delete(key)
      }
    }

    // Clean details cache
    for (const [key, entry] of this.detailsCache.entries()) {
      if (now - entry.timestamp > this.DETAILS_TTL) {
        this.detailsCache.delete(key)
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.predictionsCache.clear()
    this.detailsCache.clear()
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    if (this.dummyDiv) {
      this.dummyDiv.remove()
      this.dummyDiv = null
    }
    this.clearCache()
  }
}

// Singleton instance
export const googlePlacesService = new GooglePlacesService()

// Auto cleanup every 10 minutes
setInterval(() => googlePlacesService.cleanup(), 10 * 60 * 1000)

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => googlePlacesService.destroy())
}
