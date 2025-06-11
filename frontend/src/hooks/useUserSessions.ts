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
  is_public: boolean
  vibe?: string
  drink_type?: string
  event_code?: string
  public_slug?: string
  private_slug?: string
  cover_image_url?: string
  user_rsvp_status?: string
}

interface UseUserSessionsReturn {
  upcomingSessions: Event[]
  pastSessions: Event[]
  loading: boolean
  error: string | null
  refresh: () => void
}

// Global cache and request tracking for user sessions
const sessionsCache = new Map<string, { data: { upcoming: Event[], past: Event[] }; timestamp: number }>()
const activeSessionRequests = new Set<string>()
const SESSIONS_CACHE_TTL = 3 * 60 * 1000 // 3 minutes

export function useUserSessions(refreshTrigger?: number): UseUserSessionsReturn {
  const { user } = useAuth()
  const [upcomingSessions, setUpcomingSessions] = useState<Event[]>([])
  const [pastSessions, setPastSessions] = useState<Event[]>([])
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
      setUpcomingSessions([])
      setPastSessions([])
      setLoading(false)
      return
    }

    const cacheKey = `user-sessions-${user.id}-${refreshTrigger || 0}`

    // Check if request is already in progress
    if (activeSessionRequests.has(cacheKey)) {
      console.log('User sessions request already in progress')
      return
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = sessionsCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < SESSIONS_CACHE_TTL) {
        console.log('Using cached user sessions')
        setUpcomingSessions(cached.data.upcoming)
        setPastSessions(cached.data.past)
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
      console.log('Fetching fresh user sessions for user:', user.id)

      // Use the database function to get all accessible events
      const [upcomingResult, pastResult] = await Promise.all([
        // Get upcoming events (hosted, RSVP'd, or invited)
        supabase.rpc('get_user_accessible_events', {
          user_id: user.id,
          include_past: false,
          event_limit: 50
        }),

        // Get past events (hosted or attended)
        supabase.rpc('get_user_accessible_events', {
          user_id: user.id,
          include_past: true,
          event_limit: 50
        })
      ])

      if (upcomingResult.error) {
        console.error('Error loading upcoming sessions:', upcomingResult.error)
        throw new Error(`Failed to load upcoming sessions: ${upcomingResult.error.message}`)
      }

      if (pastResult.error) {
        console.error('Error loading past sessions:', pastResult.error)
        throw new Error(`Failed to load past sessions: ${pastResult.error.message}`)
      }

      const upcomingEvents = upcomingResult.data || []
      const pastEvents = pastResult.data || []

      console.log('Found', upcomingEvents.length, 'upcoming events')
      console.log('Found', pastEvents.length, 'past events')

      // Cache the result
      sessionsCache.set(cacheKey, {
        data: {
          upcoming: upcomingEvents,
          past: pastEvents
        },
        timestamp: Date.now()
      })

      // Only update state if component is still mounted
      if (mountedRef.current) {
        setUpcomingSessions(upcomingEvents)
        setPastSessions(pastEvents)
        console.log('User sessions updated:', upcomingEvents.length, 'upcoming,', pastEvents.length, 'past')
      }

    } catch (err) {
      console.error('Error fetching user sessions:', err)
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions')
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
    upcomingSessions,
    pastSessions,
    loading,
    error,
    refresh
  }
}

// Hook for getting just upcoming sessions with a limit (for dashboard/widgets)
export function useUpcomingSessions(refreshTrigger?: number, limit = 3): {
  sessions: Event[]
  loading: boolean
  error: string | null
  refresh: () => void
} {
  const { upcomingSessions, loading, error, refresh } = useUserSessions(refreshTrigger)
  
  return {
    sessions: upcomingSessions.slice(0, limit),
    loading,
    error,
    refresh
  }
}

// Hook for getting just past sessions with a limit
export function usePastSessions(refreshTrigger?: number, limit = 10): {
  sessions: Event[]
  loading: boolean
  error: string | null
  refresh: () => void
} {
  const { pastSessions, loading, error, refresh } = useUserSessions(refreshTrigger)
  
  return {
    sessions: pastSessions.slice(0, limit),
    loading,
    error,
    refresh
  }
}
