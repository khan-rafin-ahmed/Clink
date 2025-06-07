import { useState, useEffect, useCallback, useRef } from 'react'
import { cacheService, CacheTTL } from '@/lib/cacheService'

interface UseCachedDataOptions<T> {
  cacheKey: string
  fetcher: () => Promise<T>
  ttl?: number
  enabled?: boolean
  dependencies?: any[]
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseCachedDataReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  invalidate: () => void
}

/**
 * Hook for cached data fetching with automatic cache management
 */
export function useCachedData<T>({
  cacheKey,
  fetcher,
  ttl = CacheTTL.MEDIUM,
  enabled = true,
  dependencies = [],
  onSuccess,
  onError
}: UseCachedDataOptions<T>): UseCachedDataReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)
  const fetchingRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchData = useCallback(async (useCache = true) => {
    if (!enabled || fetchingRef.current) return
    
    fetchingRef.current = true
    setLoading(true)
    setError(null)

    try {
      let result: T

      if (useCache) {
        // Try to get from cache first
        const cached = cacheService.get<T>(cacheKey)
        if (cached !== null) {
          if (mountedRef.current) {
            setData(cached)
            setLoading(false)
            onSuccess?.(cached)
          }
          fetchingRef.current = false
          return
        }
      }

      // Fetch fresh data
      result = await fetcher()

      if (mountedRef.current) {
        setData(result)
        cacheService.set(cacheKey, result, ttl)
        onSuccess?.(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      if (mountedRef.current) {
        setError(error)
        onError?.(error)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
      fetchingRef.current = false
    }
  }, [cacheKey, fetcher, ttl, enabled, onSuccess, onError])

  const refetch = useCallback(async () => {
    await fetchData(false) // Force fresh fetch
  }, [fetchData])

  const invalidate = useCallback(() => {
    cacheService.delete(cacheKey)
  }, [cacheKey])

  // Initial fetch and dependency-based refetch
  useEffect(() => {
    fetchData()
  }, [fetchData, ...dependencies])

  return {
    data,
    loading,
    error,
    refetch,
    invalidate
  }
}

/**
 * Hook for cached data with manual trigger
 */
export function useLazyCachedData<T>({
  cacheKey,
  fetcher,
  ttl = CacheTTL.MEDIUM,
  onSuccess,
  onError
}: Omit<UseCachedDataOptions<T>, 'enabled' | 'dependencies'>): [
  (useCache?: boolean) => Promise<void>,
  UseCachedDataReturn<T>
] {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(async (useCache = true) => {
    setLoading(true)
    setError(null)

    try {
      let result: T

      if (useCache) {
        const cached = cacheService.get<T>(cacheKey)
        if (cached !== null) {
          if (mountedRef.current) {
            setData(cached)
            setLoading(false)
            onSuccess?.(cached)
          }
          return
        }
      }

      result = await fetcher()

      if (mountedRef.current) {
        setData(result)
        cacheService.set(cacheKey, result, ttl)
        onSuccess?.(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      if (mountedRef.current) {
        setError(error)
        onError?.(error)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [cacheKey, fetcher, ttl, onSuccess, onError])

  const refetch = useCallback(async () => {
    await execute(false)
  }, [execute])

  const invalidate = useCallback(() => {
    cacheService.delete(cacheKey)
  }, [cacheKey])

  return [
    execute,
    {
      data,
      loading,
      error,
      refetch,
      invalidate
    }
  ]
}

/**
 * Hook for invalidating multiple cache entries
 */
export function useCacheInvalidation() {
  const invalidatePattern = useCallback((pattern: string) => {
    cacheService.invalidatePattern(pattern)
  }, [])

  const invalidateKey = useCallback((key: string) => {
    cacheService.delete(key)
  }, [])

  const clearAll = useCallback(() => {
    cacheService.clear()
  }, [])

  return {
    invalidatePattern,
    invalidateKey,
    clearAll
  }
}
