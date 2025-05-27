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

interface UseUpcomingSessionsReturn {
  sessions: Event[]
  loading: boolean
  error: string | null
  refresh: () => void
}

// Global cache and request tracking for upcoming sessions
const sessionsCache = new Map<string, { data: Event[]; timestamp: number }>()
const activeSessionRequests = new Set<string>()
const SESSIONS_CACHE_TTL = 2 * 60 * 1000 // 2 minutes

export function useUpcomingSessions(refreshTrigger?: number, limit = 3): UseUpcomingSessionsReturn {
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

    const cacheKey = `upcoming-sessions-${user.id}-${refreshTrigger || 0}-${limit}`

    // Check if request is already in progress
    if (activeSessionRequests.has(cacheKey)) {
      console.log('Upcoming sessions request already in progress')
      return
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = sessionsCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < SESSIONS_CACHE_TTL) {
        console.log('Using cached upcoming sessions')
        setSessions(cached.data)
        setLoading(false)
        setError(null)
        return
      }
    }

    // Mark request as active
    activeSessionRequests.add(cacheKey)
    setLoading(true)
    setError(null)

    try {
      console.log('Fetching fresh upcoming sessions for user:', user.id)

      // First, test basic access to events table
      console.log('Testing basic events table access...')
      const { data: testData, error: testError } = await supabase
        .from('events')
        .select('id, title, created_by')
        .eq('created_by', user.id)
        .limit(1)

      if (testError) {
        console.error('Basic events table access failed:', testError)
        throw new Error(`Database access error: ${testError.message || testError.code || 'Cannot access events table'}`)
      }

      console.log('Basic events access successful, found', testData?.length || 0, 'events')

      // Now get upcoming sessions created by user
      // Use a more lenient time filter - show events from 1 hour ago to future
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      const { data: events, error: eventsError } = await supabase
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
        .gte('date_time', oneHourAgo.toISOString())
        .order('date_time', { ascending: true })
        .limit(limit)

      if (eventsError) {
        console.error('Error loading upcoming sessions:', eventsError)
        console.error('Query details:', {
          userId: user.id,
          table: 'events',
          filter: 'created_by',
          dateFilter: new Date().toISOString()
        })
        throw new Error(`Database error: ${eventsError.message || eventsError.code || 'Unknown error'}`)
      }

      console.log('Found', events?.length || 0, 'upcoming events')
      console.log('Events data:', events)
      console.log('Filter time (1 hour ago):', oneHourAgo.toISOString())
      console.log('Current time:', new Date().toISOString())

      // For now, skip RSVP counts to isolate the issue
      const eventsWithRSVPs = (events || []).map(event => ({
        ...event,
        rsvp_count: 0 // Temporarily set to 0 to isolate the main query issue
      }))

      console.log('Events with placeholder RSVP counts:', eventsWithRSVPs)

      // Cache the result
      sessionsCache.set(cacheKey, {
        data: eventsWithRSVPs,
        timestamp: Date.now()
      })

      // Only update state if component is still mounted
      if (mountedRef.current) {
        setSessions(eventsWithRSVPs)
        console.log('Upcoming sessions updated:', eventsWithRSVPs.length, 'sessions')
      }

    } catch (err) {
      console.error('Error fetching upcoming sessions:', err)
      if (mountedRef.current) {
        setError('Failed to load upcoming sessions')
      }
    } finally {
      // Clean up
      activeSessionRequests.delete(cacheKey)
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  // Load sessions when user changes or refresh trigger changes
  useEffect(() => {
    fetchSessions()
  }, [user?.id, refreshTrigger])

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
export const clearUpcomingSessionsCache = () => {
  sessionsCache.clear()
  activeSessionRequests.clear()
}
