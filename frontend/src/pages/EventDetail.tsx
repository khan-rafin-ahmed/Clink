import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useSmartNavigation, useActionNavigation } from '@/hooks/useSmartNavigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareModal } from '@/components/ShareModal'
import { JoinEventButton } from '@/components/JoinEventButton'
import { UserAvatar, UserAvatarWithName } from '@/components/UserAvatar'
import { UserHoverCard } from '@/components/UserHoverCard'
import { EditEventModal } from '@/components/EditEventModal'
import { DeleteEventDialog } from '@/components/DeleteEventDialog'
import { toast } from 'sonner'
import {
  Calendar,
  MapPin,
  Users,
  Share2,
  ArrowLeft,
  Clock,
  Wine,
  Music,
  StickyNote,
  Edit,
  Trash2
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
  const [participants] = useState<Array<{
    id: string
    status: RsvpStatus
    user_id: string
    profile?: {
      display_name: string | null
      avatar_url: string | null
    }
  }>>([])
  const [isJoined, setIsJoined] = useState(false)

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
    if (user && event) {
      const userRsvpData = event.rsvps?.find((rsvp: any) => rsvp.user_id === user.id)
      setIsJoined(userRsvpData?.status === 'going')
    } else {
      setIsJoined(false)
    }
  }, [user, event?.id]) // Only depend on user and event.id, not the entire event object

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

      // If we found the event, load RSVPs separately
      if (eventData && !error) {
        try {
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
        } catch (rsvpErr) {
          console.warn('Error loading RSVPs:', rsvpErr)
          eventData.rsvps = []
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

      setEvent(eventData)

      // Check user's RSVP status
      if (user) {
        const userRsvpData = eventData.rsvps?.find((rsvp: any) => rsvp.user_id === user.id)
        setIsJoined(userRsvpData?.status === 'going')
      }

      // Load host information
      // await loadHostInfo(eventData.created_by)

      // Load participant profiles
      // await loadParticipants(eventData.rsvps || [])
    } catch (error) {
      console.error('Error loading event:', error)
      toast.error('Failed to load event')
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [eventCode, mountedRef])

  // const loadHostInfo = async (hostId: string) => {
  //   try {
  //     const { data: hostProfile, error } = await supabase
  //       .from('user_profiles')
  //       .select('user_id, display_name, avatar_url')
  //       .eq('user_id', hostId)
  //       .single()

  //     if (error && error.code !== 'PGRST116') {
  //       console.error('Error loading host info:', error)
  //       return
  //     }

  //     if (hostProfile) {
  //       setEvent(prev => prev ? {
  //         ...prev,
  //         host: {
  //           id: hostProfile.user_id,
  //           display_name: hostProfile.display_name,
  //           avatar_url: hostProfile.avatar_url
  //         }
  //       } : null)
  //     }
  //   } catch (error) {
  //     console.error('Error loading host info:', error)
  //   }
  // }

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
    // Reload the event data to get updated RSVP counts
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

  const { date, time } = formatDateTime(event.date_time)
  const goingCount = event.rsvps?.filter(rsvp => rsvp.status === 'going').length || 0
  const maybeCount = event.rsvps?.filter(rsvp => rsvp.status === 'maybe').length || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={goBackSmart}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              {/* Host Actions */}
              {user && event.created_by === user.id && (
                <>
                  <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setIsShareModalOpen(true)}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Event
              </Button>
            </div>
          </div>

          {/* Event Card */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-display font-bold text-foreground">
                    {getDrinkEmoji(event.drink_type)} {event.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{time}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <Badge variant={event.is_public ? 'default' : 'secondary'}>
                  {event.is_public ? 'Public' : 'Private'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {event.drink_type && (
                  <div className="flex items-center gap-2">
                    <Wine className="w-5 h-5 text-primary" />
                    <span className="capitalize">{event.drink_type}</span>
                  </div>
                )}
                {event.vibe && (
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5 text-primary" />
                    <span className="capitalize">{event.vibe} vibe {getVibeEmoji(event.vibe)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>{goingCount} going, {maybeCount} maybe</span>
                </div>
              </div>

              {/* Notes */}
              {event.notes && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-primary" />
                    <span className="font-medium">Notes</span>
                  </div>
                  <p className="text-muted-foreground bg-muted p-3 rounded-lg">
                    {event.notes}
                  </p>
                </div>
              )}

              {/* Host Information */}
              {event.host && (
                <div className="space-y-3">
                  <h3 className="font-medium">Host</h3>
                  <UserHoverCard
                    userId={event.host.id}
                    displayName={event.host.display_name}
                    avatarUrl={event.host.avatar_url}
                    isHost={true}
                  >
                    <UserAvatarWithName
                      userId={event.host.id}
                      displayName={event.host.display_name}
                      avatarUrl={event.host.avatar_url}
                      email={event.host.email}
                      size="md"
                    />
                  </UserHoverCard>
                </div>
              )}

              {/* RSVP Status and Join Section */}
              {goingCount === 0 ? (
                /* Empty State - Be the first to join */
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl p-6 text-center border border-primary/20">
                  <div className="space-y-4">
                    <div className="text-4xl">🎉</div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        Be the first to raise hell!
                      </h3>
                      <p className="text-muted-foreground">
                        This party is waiting for someone awesome like you to get it started
                      </p>
                    </div>
                    <div className="pt-2">
                      <JoinEventButton
                        eventId={event.id}
                        initialJoined={isJoined}
                        onJoinChange={handleJoinChange}
                        className="px-8"
                        size="lg"
                      />
                    </div>
                    {!user && (
                      <p className="text-sm text-muted-foreground">
                        Sign in to join this epic session! 🍻
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Normal State - Show join button and counts */
                <div className="space-y-4">
                  <div className="bg-card rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">Join the Party</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{goingCount} going, {maybeCount} maybe</span>
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
                      <p className="text-sm text-muted-foreground text-center mt-3">
                        Sign in to join this event and see who's coming!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Who's Coming Section */}
              {goingCount > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Who's Coming</h3>

                  {/* RSVP Stats Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{goingCount}</div>
                      <div className="text-sm text-green-600/80">✅ Going</div>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{maybeCount}</div>
                      <div className="text-sm text-yellow-600/80">🤔 Maybe</div>
                    </div>
                  </div>

                  {/* Attendees List */}
                  {(['going', 'maybe'] as const).map(status => {
                    const attendees = participants.filter(p => p.status === status)
                    if (attendees.length === 0) return null

                    return (
                      <div key={status} className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          {status === 'going' ? '✅ Confirmed' : '🤔 Maybe Coming'} ({attendees.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {attendees.map(participant => (
                            <UserHoverCard
                              key={participant.id}
                              userId={participant.user_id}
                              displayName={participant.profile?.display_name}
                              avatarUrl={participant.profile?.avatar_url}
                            >
                              <div className="flex items-center gap-3 bg-muted/50 hover:bg-muted/70 p-3 rounded-lg transition-colors cursor-pointer">
                                <UserAvatar
                                  userId={participant.user_id}
                                  displayName={participant.profile?.display_name}
                                  avatarUrl={participant.profile?.avatar_url}
                                  size="sm"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {participant.profile?.display_name || `User ${participant.user_id?.slice(-4) || 'Anonymous'}`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {status === 'going' ? 'Confirmed' : 'Maybe'}
                                  </p>
                                </div>
                              </div>
                            </UserHoverCard>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
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
