import { useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { cache, CACHE_KEYS } from '@/lib/cache'

interface NavigationState {
  fromRoute?: string
  timestamp?: number
  scrollPosition?: number
  data?: any
}

/**
 * Enhanced navigation hook that prevents unnecessary page reloads
 * and maintains state between route transitions
 */
export function useOptimizedNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const scrollPositionRef = useRef<number>(0)
  const navigationStateRef = useRef<Map<string, NavigationState>>(new Map())

  // Save scroll position before navigation
  useEffect(() => {
    const saveScrollPosition = () => {
      scrollPositionRef.current = window.scrollY
    }

    window.addEventListener('beforeunload', saveScrollPosition)
    return () => window.removeEventListener('beforeunload', saveScrollPosition)
  }, [])

  // Restore scroll position after navigation
  useEffect(() => {
    const currentPath = location.pathname
    const savedState = navigationStateRef.current.get(currentPath)
    
    if (savedState?.scrollPosition !== undefined) {
      // Restore scroll position after a short delay to ensure content is rendered
      setTimeout(() => {
        window.scrollTo(0, savedState.scrollPosition)
      }, 100)
    }
  }, [location.pathname])

  /**
   * Navigate with state preservation
   */
  const navigateWithState = useCallback((
    to: string,
    options?: {
      replace?: boolean
      state?: any
      preserveScroll?: boolean
      cacheCurrentPage?: boolean
    }
  ) => {
    const currentPath = location.pathname
    const { preserveScroll = false, cacheCurrentPage = true, ...navOptions } = options || {}

    // Save current page state if requested
    if (cacheCurrentPage) {
      const currentState: NavigationState = {
        fromRoute: currentPath,
        timestamp: Date.now(),
        scrollPosition: preserveScroll ? window.scrollY : 0,
        data: navOptions.state
      }
      navigationStateRef.current.set(currentPath, currentState)
    }

    navigate(to, navOptions)
  }, [navigate, location.pathname])

  /**
   * Smart back navigation that uses cached state
   */
  const goBackSmart = useCallback((fallbackRoute: string = '/discover') => {
    const currentPath = location.pathname
    
    // Check if we have navigation history
    if (window.history.length > 1) {
      const referrer = document.referrer
      const currentOrigin = window.location.origin
      
      // If referrer is from the same origin, we likely have valid history
      if (referrer && referrer.startsWith(currentOrigin)) {
        navigate(-1)
        return
      }
      
      // Check if we have cached state for a previous route
      for (const [path, state] of navigationStateRef.current.entries()) {
        if (state.fromRoute === currentPath && Date.now() - (state.timestamp || 0) < 300000) { // 5 minutes
          navigateWithState(path, { preserveScroll: true })
          return
        }
      }
    }
    
    // Fallback to specified route
    navigateWithState(fallbackRoute)
  }, [location.pathname, navigate, navigateWithState])

  /**
   * Navigate to event detail with caching
   */
  const navigateToEvent = useCallback((eventId: string, isPrivate: boolean = false) => {
    const route = isPrivate ? `/private-event/${eventId}` : `/event/${eventId}`
    navigateWithState(route, { cacheCurrentPage: true })
  }, [navigateWithState])

  /**
   * Navigate to profile with caching
   */
  const navigateToProfile = useCallback((userId?: string) => {
    const route = userId ? `/profile/${userId}` : '/profile'
    navigateWithState(route, { cacheCurrentPage: true })
  }, [navigateWithState])

  /**
   * Navigate to discover with caching
   */
  const navigateToDiscover = useCallback((filters?: Record<string, string>) => {
    const searchParams = new URLSearchParams(filters)
    const route = `/discover${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    navigateWithState(route, { cacheCurrentPage: true })
  }, [navigateWithState])

  /**
   * Clear navigation cache for a specific route
   */
  const clearNavigationCache = useCallback((route?: string) => {
    if (route) {
      navigationStateRef.current.delete(route)
    } else {
      navigationStateRef.current.clear()
    }
  }, [])

  /**
   * Get cached navigation state for current route
   */
  const getCachedState = useCallback((route?: string) => {
    const targetRoute = route || location.pathname
    return navigationStateRef.current.get(targetRoute)
  }, [location.pathname])

  return {
    navigateWithState,
    goBackSmart,
    navigateToEvent,
    navigateToProfile,
    navigateToDiscover,
    clearNavigationCache,
    getCachedState,
    currentPath: location.pathname,
    currentState: location.state
  }
}

/**
 * Hook for caching page data during navigation
 */
export function usePageDataCache<T>(
  pageKey: string,
  fetchFunction: () => Promise<T>,
  options: {
    ttl?: number
    dependencies?: any[]
    enabled?: boolean
  } = {}
) {
  const { ttl = 300000, dependencies = [], enabled = true } = options // 5 minutes default TTL
  const location = useLocation()
  
  const cacheKey = `page_data_${pageKey}_${location.pathname}`
  
  const getCachedData = useCallback((): T | null => {
    if (!enabled) return null
    return cache.get<T>(cacheKey)
  }, [cacheKey, enabled])
  
  const setCachedData = useCallback((data: T) => {
    if (enabled) {
      cache.set(cacheKey, data, ttl)
    }
  }, [cacheKey, ttl, enabled])
  
  const invalidateCache = useCallback(() => {
    cache.delete(cacheKey)
  }, [cacheKey])
  
  const fetchWithCache = useCallback(async (): Promise<T> => {
    // Try cache first
    const cached = getCachedData()
    if (cached !== null) {
      return cached
    }
    
    // Fetch fresh data
    const data = await fetchFunction()
    setCachedData(data)
    return data
  }, [getCachedData, setCachedData, fetchFunction])
  
  // Invalidate cache when dependencies change
  useEffect(() => {
    if (dependencies.length > 0) {
      invalidateCache()
    }
  }, dependencies)
  
  return {
    getCachedData,
    setCachedData,
    invalidateCache,
    fetchWithCache
  }
}
