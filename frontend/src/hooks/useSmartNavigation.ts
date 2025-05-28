import { useNavigate, useLocation } from 'react-router-dom'
import { useCallback } from 'react'

/**
 * Smart navigation hook that provides intelligent back navigation
 * Falls back to a default route if there's no history or if coming from external sources
 */
export function useSmartNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * Navigate back to the previous page in history, or to a fallback route
   * @param fallbackRoute - Route to navigate to if no history is available (default: '/discover')
   * @param options - Navigation options
   */
  const goBack = useCallback((
    fallbackRoute: string = '/discover',
    options?: { replace?: boolean }
  ) => {
    // Check if we have history to go back to
    if (window.history.length > 1) {
      // Check if we came from within the app (not external link or direct URL access)
      const referrer = document.referrer
      const currentOrigin = window.location.origin
      
      // If referrer is from the same origin, we likely have valid history
      if (referrer && referrer.startsWith(currentOrigin)) {
        navigate(-1)
        return
      }
      
      // If no referrer but we have history, still try to go back
      // This handles cases like browser refresh where referrer is lost
      if (window.history.length > 2) {
        navigate(-1)
        return
      }
    }
    
    // Fallback to the specified route
    navigate(fallbackRoute, options)
  }, [navigate])

  /**
   * Navigate back with a specific fallback based on current route context
   */
  const goBackSmart = useCallback(() => {
    const currentPath = location.pathname
    
    // Determine smart fallback based on current route
    let fallbackRoute = '/discover'
    
    if (currentPath.startsWith('/event/')) {
      // Event detail pages - fallback to discover
      fallbackRoute = '/discover'
    } else if (currentPath.startsWith('/profile/') && currentPath !== '/profile') {
      // Other user's profile - fallback to discover
      fallbackRoute = '/discover'
    } else if (currentPath === '/profile' || currentPath.startsWith('/edit-profile')) {
      // Own profile or edit profile - fallback to discover
      fallbackRoute = '/discover'
    } else if (currentPath.startsWith('/events/')) {
      // Event details - fallback to events list or discover
      fallbackRoute = '/discover'
    }
    
    goBack(fallbackRoute)
  }, [location.pathname, goBack])

  /**
   * Navigate to a specific route
   */
  const navigateTo = useCallback((
    route: string, 
    options?: { replace?: boolean; state?: any }
  ) => {
    navigate(route, options)
  }, [navigate])

  /**
   * Replace current route in history
   */
  const replaceCurrent = useCallback((route: string, state?: any) => {
    navigate(route, { replace: true, state })
  }, [navigate])

  return {
    goBack,
    goBackSmart,
    navigateTo,
    replaceCurrent,
    currentPath: location.pathname,
    currentState: location.state
  }
}

/**
 * Hook for handling navigation after successful actions (create, update, delete)
 */
export function useActionNavigation() {
  const { goBackSmart, navigateTo } = useSmartNavigation()

  const handleCreateSuccess = useCallback((
    entityType: 'event' | 'profile',
    entityId?: string
  ) => {
    switch (entityType) {
      case 'event':
        // After creating an event, go to the event detail page if we have an ID
        if (entityId) {
          navigateTo(`/event/${entityId}`)
        } else {
          // Otherwise go back to where they came from
          goBackSmart()
        }
        break
      case 'profile':
        // After creating/updating profile, go to profile page
        navigateTo('/profile')
        break
      default:
        goBackSmart()
    }
  }, [goBackSmart, navigateTo])

  const handleUpdateSuccess = useCallback(() => {
    // After updates, typically stay on the same page or go back
    goBackSmart()
  }, [goBackSmart])

  const handleDeleteSuccess = useCallback((entityType: 'event' | 'profile') => {
    switch (entityType) {
      case 'event':
        // After deleting an event, go to discover or profile
        navigateTo('/discover')
        break
      case 'profile':
        // After deleting profile, go to home
        navigateTo('/')
        break
      default:
        navigateTo('/discover')
    }
  }, [navigateTo])

  return {
    handleCreateSuccess,
    handleUpdateSuccess,
    handleDeleteSuccess,
    goBackSmart,
    navigateTo
  }
}
