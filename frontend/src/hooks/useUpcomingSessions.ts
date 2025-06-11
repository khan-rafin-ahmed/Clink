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
  is_public?: boolean
  vibe?: string
  drink_type?: string
  event_code?: string
  public_slug?: string
  private_slug?: string
  cover_image_url?: string
  user_rsvp_status?: string
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
const SESSIONS_CACHE_TTL = 3 * 60 * 1000 // 3 minutes

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

      // Use the database function to get all accessible upcoming events
      // This includes events the user created, RSVP'd to, or was invited to
      const { data: events, error: eventsError } = await supabase.rpc('get_user_accessible_events', {
        user_id: user.id,
        include_past: false,
        event_limit: limit
      })

      if (eventsError) {
        console.error('Error loading upcoming sessions:', eventsError)
        throw new Error(`Database error: ${eventsError.message || eventsError.code || 'Unknown error'}`)
      }

      console.log('Found', events?.length || 0, 'upcoming events')
      console.log('Events data:', events)

      const upcomingEvents = events || []

      // Cache the result
      sessionsCache.set(cacheKey, {
        data: upcomingEvents,
        timestamp: Date.now()
      })

      // Only update state if component is still mounted
      if (mountedRef.current) {
        setSessions(upcomingEvents)
        console.log('Upcoming sessions updated:', upcomingEvents.length, 'sessions')
      }

    } catch (err) {
      console.error('Error fetching upcoming sessions:', err)
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load upcoming sessions')
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
