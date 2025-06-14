import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { progressTracker } from '@/lib/progressTracker'

interface UserStatsData {
  totalEvents: number
  upcomingEvents: number
  totalRSVPs: number
}

interface UseUserStatsReturn {
  stats: UserStatsData
  loading: boolean
  error: string | null
  refresh: () => void
}

// Global cache and request tracking
const statsCache = new Map<string, { data: UserStatsData; timestamp: number }>()
const activeRequests = new Set<string>()
const CACHE_TTL = 3 * 60 * 1000 // 3 minutes

export function useUserStats(refreshTrigger?: number, userId?: string): UseUserStatsReturn {
  const { user } = useAuth()
  const targetUserId = userId || user?.id
  const [stats, setStats] = useState<UserStatsData>({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRSVPs: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchStats = async (forceRefresh = false) => {
    if (!targetUserId) {
      setStats({ totalEvents: 0, upcomingEvents: 0, totalRSVPs: 0 })
      setLoading(false)
      return
    }

    const cacheKey = `stats-${targetUserId}-${refreshTrigger || 0}`

    // Check if request is already in progress
    if (activeRequests.has(cacheKey)) {
      console.log('Stats request already in progress')
      return
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = statsCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('Using cached stats')
        setStats(cached.data)
        setLoading(false)
        setError(null)
        return
      }
    }

    // Mark request as active
    activeRequests.add(cacheKey)
    setLoading(true)
    setError(null)

    try {
      const now = new Date().toISOString()

      // Get all event IDs the user is associated with
      const [
        createdEventsResult,
        rsvpEventsResult,
        invitedEventsResult,
        crewEventsResult
      ] = await Promise.allSettled([
        // 1. Events user created
        supabase
          .from('events')
          .select('id, date_time')
          .eq('created_by', targetUserId),

        // 2. Events user RSVP'd to with 'going' status
        supabase
          .from('rsvps')
          .select('event_id, events!inner(id, date_time)')
          .eq('user_id', targetUserId)
          .eq('status', 'going'),

        // 3. Events user was directly invited to with 'accepted' status
        supabase
          .from('event_members')
          .select('event_id, events!inner(id, date_time)')
          .eq('user_id', targetUserId)
          .eq('status', 'accepted'),

        // 4. Events from crews user belongs to
        supabase
          .from('crew_members')
          .select(`
            crew_id,
            crews!inner(
              events!inner(id, date_time)
            )
          `)
          .eq('user_id', targetUserId)
          .eq('status', 'accepted')
      ])

      // Collect all unique event IDs and their dates
      const allEventIds = new Set<string>()
      const eventDates: Record<string, string> = {}

      // Process created events
      if (createdEventsResult.status === 'fulfilled' && createdEventsResult.value.data) {
        createdEventsResult.value.data.forEach((event: any) => {
          allEventIds.add(event.id)
          eventDates[event.id] = event.date_time
        })
      }

      // Process RSVP events
      if (rsvpEventsResult.status === 'fulfilled' && rsvpEventsResult.value.data) {
        rsvpEventsResult.value.data.forEach((rsvp: any) => {
          if (rsvp.events) {
            allEventIds.add(rsvp.events.id)
            eventDates[rsvp.events.id] = rsvp.events.date_time
          }
        })
      }

      // Process invited events
      if (invitedEventsResult.status === 'fulfilled' && invitedEventsResult.value.data) {
        invitedEventsResult.value.data.forEach((member: any) => {
          if (member.events) {
            allEventIds.add(member.events.id)
            eventDates[member.events.id] = member.events.date_time
          }
        })
      }

      // Process crew events
      if (crewEventsResult.status === 'fulfilled' && crewEventsResult.value.data) {
        crewEventsResult.value.data.forEach((crewMember: any) => {
          if (crewMember.crews?.events) {
            crewMember.crews.events.forEach((event: any) => {
              allEventIds.add(event.id)
              eventDates[event.id] = event.date_time
            })
          }
        })
      }

      // Calculate stats
      const totalEvents = allEventIds.size
      const upcomingEvents = Array.from(allEventIds).filter(eventId =>
        eventDates[eventId] && new Date(eventDates[eventId]) >= new Date(now)
      ).length

      // Get total RSVPs count (separate from events)
      const totalRSVPsResult = await supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)

      const newStats: UserStatsData = {
        totalEvents,
        upcomingEvents,
        totalRSVPs: totalRSVPsResult.count || 0
      }

      // Progress tracking - log the improvement
      const statsBreakdown = {
        totalEvents: newStats.totalEvents,
        upcomingEvents: newStats.upcomingEvents,
        totalRSVPs: newStats.totalRSVPs,
        breakdown: {
          createdEvents: createdEventsResult.status === 'fulfilled' ? createdEventsResult.value.data?.length || 0 : 0,
          rsvpEvents: rsvpEventsResult.status === 'fulfilled' ? rsvpEventsResult.value.data?.length || 0 : 0,
          invitedEvents: invitedEventsResult.status === 'fulfilled' ? invitedEventsResult.value.data?.length || 0 : 0,
          crewEvents: crewEventsResult.status === 'fulfilled' ?
            crewEventsResult.value.data?.reduce((acc: number, crew: any) =>
              acc + (crew.crews?.events?.length || 0), 0) || 0 : 0
        }
      }

      progressTracker.trackStatsCalculation(targetUserId, statsBreakdown)

      // Cache the result
      statsCache.set(cacheKey, {
        data: newStats,
        timestamp: Date.now()
      })

      // Only update state if component is still mounted
      if (mountedRef.current) {
        setStats(newStats)
      }

    } catch (err) {
      console.error('Error fetching user stats:', err)
      if (mountedRef.current) {
        setError('Failed to load stats')
      }
    } finally {
      // Clean up
      activeRequests.delete(cacheKey)
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }

  // Load stats when target user changes or refresh trigger changes
  useEffect(() => {
    fetchStats()
  }, [targetUserId, refreshTrigger])

  const refresh = () => {
    fetchStats(true)
  }

  return {
    stats,
    loading,
    error,
    refresh
  }
}

// Utility function to clear cache
export const clearUserStatsCache = () => {
  statsCache.clear()
  activeRequests.clear()
}
