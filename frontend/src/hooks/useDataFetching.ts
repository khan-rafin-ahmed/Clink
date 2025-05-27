import { useState, useEffect, useRef, useCallback } from 'react'

export type DataState = 'idle' | 'loading' | 'success' | 'error'

interface DataFetchingState<T> {
  data: T | null
  state: DataState
  error: string | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isEmpty: boolean
}

interface UseDataFetchingOptions<T> {
  immediate?: boolean
  dependencies?: any[]
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retryCount?: number
  retryDelay?: number
}

/**
 * Robust data fetching hook with proper state management
 * Prevents race conditions and handles all loading states
 */
export function useDataFetching<T>(
  fetchFunction: () => Promise<T>,
  options: UseDataFetchingOptions<T> = {}
): DataFetchingState<T> & {
  refetch: () => Promise<void>
  reset: () => void
} {
  const {
    immediate = true,
    dependencies = [],
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000
  } = options

  const [state, setState] = useState<DataFetchingState<T>>({
    data: null,
    state: 'idle',
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    isEmpty: false
  })

  const mountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const fetchFunctionRef = useRef(fetchFunction)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  // Update refs when values change
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  })

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  const executeWithRetry = useCallback(async (attempt = 0): Promise<void> => {
    if (!mountedRef.current) return

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      setState(prev => ({
        ...prev,
        state: 'loading',
        isLoading: true,
        isSuccess: false,
        isError: false,
        error: null
      }))

      const result = await fetchFunctionRef.current()

      if (!mountedRef.current) return

      const isEmpty = Array.isArray(result) ? result.length === 0 : !result

      setState({
        data: result,
        state: 'success',
        error: null,
        isLoading: false,
        isSuccess: true,
        isError: false,
        isEmpty
      })

      onSuccessRef.current?.(result)
    } catch (error: any) {
      if (!mountedRef.current) return

      // Don't handle aborted requests as errors
      if (error.name === 'AbortError') return

      const errorMessage = error.message || 'An unexpected error occurred'

      // Retry logic
      if (attempt < retryCount) {
        retryTimeoutRef.current = setTimeout(() => {
          executeWithRetry(attempt + 1)
        }, retryDelay * Math.pow(2, attempt)) // Exponential backoff
        return
      }

      setState(prev => ({
        ...prev,
        state: 'error',
        error: errorMessage,
        isLoading: false,
        isSuccess: false,
        isError: true
      }))

      onErrorRef.current?.(error)
    }
  }, [retryCount, retryDelay]) // Remove fetchFunction, onSuccess, onError from dependencies

  const refetch = useCallback(async () => {
    await executeWithRetry()
  }, [executeWithRetry])

  const reset = useCallback(() => {
    setState({
      data: null,
      state: 'idle',
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
      isEmpty: false
    })
  }, [])

  useEffect(() => {
    if (immediate) {
      executeWithRetry()
    }
  }, [immediate, ...dependencies])

  return {
    ...state,
    refetch,
    reset
  }
}

/**
 * Hook for fetching data that depends on auth state
 * Only fetches when auth is ready and optionally when user is authenticated
 */
export function useAuthDependentData<T>(
  fetchFunction: () => Promise<T>,
  authReady: boolean,
  requireAuth: boolean = false,
  userExists: boolean = false,
  options: Omit<UseDataFetchingOptions<T>, 'immediate'> = {}
) {
  const shouldFetch = authReady && (!requireAuth || userExists)

  return useDataFetching(fetchFunction, {
    ...options,
    immediate: shouldFetch,
    dependencies: [authReady, userExists, ...(options.dependencies || [])]
  })
}
