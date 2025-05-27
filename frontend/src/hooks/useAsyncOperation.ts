import { useState, useEffect, useRef, useCallback } from 'react'

interface AsyncOperationState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseAsyncOperationOptions {
  immediate?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useAsyncOperation<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseAsyncOperationOptions = {}
) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const mountedRef = useRef(true)
  const { immediate = true, onSuccess, onError } = options

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(async () => {
    if (!mountedRef.current) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await asyncFunction()
      
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null })
        onSuccess?.(result)
      }
    } catch (error: any) {
      if (mountedRef.current) {
        const errorMessage = error.message || 'An unexpected error occurred'
        setState(prev => ({ ...prev, loading: false, error: errorMessage }))
        onError?.(error)
      }
    }
  }, [asyncFunction, onSuccess, onError])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [...dependencies, execute, immediate])

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}

// Hook for handling multiple async operations
export function useAsyncOperations() {
  const [operations, setOperations] = useState<Map<string, AsyncOperationState<any>>>(new Map())
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const execute = useCallback(async <T>(
    key: string,
    asyncFunction: () => Promise<T>,
    options: UseAsyncOperationOptions = {}
  ) => {
    if (!mountedRef.current) return

    setOperations(prev => new Map(prev.set(key, {
      data: null,
      loading: true,
      error: null
    })))

    try {
      const result = await asyncFunction()
      
      if (mountedRef.current) {
        setOperations(prev => new Map(prev.set(key, {
          data: result,
          loading: false,
          error: null
        })))
        options.onSuccess?.(result)
      }
    } catch (error: any) {
      if (mountedRef.current) {
        const errorMessage = error.message || 'An unexpected error occurred'
        setOperations(prev => new Map(prev.set(key, {
          data: null,
          loading: false,
          error: errorMessage
        })))
        options.onError?.(error)
      }
    }
  }, [])

  const getOperation = useCallback((key: string) => {
    return operations.get(key) || { data: null, loading: false, error: null }
  }, [operations])

  const reset = useCallback((key?: string) => {
    if (key) {
      setOperations(prev => {
        const newMap = new Map(prev)
        newMap.delete(key)
        return newMap
      })
    } else {
      setOperations(new Map())
    }
  }, [])

  return {
    execute,
    getOperation,
    reset,
    operations
  }
}
