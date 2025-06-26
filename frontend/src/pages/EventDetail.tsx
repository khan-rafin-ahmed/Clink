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
import { ClickableUserAvatar } from '@/components/ClickableUserAvatar'

import { EditEventModal } from '@/components/EditEventModal'
import { DeleteEventDialog } from '@/components/DeleteEventDialog'
import { InteractiveMap } from '@/components/InteractiveMap'
import { EventGallery } from '@/components/EventGallery'
import { EventComments } from '@/components/EventComments'
import { EventRatingModal } from '@/components/EventRatingModal'


import { ToastRecap } from '@/components/ToastRecap'
import { toast } from 'sonner'
import { getEventCoverImage, getVibeFallbackGradient } from '@/lib/coverImageUtils'
import {
  MapPin,
  Users,
  Share2,
  ArrowLeft,
  Clock,
  StickyNote,
  Edit,
  Trash2,
  Crown,
  MoreVertical,
  Link as LinkIcon
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { EventWithRsvps } from '@/types'
import { calculateAttendeeCount, getLocationDisplayName, formatEventTiming, getEventTenseText, getEventTimingStatus } from '@/lib/eventUtils'
import { getEventRatingStats, getUserEventRating, canUserRateEvent, hasEventConcluded } from '@/lib/eventRatingService'
import { getEventDetails, getEventBySlug } from '@/lib/eventService'
import { useEventMetaTags } from '@/hooks/useMetaTags'
import { AddToCalendarButton } from '@/components/AddToCalendarButton'
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
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false)
  const [userRating, setUserRating] = useState<any>(null)
  const [canRate, setCanRate] = useState(false)

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

  // Load user rating data for past events
  useEffect(() => {
    const loadUserRatingData = async () => {
      if (!event || !user) return

      // Calculate if event is past and user attended
      const now = new Date()
      const eventDate = new Date(event.date_time)
      const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)
      const isPastEvent = diffHours < 0

      const isHost = user && event.created_by === user.id
      const userAttended = user && (
        isHost ||
        event.rsvps.some(r => r.user_id === user.id && r.status === 'going') ||
        event.event_members?.some(m => m.user_id === user.id && m.status === 'accepted')
      )

      if (!isPastEvent || !userAttended) return

      try {
        const [rating, canRateResult, eventConcluded] = await Promise.all([
          getUserEventRating(event.id),
          canUserRateEvent(event.id, user.id),
          hasEventConcluded(event.id)
        ])

        setUserRating(rating)
        setCanRate(canRateResult && eventConcluded)
      } catch (error) {
        console.error('Error loading rating data:', error)
      }
    }

    loadUserRatingData()
  }, [event, user])

  // Generate event URL for sharing and meta tags - MOVED TO TOP TO AVOID HOOKS ORDER VIOLATION
  const eventUrl = useMemo(() => {
    if (!event && !cachedEvent) return ''
    const currentEvent = event || cachedEvent
    if (!currentEvent) return ''

    const baseUrl = window.location.origin
    if (isPrivateEvent) {
      return `${baseUrl}/private-event/${slug}`
    }
    return `${baseUrl}/event/${slug}`
  }, [event, cachedEvent, slug, isPrivateEvent])

  // Apply dynamic meta tags for social sharing - MOVED TO TOP TO AVOID HOOKS ORDER VIOLATION
  useEventMetaTags(
    (event || cachedEvent) ? {
      title: (event || cachedEvent)!.title,
      description: (event || cachedEvent)!.notes,
      cover_image_url: (event || cachedEvent)!.cover_image_url,
      vibe: (event || cachedEvent)!.vibe,
      date_time: (event || cachedEvent)!.date_time,
      location: (event || cachedEvent)!.location,
      place_nickname: (event || cachedEvent)!.place_nickname,
      is_public: (event || cachedEvent)!.is_public
    } : undefined,
    eventUrl
  )




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

  // Get appropriate tense text based on event status
  const tenseText = getEventTenseText(event.date_time, event.end_time, event.duration_type)

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

  // Use proper event timing logic that accounts for duration
  const eventTimingStatus = getEventTimingStatus(event.date_time, event.end_time, event.duration_type)
  const isPastEvent = eventTimingStatus === 'past'

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
    <div className="min-h-screen bg-bg-base">

      {/* Consistent Container Width - Matching Profile Page Layout */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Desktop Navigation Header */}
        <div className="hidden lg:flex items-center justify-between fade-in mb-8">
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
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden fade-in mb-4">
          {/* Top Row - Back + Options */}
          <div className="flex items-center justify-between px-4 py-3">
            <Button variant="outline" onClick={goBackSmart} size="sm" className="group backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back
            </Button>

            <div className="flex items-center gap-2">
              {/* Share Icon Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 backdrop-blur-sm"
              >
                <LinkIcon className="w-4 h-4" />
              </Button>

              {/* Options Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="p-2 backdrop-blur-sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="glass-modal border-white/20 backdrop-blur-xl">
                  <DropdownMenuItem onClick={() => setIsShareModalOpen(true)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Event
                  </DropdownMenuItem>
                  {isHost && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Event
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Event
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Title and Date/Time */}
          <div className="px-4 py-1 space-y-1">
            <h1 className="text-lg font-bold text-white leading-tight">
              {event.title}
            </h1>
            <p className="text-sm text-[#B3B3B3]">
              {date} • {formatEventTiming(event.date_time, event.end_time, event.duration_type)}
            </p>
            {getCountdownText(event.date_time) && (
              <p className="text-white font-medium text-sm">
                ⏱️ {getCountdownText(event.date_time)}
              </p>
            )}
          </div>

          {/* Hosting Status Banner */}
          {isHost && (
            <div className="mx-4 mt-3 mb-1">
              <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                <Crown className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">You're hosting this session!</span>
              </div>
            </div>
          )}
        </div>

        {/* Balanced 2-Column Layout: Left Column (Primary Content) + Right Column (Actions & Meta) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8">

          {/* Mobile Layout - Stack vertically with CTA at top */}
          <div className="lg:hidden space-y-4">
            {/* Mobile CTA Section - Simplified */}
            {!isPastEvent && !isHost && (
              <div className="glass-card rounded-xl p-4 shadow-sm">
                <JoinEventButton
                  eventId={event.id}
                  initialJoined={isJoined}
                  onJoinChange={joined => {
                    setIsJoined(joined)
                    refetchEvent()
                  }}
                  className="w-full text-lg font-bold"
                  size="lg"
                />
              </div>
            )}

            {/* Mobile Content */}
            <div className="space-y-4">

              {/* Mobile Cover Image */}
              <div className="rounded-xl overflow-hidden shadow-xl">
                <div className="relative aspect-[16/9]">
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
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Vibe Tags */}
              <div className="flex flex-wrap gap-3">
                {event.vibe && (
                  <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
                    <span className="text-xl">{getVibeEmoji(event.vibe)}</span>
                    <span className="text-white font-medium capitalize">{event.vibe} Vibe</span>
                  </div>
                )}
                {event.drink_type && (
                  <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
                    <span className="text-xl">{getDrinkEmoji(event.drink_type)}</span>
                    <span className="text-white font-medium capitalize">{event.drink_type}</span>
                  </div>
                )}
                <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
                  <span className="text-lg">{event.is_public ? '🌍' : '🔒'}</span>
                  <span className="text-white font-medium">
                    {event.is_public ? 'Public Session' : 'Private Session'}
                  </span>
                </div>
              </div>

              {/* Mobile Description */}
              {event.notes && (
                <div className="glass-card rounded-xl p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-white" />
                    About the Event
                  </h2>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-[#B3B3B3] leading-relaxed text-base">{event.notes}</p>
                  </div>
                </div>
              )}

              {/* Mobile Who's Coming - Avatar Stack */}
              <div className="glass-card rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-white" />
                    {tenseText.whoIsComingTitle}
                  </h2>
                </div>
                {allAttendees.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">🎉</div>
                    <h3 className="text-lg font-display font-semibold text-white mb-2">
                      Be the first to raise hell!
                    </h3>
                    <p className="text-[#B3B3B3]">
                      This party is waiting for someone legendary to get it started 🤘
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Mobile Avatar Stack */}
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {allAttendees.slice(0, 4).map((rsvp, index) => {
                          const profile = participantProfiles[rsvp.user_id] || {}
                          const displayName = profile.nickname || profile.display_name || `User ${rsvp.user_id.slice(-4)}`
                          const isEventHost = rsvp.user_id === event.created_by

                          return (
                            <div key={rsvp.user_id || index} className="relative">
                              <ClickableUserAvatar
                                userId={rsvp.user_id}
                                displayName={displayName}
                                avatarUrl={profile.avatar_url ?? undefined}
                                size="sm"
                                className="ring-2 ring-background"
                              />
                              {isEventHost && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center border border-background">
                                  <Crown className="w-1.5 h-1.5 text-black" />
                                </div>
                              )}
                            </div>
                          )
                        })}
                        {allAttendees.length > 4 && (
                          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border-2 border-background text-xs font-bold text-white">
                            +{allAttendees.length - 4}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {goingCount} {goingCount === 1 ? 'person is' : 'people are'} going
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {allAttendees.slice(0, 2).map((rsvp, index) => {
                            const profile = participantProfiles[rsvp.user_id] || {}
                            const isEventHost = rsvp.user_id === event.created_by
                            const isCurrentUser = user && rsvp.user_id === user.id
                            const displayName = profile.nickname || profile.display_name || `User ${rsvp.user_id.slice(-4)}`

                            return (
                              <span key={rsvp.user_id || index} className="text-xs text-[#B3B3B3]">
                                {isCurrentUser ? 'You' : displayName}
                                {isEventHost && ' (Host)'}
                                {index < Math.min(allAttendees.length, 2) - 1 && ', '}
                              </span>
                            )
                          })}
                          {allAttendees.length > 2 && (
                            <span className="text-xs text-[#B3B3B3]">
                              and {allAttendees.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Event Info Card */}
              <div className="glass-card rounded-xl p-4 shadow-sm">
                <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
                  🕒 Event Info
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-white" />
                    <div>
                      <p className="text-white text-sm">{formatEventTiming(event.date_time, event.end_time, event.duration_type)}</p>
                      <p className="text-[#B3B3B3] text-xs">{date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-white" />
                    <div>
                      <p className="text-white text-sm">
                        {event.place_nickname || getLocationDisplayName(event as any)}
                      </p>
                    </div>
                  </div>
                  {!event.is_public && (
                    <Badge variant="secondary" className="bg-white/10 text-white border-white/20 text-xs">
                      🔒 Invite Only
                    </Badge>
                  )}
                </div>
              </div>

              {/* Mobile Event Location Map */}
              {event.latitude != null && event.longitude != null && (
                <div className="glass-card rounded-xl p-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-white" />
                    Event Location
                  </h3>
                  <div className="rounded-xl overflow-hidden border border-white/10 backdrop-blur-sm">
                    <InteractiveMap
                      location={{
                        latitude: event.latitude,
                        longitude: event.longitude,
                        place_name: String(event.place_nickname || getLocationDisplayName(event as any)),
                        place_id: event.place_id ?? '',
                        address: String(event.place_name ?? event.location ?? '')
                      }}
                      height={250}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Mobile Hosted By */}
              {event.host && (
                <div className="glass-card rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
                    👑 {tenseText.eventStatus === 'concluded' ? 'Hosted By' : 'Hosted By'}
                  </h3>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      userId={event.host.id}
                      displayName={event.host.display_name || `User ${event.host.id.slice(-4)}`}
                      avatarUrl={event.host.avatar_url ?? undefined}
                      size="md"
                      className="ring-2 ring-white/20"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm">
                          {event.host.display_name || `User ${event.host.id.slice(-4)}`}
                        </p>
                        {event.host.nickname && (
                          <p className="text-yellow-400 italic text-sm">
                            "{event.host.nickname}"
                          </p>
                        )}
                      </div>
                      <p className="text-[#B3B3B3] text-xs">Event Host</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Post-Event Gallery */}
              {isPastEvent && userAttended && (
                <EventGallery
                  eventId={event.id}
                  canUpload={Boolean(userAttended)}
                  canModerate={Boolean(isHost)}
                />
              )}

              {/* Mobile Post-Event Comments */}
              {isPastEvent && userAttended && (
                <EventComments
                  eventId={event.id}
                  canComment={Boolean(userAttended)}
                  canModerate={Boolean(isHost)}
                />
              )}
            </div>
          </div>

          {/* LEFT COLUMN - Primary Content */}
          <div className="hidden lg:block lg:col-span-7 space-y-6">

            {/* 1. Title & Date */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
                {event.title}
              </h1>
              {/* Inline Ratings for Past Events */}
              {isPastEvent && (
                <div className="mb-4">
                  {event.average_rating && event.total_ratings && event.total_ratings > 0 ? (
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => canRate && setIsRatingModalOpen(true)}
                      title={userRating ? "Edit your review" : canRate ? "Leave a review" : ""}
                    >
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg transition-colors ${
                              star <= (event.average_rating || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-600'
                            } ${canRate ? 'group-hover:text-yellow-300' : ''}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-white font-medium group-hover:text-yellow-300 transition-colors">
                        {event.average_rating?.toFixed(1)} ({event.total_ratings} reviews)
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center gap-2 ${canRate ? 'cursor-pointer group' : ''}`}
                      onClick={() => canRate && setIsRatingModalOpen(true)}
                      title={canRate ? "Leave a review" : ""}
                    >
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-lg transition-colors text-gray-600 ${
                              canRate ? 'group-hover:text-yellow-400' : ''
                            }`}
                          >
                            ☆
                          </span>
                        ))}
                      </div>
                      <span className={`text-[#B3B3B3] text-sm ${canRate ? 'group-hover:text-yellow-300' : ''} transition-colors`}>
                        No reviews yet{canRate ? ' - Click to rate!' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-white" />
                <div>
                  <p className="font-semibold text-white text-lg">
                    {date} • {formatEventTiming(event.date_time, event.end_time, event.duration_type)}
                  </p>
                  {getCountdownText(event.date_time) && (
                    <p className="text-white font-medium">
                      ⏱️ {getCountdownText(event.date_time)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Cover Image - aspect-[16/9], rounded-xl */}
            <div className="rounded-xl overflow-hidden shadow-xl">
              <div className="relative aspect-[16/9]">
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
                    <div className="absolute inset-0 opacity-10">
                      <div className="w-full h-full" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)`
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Vibe Tags */}
            <div className="flex flex-wrap gap-3">
              {event.vibe && (
                <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
                  <span className="text-xl">{getVibeEmoji(event.vibe)}</span>
                  <span className="text-white font-medium capitalize">{event.vibe} Vibe</span>
                </div>
              )}
              {event.drink_type && (
                <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
                  <span className="text-xl">{getDrinkEmoji(event.drink_type)}</span>
                  <span className="text-white font-medium capitalize">{event.drink_type}</span>
                </div>
              )}
              <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-2 shadow-sm">
                <span className="text-lg">{event.is_public ? '🌍' : '🔒'}</span>
                <span className="text-white font-medium">
                  {event.is_public ? 'Public Session' : 'Private Session'}
                </span>
              </div>
            </div>

            {/* 4. Description/About */}
            {event.notes && (
              <div className="glass-card rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-white" />
                  About the Event
                </h2>
                <div className="prose prose-invert max-w-none">
                  <p className="text-[#B3B3B3] leading-relaxed text-base">{event.notes}</p>
                </div>
              </div>
            )}

            {/* 5. Who's Coming - Avatar Stack */}
            <div className="glass-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-white" />
                  {tenseText.whoIsComingTitle}
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
                <div className="space-y-4">
                  {/* Avatar Stack */}
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                      {allAttendees.slice(0, 5).map((rsvp, index) => {
                        const profile = participantProfiles[rsvp.user_id] || {}
                        const displayName = profile.nickname || profile.display_name || `User ${rsvp.user_id.slice(-4)}`
                        const isEventHost = rsvp.user_id === event.created_by


                        return (
                          <div key={rsvp.user_id || index} className="relative">
                            <ClickableUserAvatar
                              userId={rsvp.user_id}
                              displayName={displayName}
                              avatarUrl={profile.avatar_url ?? undefined}
                              size="md"
                              className="ring-2 ring-background"
                            />
                            {isEventHost && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-background">
                                <Crown className="w-2 h-2 text-black" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {allAttendees.length > 5 && (
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border-2 border-background text-xs font-bold text-white">
                          +{allAttendees.length - 5}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {goingCount} {goingCount === 1 ? 'person is' : 'people are'} going
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {allAttendees.slice(0, 3).map((rsvp, index) => {
                          const profile = participantProfiles[rsvp.user_id] || {}
                          const isEventHost = rsvp.user_id === event.created_by
                          const isCurrentUser = user && rsvp.user_id === user.id
                          const displayName = profile.nickname || profile.display_name || `User ${rsvp.user_id.slice(-4)}`

                          return (
                            <span key={rsvp.user_id || index} className="text-xs text-[#B3B3B3]">
                              {isCurrentUser ? 'You' : displayName}
                              {isEventHost && ' (Host)'}
                              {index < Math.min(allAttendees.length, 3) - 1 && ', '}
                            </span>
                          )
                        })}
                        {allAttendees.length > 3 && (
                          <span className="text-xs text-[#B3B3B3]">
                            and {allAttendees.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Event Location */}
            {event.latitude != null && event.longitude != null && (
              <div className="glass-card rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-white" />
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
            )}

            {/* 6. Toast Recap (if event is in past and user attended) */}
            {isPastEvent && userAttended && (
              <div className="glass-card rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  Toast Recap
                </h2>
                <ToastRecap
                  event={event as any}
                  attendeeCount={goingCount}
                  photoCount={0}
                  commentCount={0}
                />
              </div>
            )}

            {/* 7. Post-Event Gallery (if event is in past) */}
            {isPastEvent && userAttended && (
              <EventGallery
                eventId={event.id}
                canUpload={Boolean(userAttended)}
                canModerate={Boolean(isHost)}
              />
            )}

            {/* 8. Post-Event Comments (if event is in past) */}
            {isPastEvent && userAttended && (
              <EventComments
                eventId={event.id}
                canComment={Boolean(userAttended)}
                canModerate={Boolean(isHost)}
              />
            )}


          </div>

          {/* RIGHT COLUMN - Actions & Meta */}
          <div className="hidden lg:block lg:col-span-5">
              <div className="sticky top-6 z-40 space-y-4 max-h-screen overflow-y-auto pr-2">

                {/* 1. Share Button - Standalone Glass Button */}
                <div className="glass-card rounded-xl p-4 shadow-sm">
                  <Button
                    variant="outline"
                    onClick={() => setIsShareModalOpen(true)}
                    className="w-full glass-button backdrop-blur-lg hover:backdrop-blur-xl transition-all duration-300"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Event
                  </Button>
                </div>

                {/* 2. Join CTA or Status Message */}
                {!isPastEvent && !isHost && (
                  <div className="glass-card rounded-xl p-4 shadow-sm">
                    <JoinEventButton
                      eventId={event.id}
                      initialJoined={isJoined}
                      onJoinChange={joined => {
                        setIsJoined(joined)
                        refetchEvent()
                      }}
                      className="w-full text-lg font-bold"
                      size="lg"
                    />

                    {/* Add to Calendar button for joined users */}
                    {user && isJoined && (
                      <div className="mt-3">
                        <AddToCalendarButton
                          event={event}
                          eventUrl={eventUrl}
                          variant="outline"
                          size="lg"
                          className="w-full"
                        />
                      </div>
                    )}

                    {!user && (
                      <p className="text-sm text-[#B3B3B3] text-center mt-3">
                        Sign in to join this legendary session! 🤘
                      </p>
                    )}
                  </div>
                )}

                {/* Host Status Message */}
                {isHost && (
                  <div className="glass-card rounded-xl p-4 shadow-sm text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-lg">👑</span>
                      <span className="font-bold text-white">You're hosting this session!</span>
                    </div>
                    <p className="text-[#B3B3B3] text-sm">
                      Share the event link to invite more legends 🎉
                    </p>
                  </div>
                )}

                {/* Past Event Status */}
                {isPastEvent && !userAttended && (
                  <div className="glass-card rounded-xl p-4 shadow-sm">
                    <div className="text-center">
                      <div className="text-3xl mb-2">😢</div>
                      <h3 className="font-semibold text-white mb-1">You missed this one!</h3>
                      <p className="text-[#B3B3B3] text-sm">
                        Join future events to be part of the action! 🍻
                      </p>
                    </div>
                  </div>
                )}



                {/* 3. Event Info */}
                <div className="glass-card rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
                    🕒 Event Info
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-white" />
                      <div>
                        <p className="text-white text-sm">{formatEventTiming(event.date_time, event.end_time, event.duration_type)}</p>
                        <p className="text-[#B3B3B3] text-xs">{date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-white" />
                      <div>
                        <p className="text-white text-sm">
                          {event.place_nickname || getLocationDisplayName(event as any)}
                        </p>
                      </div>
                    </div>
                    {!event.is_public && (
                      <Badge variant="secondary" className="bg-white/10 text-white border-white/20 text-xs">
                        🔒 Invite Only
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 4. Hosted By */}
                {event.host && (
                  <div className="glass-card rounded-xl p-4 shadow-sm">
                    <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
                      👑 {tenseText.eventStatus === 'concluded' ? 'Hosted By' : 'Hosted By'}
                    </h3>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        userId={event.host.id}
                        displayName={event.host.display_name || `User ${event.host.id.slice(-4)}`}
                        avatarUrl={event.host.avatar_url ?? undefined}
                        size="md"
                        className="ring-2 ring-white/20"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium text-sm">
                            {event.host.display_name || `User ${event.host.id.slice(-4)}`}
                          </p>
                          {event.host.nickname && (
                            <p className="text-yellow-400 italic text-sm">
                              "{event.host.nickname}"
                            </p>
                          )}
                        </div>
                        <p className="text-[#B3B3B3] text-xs">Event Host</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
        </div>

        {/* Share Modal */}
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={event?.title || 'Event'}
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

        {/* Rating Modal */}
        {event && (
          <EventRatingModal
            event={event as any}
            isOpen={isRatingModalOpen}
            onClose={() => setIsRatingModalOpen(false)}
            existingRating={userRating}
            onRatingSubmitted={(rating) => {
              setUserRating(rating)
              // Refresh event data to get updated rating stats
              refetchEvent()
              setIsRatingModalOpen(false)
            }}
          />
        )}

      </div>
    </div>
  )
}
