import { useState, useEffect, useCallback, useRef } from 'react'

export type DataFetchingState = 'idle' | 'loading' | 'success' | 'error'

export interface UseDataFetchingOptions<T> {
  immediate?: boolean
  dependencies?: any[]
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retryCount?: number
  retryDelay?: number
  enabled?: boolean
}

export interface DataFetchingResult<T> {
  data: T | null
  state: DataFetchingState
  error: Error | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isEmpty: boolean
  refetch: () => Promise<void>
  reset: () => void
}

/**
 * Platform-agnostic data fetching hook
 * Handles loading states, errors, and retries
 */
export function useDataFetching<T>(
  fetchFunction: () => Promise<T>,
  options: UseDataFetchingOptions<T> = {}
): DataFetchingResult<T> {
  const {
    immediate = true,
    dependencies = [],
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000,
    enabled = true
  } = options

  const [data, setData] = useState<T | null>(null)
  const [state, setState] = useState<DataFetchingState>('idle')
  const [error, setError] = useState<Error | null>(null)
  
  const mountedRef = useRef(true)
  const fetchingRef = useRef(false)
  const retryCountRef = useRef(0)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const executeWithRetry = useCallback(async (attempt = 0): Promise<void> => {
    if (!enabled || fetchingRef.current || !mountedRef.current) return

    fetchingRef.current = true
    setState('loading')
    setError(null)

    try {
      const result = await fetchFunction()
      
      if (mountedRef.current) {
        setData(result)
        setState('success')
        retryCountRef.current = 0
        onSuccess?.(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      
      if (mountedRef.current) {
        if (attempt < retryCount) {
          // Retry after delay
          setTimeout(() => {
            if (mountedRef.current) {
              executeWithRetry(attempt + 1)
            }
          }, retryDelay)
          return
        }

        setError(error)
        setState('error')
        onError?.(error)
      }
    } finally {
      if (mountedRef.current) {
        fetchingRef.current = false
      }
    }
  }, [fetchFunction, enabled, retryCount, retryDelay, onSuccess, onError])

  const refetch = useCallback(async () => {
    retryCountRef.current = 0
    await executeWithRetry()
  }, [executeWithRetry])

  const reset = useCallback(() => {
    if (mountedRef.current) {
      setData(null)
      setState('idle')
      setError(null)
      retryCountRef.current = 0
    }
  }, [])

  // Execute on mount and dependency changes
  useEffect(() => {
    if (immediate && enabled) {
      executeWithRetry()
    }
  }, [immediate, enabled, executeWithRetry, ...dependencies])

  const isEmpty = data === null || 
    (Array.isArray(data) && data.length === 0) ||
    (typeof data === 'object' && Object.keys(data).length === 0)

  return {
    data,
    state,
    error,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isEmpty,
    refetch,
    reset
  }
}

/**
 * Hook for auth-dependent data fetching
 */
export function useAuthDataFetching<T>(
  fetchFunction: (user: any) => Promise<T>,
  options: UseDataFetchingOptions<T> & {
    requireAuth?: boolean
    user?: any
    isAuthReady?: boolean
  } = {}
): DataFetchingResult<T> {
  const {
    requireAuth = false,
    user,
    isAuthReady = true,
    ...fetchOptions
  } = options

  const shouldFetch = isAuthReady && (requireAuth ? !!user : true)

  const wrappedFetchFunction = useCallback(() => {
    if (requireAuth && !user) {
      throw new Error('Authentication required')
    }
    return fetchFunction(user)
  }, [fetchFunction, user, requireAuth])

  return useDataFetching(wrappedFetchFunction, {
    ...fetchOptions,
    enabled: shouldFetch && (fetchOptions.enabled !== false),
    dependencies: [shouldFetch, user?.id, ...(fetchOptions.dependencies || [])]
  })
}
