import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

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

export function useUserStats(refreshTrigger?: number): UseUserStatsReturn {
  const { user } = useAuth()
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
    if (!user?.id) {
      setStats({ totalEvents: 0, upcomingEvents: 0, totalRSVPs: 0 })
      setLoading(false)
      return
    }

    const cacheKey = `stats-${user.id}-${refreshTrigger || 0}`

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
      // Use count queries for better performance
      const [totalEventsResult, upcomingEventsResult, totalRSVPsResult] = await Promise.allSettled([
        // Total events count
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id),

        // Upcoming events count
        supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('created_by', user.id)
          .gte('date_time', new Date().toISOString()),

        // Total RSVPs count
        supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ])

      const newStats: UserStatsData = {
        totalEvents: totalEventsResult.status === 'fulfilled' ? (totalEventsResult.value.count || 0) : 0,
        upcomingEvents: upcomingEventsResult.status === 'fulfilled' ? (upcomingEventsResult.value.count || 0) : 0,
        totalRSVPs: totalRSVPsResult.status === 'fulfilled' ? (totalRSVPsResult.value.count || 0) : 0
      }

      // Cache the result
      statsCache.set(cacheKey, {
        data: newStats,
        timestamp: Date.now()
      })

      // Only update state if component is still mounted
      if (mountedRef.current) {
        setStats(newStats)
        console.log('Stats updated:', newStats)
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

  // Load stats when user changes or refresh trigger changes
  useEffect(() => {
    fetchStats()
  }, [user?.id, refreshTrigger])

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
