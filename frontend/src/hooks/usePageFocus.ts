import { useEffect, useRef, useState } from 'react'

/**
 * Hook to manage page focus and prevent unnecessary re-fetches when switching tabs
 * This helps prevent the issue where data is re-fetched every time user switches back to the tab
 */
export function usePageFocus() {
  const [isVisible, setIsVisible] = useState(!document.hidden)
  const [hasFocus, setHasFocus] = useState(document.hasFocus())
  const lastFetchTime = useRef<number>(0)
  const minRefetchInterval = 30000 // 30 seconds minimum between refetches

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    const handleFocus = () => {
      setHasFocus(true)
    }

    const handleBlur = () => {
      setHasFocus(false)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  /**
   * Determines if data should be refetched based on focus state and timing
   */
  const shouldRefetch = () => {
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTime.current
    
    // Only refetch if enough time has passed and page is visible/focused
    if (isVisible && hasFocus && timeSinceLastFetch > minRefetchInterval) {
      lastFetchTime.current = now
      return true
    }
    
    return false
  }

  /**
   * Mark that a fetch has occurred (call this after successful data fetch)
   */
  const markFetched = () => {
    lastFetchTime.current = Date.now()
  }

  return {
    isVisible,
    hasFocus,
    shouldRefetch,
    markFetched
  }
}

/**
 * Enhanced version of usePageFocus with cache-aware logic
 */
export function useSmartRefetch(cacheKey: string, cacheTTL: number = 300000) {
  const { isVisible, hasFocus } = usePageFocus()
  const lastFetchTimes = useRef<Map<string, number>>(new Map())

  const shouldRefetch = () => {
    if (!isVisible || !hasFocus) return false

    const now = Date.now()
    const lastFetch = lastFetchTimes.current.get(cacheKey) || 0
    const timeSinceLastFetch = now - lastFetch

    // Only refetch if cache has expired
    return timeSinceLastFetch > cacheTTL
  }

  const markFetched = () => {
    lastFetchTimes.current.set(cacheKey, Date.now())
  }

  return {
    isVisible,
    hasFocus,
    shouldRefetch,
    markFetched
  }
}
