// frontend/src/pages/EventDetail.tsx

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useAuthState } from '@/hooks/useAuthState'
import { useSmartNavigation, useActionNavigation } from '@/hooks/useSmartNavigation'
import { supabase } from '@/lib/supabase'
import { useCachedData } from '@/hooks/useCachedData'
import { usePageFocus } from '@/hooks/usePageFocus'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShareModal } from '@/components/ShareModal'
import { JoinEventButton } from '@/components/JoinEventButton'
import { UserAvatar } from '@/components/UserAvatar'
import { UserHoverCard } from '@/components/UserHoverCard'
import { EditEventModal } from '@/components/EditEventModal'
import { DeleteEventDialog } from '@/components/DeleteEventDialog'
import { InteractiveMap } from '@/components/InteractiveMap'
import { EventGallery } from '@/components/EventGallery'
import { EventComments } from '@/components/EventComments'
import { ReviewsPanel } from '@/components/ReviewsPanel'

import { ToastRecap } from '@/components/ToastRecap'
import { toast } from 'sonner'
import { getEventCoverImage, getVibeFallbackGradient } from '@/lib/coverImageUtils'
import {
  MapPin,
  Users,
  Share2,
  ArrowLeft,
  Clock,
  Wine,
  StickyNote,
  Edit,
  Trash2,
  Crown
} from 'lucide-react'
import type { EventWithRsvps } from '@/types'
import { calculateAttendeeCount, getLocationDisplayName } from '@/lib/eventUtils'
import { getEventRatingStats } from '@/lib/eventRatingService'
import { getEventDetails, getEventBySlug } from '@/lib/eventService'
import { FullPageSkeleton } from '@/components/SkeletonLoaders'



