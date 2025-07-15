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

      // SIMPLIFIED: Get all event IDs the user is associated with
      const [
        createdEventsResult,
        rsvpEventsResult,
        invitedEventsResult
      ] = await Promise.allSettled([
        // 1. Events user created
        supabase
          .from('events')
          .select('id, date_time')
          .eq('created_by', targetUserId),

        // 2. Events user RSVP'd to with 'going' status
        supabase
          .from('rsvps')
          .select('event_id')
          .eq('user_id', targetUserId)
          .eq('status', 'going'),

        // 3. Events user was directly invited to with 'accepted' status
        supabase
          .from('event_members')
          .select('event_id')
          .eq('user_id', targetUserId)
          .eq('status', 'accepted')
      ])

      console.log('🔍 Stats Debug - targetUserId:', targetUserId)
      console.log('🔍 Stats Debug - createdEvents:', createdEventsResult)
      console.log('🔍 Stats Debug - rsvpEvents:', rsvpEventsResult)
      console.log('🔍 Stats Debug - invitedEvents:', invitedEventsResult)

      // Collect all unique event IDs (with detailed debugging)
      const allEventIds = new Set<string>()
      const createdEventIds = new Set<string>()
      const rsvpEventIds = new Set<string>()
      const invitedEventIds = new Set<string>()

      // Process created events
      if (createdEventsResult.status === 'fulfilled' && createdEventsResult.value.data) {
        createdEventsResult.value.data.forEach((event: any) => {
          allEventIds.add(event.id)
          createdEventIds.add(event.id)
        })
      }
      console.log('🔍 Stats Debug - Created events count:', createdEventIds.size)
      console.log('🔍 Stats Debug - Created event IDs:', Array.from(createdEventIds))

      // Process RSVP events
      if (rsvpEventsResult.status === 'fulfilled' && rsvpEventsResult.value.data) {
        rsvpEventsResult.value.data.forEach((rsvp: any) => {
          allEventIds.add(rsvp.event_id)
          rsvpEventIds.add(rsvp.event_id)
        })
      }
      console.log('🔍 Stats Debug - RSVP events count:', rsvpEventIds.size)
      console.log('🔍 Stats Debug - RSVP event IDs:', Array.from(rsvpEventIds))

      // Process invited events
      if (invitedEventsResult.status === 'fulfilled' && invitedEventsResult.value.data) {
        invitedEventsResult.value.data.forEach((member: any) => {
          allEventIds.add(member.event_id)
          invitedEventIds.add(member.event_id)
        })
      }
      console.log('🔍 Stats Debug - Invited events count:', invitedEventIds.size)
      console.log('🔍 Stats Debug - Invited event IDs:', Array.from(invitedEventIds))

      // Calculate stats (simplified - just count unique events)
      const totalEvents = allEventIds.size
      console.log('🔍 Stats Debug - Final totalEvents:', totalEvents)
      console.log('🔍 Stats Debug - All event IDs:', Array.from(allEventIds))

      // Get total RSVPs count (separate from events)
      const totalRSVPsResult = await supabase
        .from('rsvps')
        .select('id', { count: 'exact' })
        .eq('user_id', targetUserId)
        .limit(1)

      console.log('🔍 Stats Debug - RSVPs result:', totalRSVPsResult)

      const newStats: UserStatsData = {
        totalEvents,
        upcomingEvents: 0, // Simplified for now to focus on totalEvents bug
        totalRSVPs: totalRSVPsResult.count || 0
      }

      console.log('🔍 Stats Debug - Final stats:', newStats)

      // Progress tracking - log the improvement
      const statsBreakdown = {
        totalEvents: newStats.totalEvents,
        upcomingEvents: newStats.upcomingEvents,
        totalRSVPs: newStats.totalRSVPs,
        breakdown: {
          createdEvents: createdEventsResult.status === 'fulfilled' ? createdEventsResult.value.data?.length || 0 : 0,
          rsvpEvents: rsvpEventsResult.status === 'fulfilled' ? rsvpEventsResult.value.data?.length || 0 : 0,
          invitedEvents: invitedEventsResult.status === 'fulfilled' ? invitedEventsResult.value.data?.length || 0 : 0,
          crewEvents: 0 // Simplified for now
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
        console.log('🔍 Stats Debug - About to setStats:', newStats)
        setStats(newStats)
        console.log('🔍 Stats Debug - setStats called successfully')
      } else {
        console.log('🔍 Stats Debug - Component unmounted, not setting stats')
      }

    } catch (err) {
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
    if (targetUserId) {
      fetchStats()
    }
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
