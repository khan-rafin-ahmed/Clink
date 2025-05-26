import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

interface Event {
  id: string
  title: string
  notes?: string
  location: string
  date_time: string
  created_by: string
  rsvp_count?: number
}

type FilterType = 'all' | 'upcoming' | 'past'

interface UseAllSessionsReturn {
  sessions: Event[]
  loading: boolean
  error: string | null
  refresh: () => void
}

// Global cache and request tracking for all sessions
const allSessionsCache = new Map<string, { data: Event[]; timestamp: number }>()
const activeAllSessionsRequests = new Set<string>()
const ALL_SESSIONS_CACHE_TTL = 3 * 60 * 1000 // 3 minutes

export function useAllSessions(filter: FilterType = 'all', refreshTrigger?: number): UseAllSessionsReturn {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchSessions = async (forceRefresh = false) => {
    if (!user?.id) {
      setSessions([])
      setLoading(false)
      return
    }

    const cacheKey = `all-sessions-${user.id}-${filter}-${refreshTrigger || 0}`

    // Check if request is already in progress
    if (activeAllSessionsRequests.has(cacheKey)) {
      console.log('All sessions request already in progress')
      return
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = allSessionsCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < ALL_SESSIONS_CACHE_TTL) {
        console.log('Using cached all sessions')
        setSessions(cached.data)
        setLoading(false)
        setError(null)
        return
      }
    }

    // Mark request as active
    activeAllSessionsRequests.add(cacheKey)
    setLoading(true)
    setError(null)

    try {
      console.log('Fetching fresh sessions for user:', user.id, 'filter:', filter)

      let query = supabase
        .from('events')
        .select(`
          id,
          title,
          notes,
          location,
          date_time,
          created_by
        `)
        .eq('created_by', user.id)
        .order('date_time', { ascending: false })

      // Apply filter
      const now = new Date().toISOString()
      if (filter === 'upcoming') {
        query = query.gte('date_time', now)
      } else if (filter === 'past') {
        query = query.lt('date_time', now)
      }

      const { data: events, error: eventsError } = await query

      if (eventsError) {
        console.error('Error loading sessions:', eventsError)
        throw eventsError
      }

      // Get RSVP counts for each event (in parallel)
      const eventsWithRSVPs = await Promise.all(
        (events || []).map(async (event) => {
          try {
            const { count } = await supabase
              .from('rsvps')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id)
              .eq('status', 'going')

            return {
              ...event,
              rsvp_count: count || 0
            }
          } catch (rsvpError) {
            console.warn('Failed to get RSVP count for event:', event.id, rsvpError)
            return {
              ...event,
              rsvp_count: 0
            }
          }
        })
      )

      // Cache the result
      allSessionsCache.set(cacheKey, {
        data: eventsWithRSVPs,
        timestamp: Date.now()
      })

      // Only update state if component is still mounted
      if (mountedRef.current) {
        setSessions(eventsWithRSVPs)
        console.log('All sessions updated:', eventsWithRSVPs.length, 'sessions')
      }

    } catch (err) {
      console.error('Error fetching sessions:', err)
      if (mountedRef.current) {
        setError('Failed to load sessions')
      }
    } finally {
      // Clean up
      activeAllSessionsRequests.delete(cacheKey)
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  // Load sessions when user, filter, or refresh trigger changes
  useEffect(() => {
    fetchSessions()
  }, [user?.id, filter, refreshTrigger])

  const refresh = () => {
    fetchSessions(true)
  }

  return {
    sessions,
    loading,
    error,
    refresh
  }
}

// Utility function to clear cache
export const clearAllSessionsCache = () => {
  allSessionsCache.clear()
  activeAllSessionsRequests.clear()
}
