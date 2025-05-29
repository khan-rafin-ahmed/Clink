import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useSmartNavigation, useActionNavigation } from '@/hooks/useSmartNavigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShareModal } from '@/components/ShareModal'
import { JoinEventButton } from '@/components/JoinEventButton'
import { UserAvatar } from '@/components/UserAvatar'
import { UserHoverCard } from '@/components/UserHoverCard'
import { EditEventModal } from '@/components/EditEventModal'
import { DeleteEventDialog } from '@/components/DeleteEventDialog'
import { toast } from 'sonner'
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
import type { Event, RsvpStatus } from '@/types'

interface EventWithRsvps extends Event {
  rsvps: Array<{
    id: string
    status: RsvpStatus
    user_id: string
    users: { email: string } | null
  }>
  host?: {
    id: string
    display_name: string | null
    avatar_url: string | null
    email?: string
  }
  end_time?: string
}

export function EventDetail() {
  const { eventCode } = useParams<{ eventCode: string }>()
  const { user, loading: authLoading, error: authError } = useAuth()
  const navigate = useNavigate()
  const { goBackSmart } = useSmartNavigation()
  const { handleDeleteSuccess } = useActionNavigation()
  const [event, setEvent] = useState<EventWithRsvps | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)
  const loadingRef = useRef(false)

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isJoined, setIsJoined] = useState(false)

  // Load participant profiles state - must be declared before any conditional returns
  const [participantProfiles, setParticipantProfiles] = useState<Record<string, { display_name: string | null; avatar_url: string | null }>>({})

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (eventCode) {
      loadEvent()
    }
  }, [eventCode])

  useEffect(() => {
    // Update join status when user changes
    if (!mountedRef.current) return

    if (user && event) {
      const userRsvpData = event.rsvps?.find((rsvp: any) => rsvp.user_id === user.id)
      const userEventMember = event.event_members?.find((member: any) => member.user_id === user.id)
      setIsJoined(userRsvpData?.status === 'going' || userEventMember?.status === 'accepted')
    } else {
      setIsJoined(false)
    }
  }, [user, event?.id]) // Only depend on user and event.id, not the entire event object

  // Load participant profiles - MOVED HERE to ensure consistent hook order
  useEffect(() => {
    const loadParticipantProfiles = async () => {
      if (!mountedRef.current || !event) return

      // Collect user IDs from both RSVPs and event members
      const rsvpUserIds = event.rsvps?.map(rsvp => rsvp.user_id).filter(Boolean) || []
      const memberUserIds = event.event_members?.map(member => member.user_id).filter(Boolean) || []
      const allUserIds = [...new Set([...rsvpUserIds, ...memberUserIds])]

      if (allUserIds.length === 0) return

      try {
        const { data: profiles, error } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', allUserIds)

        if (!mountedRef.current) return // Check again after async operation

        if (!error && profiles) {
          const profileMap = profiles.reduce((acc, profile) => {
            acc[profile.user_id] = {
              display_name: profile.display_name,
              avatar_url: profile.avatar_url
            }
            return acc
          }, {} as Record<string, { display_name: string | null; avatar_url: string | null }>)

          setParticipantProfiles(profileMap)
        }
      } catch (error) {
        if (mountedRef.current) {
          console.warn('Error loading participant profiles:', error)
        }
      }
    }

    loadParticipantProfiles()
  }, [event?.rsvps, event?.event_members])

  const handleEventUpdated = useCallback(() => {
    loadEvent()
  }, [])

  const handleEventDeleted = useCallback(() => {
    toast.success('Session deleted successfully!')
    handleDeleteSuccess('event')
  }, [handleDeleteSuccess])

  const loadEvent = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current || !mountedRef.current) return

    try {
      loadingRef.current = true
      setLoading(true)
      setError(null)

      // First try to find event by event_code, then fall back to id for backward compatibility
      let eventData = null

      // Try finding by event_code first (basic event info only)
      const { data: eventByCode, error: codeError } = await supabase
        .from('events')
        .select('*')
        .eq('event_code', eventCode)
        .maybeSingle()

      if (eventByCode && !codeError) {
        eventData = eventByCode
      } else {
        // Fall back to finding by id for backward compatibility
        const { data: eventById } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventCode)
          .maybeSingle()

        eventData = eventById
      }

      // If we found the event, load RSVPs and event members separately
      if (eventData && !error) {
        try {
          // Load RSVPs
          const { data: rsvpData, error: rsvpError } = await supabase
            .from('rsvps')
            .select('id, status, user_id')
            .eq('event_id', eventData.id)

          if (!rsvpError) {
            eventData.rsvps = rsvpData || []
          } else {
            console.warn('Could not load RSVPs:', rsvpError)
            eventData.rsvps = []
          }

          // Load event members (crew members who were automatically added)
          const { data: memberData, error: memberError } = await supabase
            .from('event_members')
            .select('id, status, user_id')
            .eq('event_id', eventData.id)
            .eq('status', 'accepted')

          if (!memberError) {
            eventData.event_members = memberData || []
          } else {
            console.warn('Could not load event members:', memberError)
            eventData.event_members = []
          }
        } catch (err) {
          console.warn('Error loading event attendees:', err)
          eventData.rsvps = []
          eventData.event_members = []
        }
      }

      if (!eventData) {
        if (error) {
          console.error('Error loading event:', error)
          // If it's a permission error and user is not logged in, suggest login
          if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'PGRST116' && !user) {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
            toast.error('Please sign in to view this event')
            navigate('/login')
            return
          }
        }
        toast.error('Event not found')
        goBackSmart()
        return
      }

      // Check if event is public or user has access
      if (!eventData.is_public && !user) {
        // Store current URL for redirect after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
        toast.error('Please sign in to view this private event')
        navigate('/login')
        return
      }

      if (!mountedRef.current) return // Check before setting state

      setEvent(eventData)

      // Check user's RSVP status (both RSVP and event member)
      if (user) {
        const userRsvpData = eventData.rsvps?.find((rsvp: any) => rsvp.user_id === user.id)
        const userEventMember = eventData.event_members?.find((member: any) => member.user_id === user.id)
        setIsJoined(userRsvpData?.status === 'going' || userEventMember?.status === 'accepted')
      }

      // Load host information
      await loadHostInfo(eventData.created_by)
    } catch (error) {
      console.error('Error loading event:', error)
      if (mountedRef.current) {
        toast.error('Failed to load event')
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
      loadingRef.current = false
    }
  }, [eventCode, mountedRef])

  const loadHostInfo = async (hostId: string) => {
    if (!mountedRef.current) return

    try {
      const { data: hostProfile, error } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .eq('user_id', hostId)
        .single()

      if (!mountedRef.current) return // Check again after async operation

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading host info:', error)
        return
      }

      // Always set host data, even if profile is null (we'll handle fallbacks in the UI)
      if (mountedRef.current) {
        setEvent(prev => prev ? {
          ...prev,
          host: hostProfile ? {
            id: hostProfile.user_id,
            display_name: hostProfile.display_name,
            avatar_url: hostProfile.avatar_url
          } : {
            id: hostId,
            display_name: null,
            avatar_url: null
          }
        } : null)
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error('Error loading host info:', error)
      }
    }
  }

  // const loadParticipants = async (rsvps: any[]) => {
  //   if (!rsvps.length) {
  //     setParticipants([])
  //     return
  //   }

  //   try {
  //     const userIds = rsvps.map(rsvp => rsvp.user_id)

  //     const { data: profiles, error } = await supabase
  //       .from('user_profiles')
  //       .select('user_id, display_name, avatar_url')
  //       .in('user_id', userIds)

  //     if (error) {
  //       console.error('Error loading participant profiles:', error)
  //       setParticipants(rsvps)
  //       return
  //     }

  //     const participantsWithProfiles = rsvps.map(rsvp => ({
  //       ...rsvp,
  //       profile: profiles?.find(p => p.user_id === rsvp.user_id) || null
  //     }))

  //     setParticipants(participantsWithProfiles)
  //   } catch (error) {
  //     console.error('Error loading participants:', error)
  //     setParticipants(rsvps)
  //   }
  // }

  const handleJoinChange = (joined: boolean) => {
    setIsJoined(joined)
    // Reload the event data to get updated RSVP counts and participant profiles
    loadEvent()
  }





  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const getDrinkEmoji = (drinkType?: string) => {
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

  const getTimingEmoji = (dateTime: string) => {
    const eventDate = new Date(dateTime)
    const now = new Date()
    const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours <= 1) return '🔥' // Right now/very soon
    if (diffHours <= 6) return '⚡' // Today
    if (diffHours <= 24) return '🎉' // Tonight
    if (diffHours <= 48) return '🌟' // Tomorrow
    return '📅' // Future
  }

  const getTimingLabel = (dateTime: string) => {
    const eventDate = new Date(dateTime)
    const now = new Date()
    const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (diffHours <= 1) return 'Right Now'
    if (diffHours <= 6) return 'Today'
    if (diffHours <= 24) return 'Tonight'
    if (diffHours <= 48) return 'Tomorrow'
    return 'Upcoming'
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

  // Show auth error
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

  // Show loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <img
            src="/thirstee-logo.svg"
            alt="Thirstee"
            className="h-16 w-auto mx-auto mb-4"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
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
            <Button onClick={() => loadEvent()} variant="outline">
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

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Event not found</h1>
          <p className="text-muted-foreground">This event doesn't exist or has been removed.</p>
          <Button onClick={goBackSmart}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const { date } = formatDateTime(event.date_time)

  // Combine attendees from both RSVPs and event members
  const rsvpAttendees = event.rsvps?.filter(rsvp => rsvp.status === 'going') || []
  const eventMembers = event.event_members || []

  // Create a Set to track unique user IDs to avoid duplicates
  const uniqueAttendeeIds = new Set()
  const allAttendees = []

  // Add RSVP attendees first
  rsvpAttendees.forEach(rsvp => {
    if (!uniqueAttendeeIds.has(rsvp.user_id)) {
      uniqueAttendeeIds.add(rsvp.user_id)
      allAttendees.push({ ...rsvp, source: 'rsvp' })
    }
  })

  // Add event members (crew members) if they're not already in RSVPs
  eventMembers.forEach(member => {
    if (!uniqueAttendeeIds.has(member.user_id)) {
      uniqueAttendeeIds.add(member.user_id)
      allAttendees.push({ ...member, status: 'going', source: 'crew' })
    }
  })

  const goingCount = allAttendees.length
  const maybeCount = event.rsvps?.filter(rsvp => rsvp.status === 'maybe').length || 0
  const isHost = user && event.created_by === user.id
  const attendees = allAttendees



  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={goBackSmart} className="hover:bg-primary/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {/* Host Actions */}
              {isHost && (
                <>
                  <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="hover:bg-primary/10">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setIsShareModalOpen(true)} className="hover:bg-primary/10">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Main Event Card */}
          <div className="bg-gradient-to-br from-card via-card to-card/80 border border-border rounded-xl overflow-hidden">
            {/* Event Header */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getDrinkEmoji(event.drink_type)}</span>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                        {event.title}
                      </h1>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg">{getTimingEmoji(event.date_time)}</span>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {getTimingLabel(event.date_time)}
                        </Badge>
                        <Badge variant={event.is_public ? 'default' : 'secondary'} className="ml-2">
                          {event.is_public ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Timing & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{formatEventTiming(event.date_time, event.end_time)}</p>
                    <p className="text-sm text-muted-foreground">{date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{event.location}</p>
                    <p className="text-sm text-muted-foreground">Tap to navigate</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Host Information Section */}
            <div className="p-6 border-b border-border/50">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-primary" />
                Hosted By
              </h2>

              <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-lg">
                <UserAvatar
                  userId={event.created_by}
                  displayName={event.host?.display_name || `Host ${event.created_by?.slice(-4) || ''}`}
                  avatarUrl={event.host?.avatar_url}
                  size="lg"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {event.host?.display_name || `Host ${event.created_by?.slice(-4) || ''}`}
                    </h3>
                    {isHost && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        <Crown className="w-3 h-3 mr-1" />
                        You're hosting!
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isHost ? "You're the host of this epic session!" : "Ready to raise some hell with you!"}
                  </p>
                </div>
              </div>
            </div>

            {/* Event Details Section */}
            <div className="p-6 border-b border-border/50">
              <h2 className="text-lg font-semibold text-foreground mb-4">Event Details</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {event.drink_type && (
                  <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <Wine className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground capitalize">{event.drink_type}</p>
                      <p className="text-sm text-muted-foreground">Drink of choice</p>
                    </div>
                  </div>
                )}
                {event.vibe && (
                  <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                    <span className="text-xl">{getVibeEmoji(event.vibe)}</span>
                    <div>
                      <p className="font-medium text-foreground capitalize">{event.vibe} Vibe</p>
                      <p className="text-sm text-muted-foreground">Party atmosphere</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {event.notes && (
                <div className="p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">Host Notes</span>
                  </div>
                  <p className="text-muted-foreground">{event.notes}</p>
                </div>
              )}
            </div>

            {/* Attendees Section */}
            <div className="p-6 border-b border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Who's Coming ({goingCount})
                </h2>
                {maybeCount > 0 && (
                  <Badge variant="outline" className="text-muted-foreground">
                    {maybeCount} maybe
                  </Badge>
                )}
              </div>

              {goingCount === 0 ? (
                <div className="text-center py-8">
                  {!isHost ? (
                    <>
                      <div className="text-4xl mb-3">🎉</div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Be the first to raise hell!
                      </h3>
                      <p className="text-muted-foreground">
                        This party is waiting for someone awesome to get it started
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl mb-3">👥</div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        No one has joined yet
                      </h3>
                      <p className="text-muted-foreground">
                        Share your event to invite people to the party!
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Horizontal scrollable attendees */}
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {attendees.slice(0, 8).map((rsvp, index) => {
                      const profile = participantProfiles[rsvp.user_id] || {}
                      const displayName = profile.display_name || `User ${rsvp.user_id?.slice(-4) || 'Anonymous'}`

                      return (
                        <div key={rsvp.user_id || index} className="flex-shrink-0">
                          <UserHoverCard
                            userId={rsvp.user_id}
                            displayName={displayName}
                            avatarUrl={profile.avatar_url}
                          >
                            <div className="flex flex-col items-center gap-2 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer min-w-[80px]">
                              <UserAvatar
                                userId={rsvp.user_id}
                                displayName={displayName}
                                avatarUrl={profile.avatar_url}
                                size="md"
                              />
                              <p className="text-xs font-medium text-center text-foreground truncate w-full">
                                {displayName}
                              </p>
                            </div>
                          </UserHoverCard>
                        </div>
                      )
                    })}
                    {attendees.length > 8 && (
                      <div className="flex-shrink-0 flex items-center justify-center p-3 bg-muted/20 rounded-lg min-w-[80px]">
                        <div className="text-center">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                            <span className="text-sm font-semibold text-primary">+{attendees.length - 8}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">more</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Section */}
            <div className="p-6">
              {!isHost ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">Ready to join the party?</h3>
                      <p className="text-sm text-muted-foreground">Let the host know you're coming!</p>
                    </div>
                  </div>
                  <JoinEventButton
                    eventId={event.id}
                    initialJoined={isJoined}
                    onJoinChange={handleJoinChange}
                    className="w-full"
                    size="lg"
                  />
                  {!user && (
                    <p className="text-sm text-muted-foreground text-center">
                      Sign in to join this epic session! 🍻
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Crown className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">You're hosting this session!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share the event link to invite more people to the party
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={event?.title || 'Event'}
        url={`${window.location.origin}/event/${eventCode}`}
      />

      {/* Edit Modal */}
      {event && (
        <EditEventModal
          event={event}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onEventUpdated={handleEventUpdated}
        />
      )}

      {/* Delete Dialog */}
      {event && (
        <DeleteEventDialog
          event={event}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onEventDeleted={handleEventDeleted}
        />
      )}
    </div>
  )
}
