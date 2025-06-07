import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * Simple navigation optimization hook that prevents unnecessary page reloads
 * and provides smart navigation utilities
 */
export function useNavigationOptimization() {
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * Smart back navigation with fallback
   */
  const goBackSmart = useCallback((fallbackRoute: string = '/discover') => {
    // Check if we have navigation history
    if (window.history.length > 1) {
      const referrer = document.referrer
      const currentOrigin = window.location.origin
      
      // If referrer is from the same origin, we likely have valid history
      if (referrer && referrer.startsWith(currentOrigin)) {
        navigate(-1)
        return
      }
    }
    
    // Fallback to specified route
    navigate(fallbackRoute)
  }, [navigate])

  /**
   * Navigate to event detail
   */
  const navigateToEvent = useCallback((eventId: string, isPrivate: boolean = false) => {
    const route = isPrivate ? `/private-event/${eventId}` : `/event/${eventId}`
    navigate(route)
  }, [navigate])

  /**
   * Navigate to profile
   */
  const navigateToProfile = useCallback((userId?: string) => {
    const route = userId ? `/profile/${userId}` : '/profile'
    navigate(route)
  }, [navigate])

  /**
   * Navigate to discover with filters
   */
  const navigateToDiscover = useCallback((filters?: Record<string, string>) => {
    const searchParams = new URLSearchParams(filters)
    const route = `/discover${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    navigate(route)
  }, [navigate])

  /**
   * Navigate with state preservation
   */
  const navigateWithState = useCallback((
    to: string,
    options?: {
      replace?: boolean
      state?: any
    }
  ) => {
    navigate(to, options)
  }, [navigate])

  return {
    goBackSmart,
    navigateToEvent,
    navigateToProfile,
    navigateToDiscover,
    navigateWithState,
    currentPath: location.pathname,
    currentState: location.state
  }
}

/**
 * Hook for preventing unnecessary re-renders and optimizing component performance
 */
export function useComponentOptimization() {
  /**
   * Debounce function to prevent excessive API calls
   */
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }, [])

  /**
   * Throttle function to limit API call frequency
   */
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }, [])

  return {
    debounce,
    throttle
  }
}
