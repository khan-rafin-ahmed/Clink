import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Hook to automatically scroll to top when route changes
 * This fixes the common issue where React Router doesn't reset scroll position
 */
export function useScrollToTop() {
  const location = useLocation()

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])
}

/**
 * Hook for manual scroll to top with smooth behavior
 */
export function useScrollToTopManual() {
  const scrollToTop = (behavior: ScrollBehavior = 'smooth') => {
    window.scrollTo({ top: 0, behavior })
  }

  return { scrollToTop }
}

/**
 * Hook for scroll restoration that preserves scroll position on back navigation
 * but resets to top for new navigation
 */
export function useScrollRestoration() {
  const location = useLocation()

  useEffect(() => {
    // Check if this is a back/forward navigation
    const isBackForward = window.history.state && window.history.state.idx !== undefined

    if (!isBackForward) {
      // New navigation - scroll to top after content renders
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
      }, 0)
    }
    // For back/forward navigation, let browser handle scroll restoration
  }, [location.pathname])
}
