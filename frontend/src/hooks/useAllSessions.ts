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
  const { user, isInitialized } = useAuth()
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
    // Don't fetch until auth is initialized
    if (!isInitialized) {
      return
    }

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

      // Get events first
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

      if (!events || events.length === 0) {
        // Cache empty result
        allSessionsCache.set(cacheKey, {
          data: [],
          timestamp: Date.now()
        })
        if (mountedRef.current) {
          setSessions([])
        }
        return
      }

      // Get RSVP counts for all events in a single query
      const eventIds = events.map(e => e.id)
      const { data: rsvpCounts, error: rsvpError } = await supabase
        .from('rsvps')
        .select('event_id')
        .in('event_id', eventIds)
        .eq('status', 'going')

      if (rsvpError) {
        console.warn('Failed to get RSVP counts:', rsvpError)
      }

      // Count RSVPs per event
      const rsvpCountMap = new Map<string, number>()
      if (rsvpCounts) {
        rsvpCounts.forEach(rsvp => {
          const count = rsvpCountMap.get(rsvp.event_id) || 0
          rsvpCountMap.set(rsvp.event_id, count + 1)
        })
      }

      // Combine events with RSVP counts
      const eventsWithRSVPs = events.map(event => ({
        ...event,
        rsvp_count: rsvpCountMap.get(event.id) || 0
      }))

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

  // Load sessions when auth is initialized and user, filter, or refresh trigger changes
  useEffect(() => {
    fetchSessions()
  }, [isInitialized, user?.id, filter, refreshTrigger])

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