export function EventDetail() {
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const { user, isReady: isAuthReady, error: authError } = useAuthState()
  const { goBackSmart } = useSmartNavigation()
  const { handleDeleteSuccess } = useActionNavigation()

  // Local component state
  const [event, setEvent] = useState<EventWithRsvps | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isJoined, setIsJoined] = useState(false)
  const [participantProfiles, setParticipantProfiles] = useState<
    Record<string, { display_name: string | null; nickname: string | null; avatar_url: string | null }>
  >({})
  const [sessionReady, setSessionReady] = useState(false)

  const mountedRef = useRef(true)

  // Determine if this is a private event based on the route
  const isPrivateEvent = location.pathname.startsWith('/private-event/')

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // 1️⃣ Wait for authentication to finish (useAuthState)
  useEffect(() => {
    if (!isAuthReady) return

    if (user || !isPrivateEvent) {
      setSessionReady(true)
    } else {
      setError('Please sign in to view this private event')
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
    }
  }, [isAuthReady, user, isPrivateEvent])

  // Helper to compute whether current user is "joined"
  const computeIsJoined = (
    evt: EventWithRsvps | null,
    usr: any | null
  ): boolean => {
    if (!evt || !usr) return false
    const rsvp = evt.rsvps.find(r => r.user_id === usr.id)
    const member = evt.event_members?.find(m => m.user_id === usr.id)
    return rsvp?.status === 'going' || member?.status === 'accepted'
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // 3️⃣ Cached event data fetching
  const eventCacheKey = useMemo(() =>
    `event_detail_${slug}_${isPrivateEvent ? 'private' : 'public'}`,
    [slug, isPrivateEvent]
  )

  const eventFetcher = useCallback(async () => {
    if (!slug) throw new Error('No slug provided')

    let eventData: EventWithRsvps | null = null

    if (!isPrivateEvent) {
      // Use the fixed getEventDetails function that handles both UUIDs and slugs
      try {
        eventData = await getEventDetails(slug) as EventWithRsvps
      } catch (error: any) {
        if (error.message.includes('Event not found')) {
          throw new Error('Event not found')
        }
        throw error
      }
    } else {
      // Private event logic - use getEventBySlug for consistency
      try {
        eventData = await getEventBySlug(slug, true) as EventWithRsvps
      } catch (error: any) {
        if (error.message.includes('not found')) {
          throw new Error('Private event not found')
        }
        throw error
      }
    }

    // Load RSVPs
    const { data: rsvpData, error: rsvpError } = await supabase
      .from('rsvps')
      .select('id, status, user_id')
      .eq('event_id', eventData.id)

    eventData.rsvps = rsvpError ? [] : rsvpData || []

    // Load event members (crew)
    const { data: memberData, error: memberError } = await supabase
      .from('event_members')
      .select('id, status, user_id')
      .eq('event_id', eventData.id)
      .eq('status', 'accepted')

    eventData.event_members = memberError ? [] : memberData || []

    // Load rating stats for the event
    const ratingStats = await getEventRatingStats(eventData.id)
    eventData.average_rating = ratingStats.averageRating
    eventData.total_ratings = ratingStats.totalRatings

    return eventData
  }, [slug, isPrivateEvent])

  // Use page focus to prevent unnecessary refetches
  const { markFetched } = usePageFocus()

  const {
    data: cachedEvent,
    loading: eventLoading,
    error: eventError,
    refetch: refetchEvent
  } = useCachedData({
    cacheKey: eventCacheKey,
    fetcher: eventFetcher,
    ttl: 2 * 60 * 1000, // 2 minutes cache
    enabled: sessionReady && !!slug,
    dependencies: [sessionReady, slug],
    onSuccess: (data) => {
      setEvent(data)
      if (user) {
        setIsJoined(computeIsJoined(data, user))
      }
      markFetched() // Mark that we've successfully fetched data
    },
    onError: (error) => {
      setError(error.message)
      if (error.message.includes('not found')) {
        goBackSmart()
      }
    }
  })

  // Load additional data after main event is cached
  useEffect(() => {
    if (!cachedEvent || !mountedRef.current) return

    const loadAdditionalData = async () => {
      // Set host information from the event data
      if (cachedEvent.creator) {
        let creatorData: any = cachedEvent.creator

        // Handle case where creator might be an array (shouldn't happen but defensive)
        if (Array.isArray(cachedEvent.creator) && cachedEvent.creator.length > 0) {
          creatorData = cachedEvent.creator[0]
        }

        // Convert creator to host format
        const hostData = {
          id: creatorData.user_id || cachedEvent.created_by,
          display_name: creatorData.display_name || null,
          nickname: creatorData.nickname || null,
          avatar_url: creatorData.avatar_url || null
        }
        setEvent(prev => (prev ? { ...prev, host: hostData } : prev))
      } else {
        // Fallback: load host information separately if creator not included
        await loadHostInfo(cachedEvent.created_by)
      }

      // Load participant profiles - INCLUDE THE HOST!
      const rsvpUserIds = cachedEvent.rsvps.map(r => r.user_id)
      const memberUserIds = cachedEvent.event_members?.map(m => m.user_id) || []
      const allUserIds = Array.from(new Set([
        cachedEvent.created_by, // Include the host/creator
        ...rsvpUserIds,
        ...memberUserIds
      ]))



      if (allUserIds.length > 0) {
        try {
          const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_id, display_name, nickname, avatar_url')
            .in('user_id', allUserIds)



          if (!mountedRef.current) return

          const profileMap: Record<string, { display_name: string | null; nickname: string | null; avatar_url: string | null }> = {}

          if (!profileError && profiles) {
            profiles.forEach(profile => {
              profileMap[profile.user_id] = {
                display_name: profile.display_name,
                nickname: profile.nickname,
                avatar_url: profile.avatar_url
              }
            })
          }

          // For users without profiles, create empty fallback entries
          allUserIds.forEach(userId => {
            if (!profileMap[userId]) {
              profileMap[userId] = {
                display_name: null,
                nickname: null,
                avatar_url: null
              }
            }
          })


          setParticipantProfiles(profileMap)
        } catch {
          // Create fallback entries for all users
          const fallbackMap: Record<string, { display_name: string | null; nickname: string | null; avatar_url: string | null }> = {}
          allUserIds.forEach(userId => {
            fallbackMap[userId] = {
              display_name: null,
              nickname: null,
              avatar_url: null
            }
          })
          setParticipantProfiles(fallbackMap)
        }
      }
    }

    loadAdditionalData()
  }, [cachedEvent])

  // Update loading and error states
  useEffect(() => {
    setLoading(eventLoading)
  }, [eventLoading])

  useEffect(() => {
    if (eventError) {
      setError(eventError.message)
    }
  }, [eventError])

  // Load host's profile info
  const loadHostInfo = async (hostId: string) => {
    if (!mountedRef.current) return

    try {
      const { data: hostProfile, error } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, nickname, avatar_url')
        .eq('user_id', hostId)
        .single()

      if (!mountedRef.current) return

      // If no profile found, provide a better fallback
      if (error && error.code === 'PGRST116') {
        const hostData = {
          id: hostId,
          display_name: `User ${hostId.slice(-4)}`, // Better fallback than "Event Host"
          nickname: null,
          avatar_url: null
        }

        if (mountedRef.current) {
          setEvent(prev => (prev ? { ...prev, host: hostData } : prev))
        }
        return
      }

      const hostData = hostProfile
        ? {
            id: hostProfile.user_id,
            display_name: hostProfile.display_name,
            nickname: hostProfile.nickname,
            avatar_url: hostProfile.avatar_url
          }
        : {
            id: hostId,
            display_name: `User ${hostId.slice(-4)}`, // Better fallback than "Event Host"
            nickname: null,
            avatar_url: null
          }

      if (mountedRef.current) {
        setEvent(prev => (prev ? { ...prev, host: hostData } : prev))
      }
    } catch (err) {
      // Error loading host info - provide fallback
      if (mountedRef.current) {
        setEvent(prev => (prev ? {
          ...prev,
          host: {
            id: hostId,
            display_name: `User ${hostId.slice(-4)}`,
            nickname: null,
            avatar_url: null
          }
        } : prev))
      }
    }
  }

  // Update join status if user or event changes
  useEffect(() => {
    setIsJoined(computeIsJoined(event, user || null))
  }, [user, event])



  // If auth state itself has an error, show that
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-md">
          <img
            src="/thirstee-logo.svg"
            alt="Thirstee"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h2 className="text-xl font-semibold text-foreground">Authentication Error</h2>
          <p className="text-muted-foreground">{authError}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // If auth isn't ready or we're loading the event, show skeleton
  if (!isAuthReady || loading) {
    return <FullPageSkeleton />
  }

  // If we set an error in state, show it
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
            <Button onClick={() => refetchEvent()} variant="outline">
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

  // If event is still null (shouldn't happen if no error), show placeholder
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="text-muted-foreground">
            This event doesn't exist or has been removed.
          </p>
          <Button onClick={goBackSmart}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Helper function to safely get creator data
  const getCreatorData = () => {
    if (!event.creator) return null
    if (Array.isArray(event.creator) && event.creator.length > 0) {
      return event.creator[0]
    }
    if (!Array.isArray(event.creator)) {
      return event.creator as any
    }
    return null
  }

  const creatorData = getCreatorData()

  // Prepare data for rendering
  const date = new Date(event.date_time).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const goingCount = calculateAttendeeCount(event as any)
  const maybeCount = event.rsvps.filter(r => r.status === 'maybe').length
  const isHost = user && event.created_by === user.id

  const rsvpAttendees = event.rsvps.filter(r => r.status === 'going')
  const eventMembers = event.event_members?.filter(m => m.status === 'accepted') || []

  // Merge RSVPs + crew members + host into a deduplicated attendees list
  const uniqueIds = new Set<string>()
  const allAttendees: Array<{
    id: string
    user_id: string
    status: string
    source: 'rsvp' | 'crew' | 'host'
  }> = []

  // Always include the host as an attendee
  if (event.created_by) {
    uniqueIds.add(event.created_by)
    allAttendees.push({
      id: `host-${event.created_by}`,
      user_id: event.created_by,
      status: 'going',
      source: 'host'
    })
  }

  rsvpAttendees.forEach(r => {
    if (!uniqueIds.has(r.user_id)) {
      uniqueIds.add(r.user_id)
      allAttendees.push({ ...r, source: 'rsvp' })
    }
  })
  eventMembers.forEach(m => {
    if (!uniqueIds.has(m.user_id)) {
      uniqueIds.add(m.user_id)
      allAttendees.push({ ...m, status: 'going', source: 'crew' })
    }
  })

  const now = new Date()
  const eventDate = new Date(event.date_time)
  const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  const isPastEvent = diffHours < 0

  const userAttended =
    user &&
    (isHost ||
      event.rsvps.some(r => r.user_id === user.id && r.status === 'going') ||
      event.event_members?.some(m => m.user_id === user.id && m.status === 'accepted'))

  // Emoji helpers
  const getDrinkEmoji = (drinkType?: string | null) => {
    const drinkEmojis: Record<string, string> = {
      beer: '🍺',
      wine: '🍷',
      whiskey: '🥃',
      cocktails: '🍸',
      shots: '🥂',
      mixed: '🍹'
    }
    return drinkEmojis[drinkType || ''] || '🍻'
  }

  const getVibeEmoji = (vibe?: string) => {
    const vibeEmojis: Record<string, string> = {
      casual: '😎',
      party: '🎉',
      chill: '🧘',
      wild: '🤪',
      classy: '🎩'
    }
    return vibeEmojis[vibe || ''] || '✨'
  }



  const formatEventTiming = (dateTime: string, endTime?: string) => {
    const startDate = new Date(dateTime)
    const startTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
    if (endTime) {
      const endDate = new Date(endTime)
      const endTimeFormatted = endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
      return `${startTime} - ${endTimeFormatted}`
    }
    return `${startTime} - All Night`
  }

  // Helper function to calculate countdown
  const getCountdownText = (dateTime: string) => {
    const eventDateTime = new Date(dateTime)
    const now = new Date()
    const diffMs = eventDateTime.getTime() - now.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffMs <= 0) return null // Event has started or passed
    if (diffHrs < 24) {
      if (diffHrs === 0) {
        return `Starting in ${diffMins}m`
      }
      return `Starting in ${diffHrs}h ${diffMins}m`
    }
    return null // Don't show countdown for events >24hrs away
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-hero"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary-muted)_0%,_transparent_70%)] opacity-10"></div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Consistent Width Container - Matching Profile Page Layout */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Navigation Header */}
        <div className="flex items-center justify-between fade-in mb-8">
          <Button variant="outline" onClick={goBackSmart} size="lg" className="group backdrop-blur-sm">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            {isHost && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(true)}
                  className="group backdrop-blur-sm"
                >
                  <Edit className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive hover:text-destructive group backdrop-blur-sm"
                >
                  <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Delete
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={() => setIsShareModalOpen(true)}
              className="group backdrop-blur-sm"
            >
              <Share2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Share
            </Button>
          </div>
        </div>

        {/* 2-Column Grid Layout: Left 55%, Right 45% */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN - Main Content (55%) */}
          <div className="lg:col-span-7 space-y-8">

            {/* 1. Event Header - NEW SECTION */}
            <div className="slide-up glass-card rounded-2xl hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.01] transition-all duration-300" style={{ animationDelay: '0.1s' }}>
              <div className="p-4 sm:p-6 space-y-4">
                {/* Vibe Tag & Event Type */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge
                    variant="secondary"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/15 transition-colors text-sm sm:text-base px-3 py-1.5"
                  >
                    <span className="text-lg sm:text-xl mr-2">{getVibeEmoji(event.vibe || undefined)}</span>
                    {event.vibe || 'Event'} Vibe
                  </Badge>
                  <Badge
                    variant={event.is_public ? 'default' : 'secondary'}
                    className={event.is_public ? 'bg-white/8 text-white border-white/15' : 'bg-white/5 text-[#B3B3B3] border-white/10'}
                  >
                    {event.is_public ? 'Public Session' : 'Private Session'}
                  </Badge>
                </div>

                {/* Date & Time with Countdown */}
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white text-base sm:text-lg">
                        {date} • {formatEventTiming(event.date_time, event.end_time)}
                      </p>
                      {getCountdownText(event.date_time) && (
                        <p className="text-white font-medium text-sm sm:text-base">
                          ⏱️ {getCountdownText(event.date_time)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location Summary */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-base sm:text-lg truncate">
                      {event.place_nickname || getLocationDisplayName(event as any)}
                    </p>
                  </div>
                </div>

                {/* Event Title H1 */}
                <div className="pt-4 border-t border-white/10">
                  <h1 className="font-heading font-bold text-2xl sm:text-3xl lg:text-4xl text-white mb-2 leading-tight">
                    {event.title}
                  </h1>
                  {/* Subtitle/Tagline if available */}
                  {event.notes && (
                    <p className="text-lg sm:text-xl text-[#B3B3B3] italic leading-relaxed">
                      "Just be present and enjoy!!"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Cover Image - Moved below header, no title overlay */}
            <div className="slide-up rounded-2xl overflow-hidden shadow-xl" style={{ animationDelay: '0.2s' }}>
              <div className="relative h-64 sm:h-80 lg:h-96">
                {getEventCoverImage(event.cover_image_url, event.vibe) ? (
                  <img
                    src={getEventCoverImage(event.cover_image_url, event.vibe)}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${getVibeFallbackGradient(event.vibe)} flex items-center justify-center relative`}>
                    <div className="text-center space-y-4">
                      <div className="text-6xl opacity-80">
                        {getVibeEmoji(event.vibe || undefined)}
                      </div>
                      <div className="text-xl text-white font-medium uppercase tracking-wide">
                        {event.vibe || 'Event'}
                      </div>
                    </div>
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="w-full h-full" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)`
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. About the Event */}
            {event.notes && (
              <div className="slide-up glass-card rounded-2xl hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.01] transition-all duration-300" style={{ animationDelay: '0.3s' }}>
                <div className="p-4 sm:p-6">
                  <h2 className="text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-white" />
                    About the Event
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-[#B3B3B3] leading-relaxed text-base sm:text-lg">{event.notes}</p>
                  </div>

                  {/* Host Notes - Collapsible section could be added here if needed */}
                </div>
              </div>
            )}

            {/* 4. Vibe Details - Horizontal Cards/Tags */}
            <div className="slide-up glass-card rounded-2xl hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.01] transition-all duration-300 mb-8" style={{ animationDelay: '0.4s' }}>
              <div className="p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">{getDrinkEmoji(event.drink_type)}</span>
                  Vibe Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Drink of the Night */}
                  {event.drink_type && (
                    <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white/5 hover:bg-white/8 rounded-xl border border-white/10 backdrop-blur-sm transition-all duration-200 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Wine className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white capitalize text-sm sm:text-base">
                          {event.drink_type}
                        </p>
                        <p className="text-xs sm:text-sm text-[#B3B3B3]">Drink of the Night</p>
                      </div>
                    </div>
                  )}

                  {/* Party Mood */}
                  {event.vibe && (
                    <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white/5 hover:bg-white/8 rounded-xl border border-white/10 backdrop-blur-sm transition-all duration-200 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl sm:text-2xl">{getVibeEmoji(event.vibe)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white capitalize text-sm sm:text-base">
                          {event.vibe} Vibe
                        </p>
                        <p className="text-xs sm:text-sm text-[#B3B3B3]">Party Mood</p>
                      </div>
                    </div>
                  )}

                  {/* Dress Code - Optional (if we had this field) */}
                  {/* Could add dress_code field to event schema in future */}
                </div>
              </div>
            </div>

            {/* 5. Who's Coming - Up to 8 attendees */}
            <div className="slide-up glass-card rounded-2xl hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.01] transition-all duration-300" style={{ animationDelay: '0.5s' }}>
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-display font-semibold text-white flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    {goingCount > 0 ? `Who's Coming (${goingCount})` : "Who's Coming"}
                  </h2>
                  {maybeCount > 0 && (
                    <Badge variant="outline" className="text-[#B3B3B3] border-white/20 bg-white/5">
                      {maybeCount} maybe
                    </Badge>
                  )}
                </div>

                {allAttendees.length === 0 ? (
                  <div className="text-center py-8">
                    {!isHost ? (
                      <>
                        <div className="text-4xl mb-3">🎉</div>
                        <h3 className="text-lg font-display font-semibold text-white mb-2">
                          Be the first to raise hell!
                        </h3>
                        <p className="text-[#B3B3B3]">
                          This party is waiting for someone legendary to get it started 🤘
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl mb-3">👥</div>
                        <h3 className="text-lg font-display font-semibold text-white mb-2">
                          No one has joined yet
                        </h3>
                        <p className="text-[#B3B3B3]">
                          Share your event to invite more legends to the party! 🍻
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Up to 8 visible attendees + +X badge for overflow */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                      {allAttendees.slice(0, 8).map((rsvp, index) => {
                        const profile = participantProfiles[rsvp.user_id] || {}

                        // Enhanced display name logic with better fallbacks
                        const getDisplayName = () => {
                          // Priority 1: Nickname (if available)
                          if (profile.nickname && profile.nickname.trim()) {
                            return profile.nickname.trim()
                          }

                          // Priority 2: Display name (if available)
                          if (profile.display_name && profile.display_name.trim()) {
                            return profile.display_name.trim()
                          }

                          // Priority 3: Check if this is the host and use host data
                          if (rsvp.user_id === event.created_by) {
                            if (event.host?.display_name) return event.host.display_name
                            if (event.host?.nickname) return event.host.nickname
                            if (creatorData?.display_name) return creatorData.display_name
                            if (creatorData?.nickname) return creatorData.nickname
                          }

                          // Priority 4: Fallback to User ID
                          return `User ${rsvp.user_id.slice(-4) || 'Anonymous'}`
                        }

                        const displayName = getDisplayName()
                        const hasNickname = Boolean(profile.nickname && profile.nickname.trim())
                        const isEventHost = rsvp.user_id === event.created_by

                        return (
                          <div key={rsvp.user_id || index} className="flex flex-col items-center">
                            <UserHoverCard
                              userId={rsvp.user_id}
                              displayName={displayName}
                              avatarUrl={profile.avatar_url ?? undefined}
                            >
                              <div className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl hover:bg-white/8 transition-all duration-200 cursor-pointer hover:scale-105 ${
                                isEventHost ? 'bg-white/10 border border-white/20' : 'bg-white/5 border border-white/10'
                              } backdrop-blur-sm min-w-0`}>
                                <div className="relative">
                                  <UserAvatar
                                    userId={rsvp.user_id}
                                    displayName={displayName}
                                    avatarUrl={profile.avatar_url ?? undefined}
                                    size="lg"
                                  />
                                  {isEventHost && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center border-2 border-background">
                                      <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />
                                    </div>
                                  )}
                                </div>
                                <div className="text-center w-full">
                                  {hasNickname ? (
                                    <p className="text-xs text-yellow-400 italic font-medium truncate w-full">
                                      {profile.nickname!.trim()} 🍻
                                    </p>
                                  ) : (
                                    <p className="text-xs font-medium text-white truncate w-full">
                                      {displayName}
                                    </p>
                                  )}
                                  {isEventHost && (
                                    <p className="text-xs text-white font-medium">Host</p>
                                  )}
                                </div>
                              </div>
                            </UserHoverCard>
                          </div>
                        )
                      })}
                      {allAttendees.length > 8 && (
                        <div className="flex flex-col items-center">
                          <div className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/5 hover:bg-white/8 rounded-xl border border-white/10 backdrop-blur-sm transition-all duration-200 cursor-pointer hover:scale-105 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                              <span className="text-xs sm:text-sm font-bold text-white">
                                +{allAttendees.length - 8}
                              </span>
                            </div>
                            <p className="text-xs text-[#B3B3B3] font-medium">more legends</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 6. Event Location */}
            {event.latitude != null && event.longitude != null && (
              <div className="slide-up glass-card rounded-2xl hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.01] transition-all duration-300 overflow-hidden" style={{ animationDelay: '0.6s' }}>
                <div className="p-4 sm:p-6">
                  <h2 className="text-base sm:text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    Event Location
                  </h2>
                  <div className="rounded-xl overflow-hidden border border-white/10 backdrop-blur-sm">
                    <InteractiveMap
                      location={{
                        latitude: event.latitude,
                        longitude: event.longitude,
                        place_name: String(event.place_nickname || getLocationDisplayName(event as any)),
                        place_id: event.place_id ?? '',
                        address: String(event.place_name ?? event.location ?? '')
                      }}
                      height={300}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 7. Post-Event Additions (if event is in past) */}
            {isPastEvent && userAttended && (
              <>
                <ToastRecap
                  event={event as any}
                  attendeeCount={goingCount}
                  photoCount={0}
                  commentCount={0}
                />

                <EventGallery
                  eventId={event.id}
                  canUpload={Boolean(userAttended)}
                  canModerate={Boolean(isHost)}
                />

                <EventComments
                  eventId={event.id}
                  canComment={Boolean(userAttended)}
                  canModerate={Boolean(isHost)}
                />

                <ReviewsPanel
                  eventName={event.title || 'Event'}
                  averageRating={event.average_rating || 0}
                  reviewCount={event.total_ratings || 0}
                  event={event as any}
                  className="mt-6"
                />
              </>
            )}
          </div>

          {/* RIGHT COLUMN - Summary Sidebar (45%) */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 space-y-6">

              {/* RSVP Status & CTA */}
              {!isPastEvent && (
                <div className="slide-up glass-card rounded-2xl p-4 sm:p-6 hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:scale-[1.01] transition-all duration-300" style={{ animationDelay: '0.1s' }}>
                  {!isHost ? (
                    <div className="text-center space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-lg sm:text-xl font-display font-bold text-white">
                          Ready to raise some hell? 🍻
                        </h3>
                        <p className="text-sm sm:text-base text-[#B3B3B3]">
                          Join this epic session and let's make some memories!
                        </p>
                      </div>
                      <JoinEventButton
                        eventId={event.id}
                        initialJoined={isJoined}
                        onJoinChange={joined => {
                          setIsJoined(joined)
                          refetchEvent()
                        }}
                        className="w-full px-6 sm:px-8 py-3 text-base sm:text-lg font-bold bg-white text-black hover:bg-white/90 hover:scale-105 transition-all duration-200"
                        size="lg"
                      />
                      {!user && (
                        <p className="text-sm text-muted-foreground">
                          Sign in to join this legendary session! 🤘
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center space-y-3">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Crown className="w-6 h-6 text-accent-primary" />
                        <span className="text-lg sm:text-xl font-display font-bold text-foreground">
                          You're hosting this session!
                        </span>
                      </div>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Share the event link to invite more legends to the party 🎉
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Host Info */}
              <div className="slide-up bg-gradient-card border border-border hover:border-border-hover rounded-2xl backdrop-blur-md shadow-amber" style={{ animationDelay: '0.2s' }}>
                <div className="p-6">
                  <h3 className="text-base sm:text-lg font-display font-semibold text-foreground flex items-center gap-2 mb-4">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-accent-primary" />
                    Hosted By
                  </h3>
                  <div className="flex items-center gap-4 p-4 bg-bg-glass hover:bg-bg-glass-hover rounded-xl border border-border/30 backdrop-blur-sm transition-all duration-200">
                    <UserAvatar
                      userId={event.created_by}
                      displayName={
                        event.host?.display_name ||
                        event.host?.nickname ||
                        creatorData?.display_name ||
                        creatorData?.nickname ||
                        `User ${event.created_by.slice(-4)}`
                      }
                      avatarUrl={event.host?.avatar_url || creatorData?.avatar_url || undefined}
                      size="lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-foreground">
                          {event.host?.display_name ||
                           event.host?.nickname ||
                           creatorData?.display_name ||
                           creatorData?.nickname ||
                           `User ${event.created_by.slice(-4)}`}
                        </h4>
                        {/* Show nickname in italic gold if available */}
                        {(event.host?.nickname || creatorData?.nickname) && (
                          <span className="text-accent-secondary italic text-sm font-medium">
                            aka {event.host?.nickname || creatorData?.nickname} 🍻
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {isHost
                          ? "You're the host of this legendary session! 🤘"
                          : "Ready to raise some hell with you! 🍻"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Event Details Recap */}
              <div className="slide-up bg-gradient-card border border-border hover:border-border-hover rounded-2xl backdrop-blur-md shadow-amber" style={{ animationDelay: '0.3s' }}>
                <div className="p-6 space-y-4">
                  <h3 className="text-base sm:text-lg font-display font-semibold text-foreground">Event Details</h3>

                  {/* Date & Time Recap */}
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-accent-primary" />
                    <div>
                      <p className="font-medium text-foreground">{formatEventTiming(event.date_time, event.end_time)}</p>
                      <p className="text-muted-foreground">{date}</p>
                    </div>
                  </div>

                  {/* Location Recap */}
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-accent-primary" />
                    <div>
                      <p className="font-medium text-foreground">
                        {event.place_nickname || getLocationDisplayName(event as any)}
                      </p>
                    </div>
                  </div>

                  {/* Privacy Tag */}
                  {!event.is_public && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-accent-primary/10 text-accent-primary border-accent-primary/20">
                        🔒 Invite Only
                      </Badge>
                    </div>
                  )}
                </div>
              </div>



            </div>
          </div>
        </div>


      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={event.title || 'Event'}
        url={`${window.location.origin}${
          isPrivateEvent ? '/private-event' : '/event'
        }/${slug}`}
      />

      {/* Edit Modal */}
      {event && (
        <EditEventModal
          event={event as any}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onEventUpdated={() => refetchEvent()}
        />
      )}

      {/* Delete Dialog */}
      {event && (
        <DeleteEventDialog
          event={event as any}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onEventDeleted={() => {
            toast.success('Event deleted successfully!')
            handleDeleteSuccess('event')
          }}
        />
      )}
    </div>
  )
}
