import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useOptimizedNavigation, usePageDataCache } from '@/hooks/useOptimizedNavigation'
import { getEventBySlug } from '@/lib/eventService'
import { supabase } from '@/lib/supabase'
import { FullPageSkeleton } from '@/components/SkeletonLoaders'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { EventWithRsvps } from '@/types'

interface EventDetailData {
  event: EventWithRsvps
  host: any
  participants: any[]
  isJoined: boolean
}

/**
 * Optimized Event Detail component that prevents unnecessary reloads
 * and maintains state during navigation
 */
export function OptimizedEventDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { user, isReady: isAuthReady } = useAuth()
  const { goBackSmart } = useOptimizedNavigation()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventData, setEventData] = useState<EventDetailData | null>(null)
  
  const mountedRef = useRef(true)
  const loadingRef = useRef(false)
  
  // Determine if this is a private event based on URL
  const isPrivateEvent = window.location.pathname.startsWith('/private-event/')
  
  // Set up page data caching
  const {
    getCachedData,
    setCachedData,
    fetchWithCache,
    invalidateCache
  } = usePageDataCache<EventDetailData>(
    `event_detail_${slug}`,
    () => loadEventData(),
    {
      ttl: 300000, // 5 minutes
      dependencies: [slug, user?.id],
      enabled: !!slug && isAuthReady
    }
  )

  // Clean up on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Load event data with caching
  const loadEventData = useCallback(async (): Promise<EventDetailData> => {
    if (!slug) throw new Error('No event slug provided')
    
    // Load event details
    const event = await getEventBySlug(slug, isPrivateEvent, user || null)
    if (!event) throw new Error('Event not found')

    // Load RSVPs
    const { data: rsvpData } = await supabase
      .from('rsvps')
      .select('id, status, user_id')
      .eq('event_id', event.id)

    event.rsvps = rsvpData || []

    // Load event members
    const { data: memberData } = await supabase
      .from('event_members')
      .select('id, status, user_id')
      .eq('event_id', event.id)
      .eq('status', 'accepted')

    event.event_members = memberData || []

    // Compute if user is joined
    const isJoined = user ? computeIsJoined(event, user) : false

    // Load host information
    const { data: hostProfile } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url')
      .eq('user_id', event.created_by)
      .single()

    const host = hostProfile
      ? {
          id: hostProfile.user_id,
          display_name: hostProfile.display_name,
          avatar_url: hostProfile.avatar_url
        }
      : {
          id: event.created_by,
          display_name: null,
          avatar_url: null
        }

    // Load participant profiles
    const rsvpUserIds = event.rsvps.map(r => r.user_id)
    const memberUserIds = event.event_members?.map(m => m.user_id) || []
    const allUserIds = Array.from(new Set([...rsvpUserIds, ...memberUserIds]))

    let participants: any[] = []
    if (allUserIds.length > 0) {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', allUserIds)

      participants = profileData || []
    }

    return {
      event: { ...event, host },
      host,
      participants,
      isJoined
    }
  }, [slug, isPrivateEvent, user])

  // Helper function to compute if user is joined
  const computeIsJoined = (event: EventWithRsvps, user: any): boolean => {
    if (!user) return false
    
    // Check if user is the host
    if (event.created_by === user.id) return true
    
    // Check RSVPs
    const userRsvp = event.rsvps?.find(r => r.user_id === user.id)
    if (userRsvp?.status === 'going') return true
    
    // Check event members
    const userMember = event.event_members?.find(m => m.user_id === user.id)
    if (userMember?.status === 'accepted') return true
    
    return false
  }

  // Load event data when component mounts or dependencies change
  useEffect(() => {
    if (!isAuthReady || !slug || loadingRef.current) return

    const loadData = async () => {
      if (!mountedRef.current) return
      
      loadingRef.current = true
      setLoading(true)
      setError(null)

      try {
        // Try to get cached data first
        const cached = getCachedData()
        if (cached) {
          setEventData(cached)
          setLoading(false)
          loadingRef.current = false
          return
        }

        // Fetch fresh data
        const data = await fetchWithCache()
        
        if (mountedRef.current) {
          setEventData(data)
          setLoading(false)
        }
      } catch (err: any) {
        if (mountedRef.current) {
          setError(err.message || 'Failed to load event')
          setLoading(false)
          
          if (err.message === 'Event not found') {
            toast.error('Event not found')
            goBackSmart()
          }
        }
      } finally {
        loadingRef.current = false
      }
    }

    loadData()
  }, [isAuthReady, slug, getCachedData, fetchWithCache, goBackSmart])

  // Refresh data function
  const refreshData = useCallback(async () => {
    invalidateCache()
    setLoading(true)
    setError(null)
    
    try {
      const data = await fetchWithCache()
      if (mountedRef.current) {
        setEventData(data)
        setLoading(false)
      }
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.message || 'Failed to refresh event data')
        setLoading(false)
      }
    }
  }, [invalidateCache, fetchWithCache])

  // Show loading state
  if (!isAuthReady || loading) {
    return <FullPageSkeleton />
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-md">
          <img
            src="/thirstee-logo.svg"
            alt="Thirstee"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-foreground">Error Loading Event</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={refreshData} variant="outline">
              Try Again
            </Button>
            <Button onClick={goBackSmart}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show event content
  if (!eventData) {
    return <FullPageSkeleton />
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Event content will be rendered here */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{eventData.event.title}</h1>
        <p className="text-muted-foreground mb-4">
          Hosted by {eventData.host.display_name || 'Anonymous'}
        </p>
        <p className="text-sm text-muted-foreground">
          {eventData.isJoined ? 'You are attending this event' : 'You are not attending this event'}
        </p>
        
        {/* Add more event details here */}
        <div className="mt-8">
          <Button onClick={goBackSmart} variant="outline">
            Back
          </Button>
          <Button onClick={refreshData} variant="outline" className="ml-2">
            Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}
