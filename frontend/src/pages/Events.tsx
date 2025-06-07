import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthDependentData } from '@/hooks/useAuthState'
import { RobustPageWrapper } from '@/components/PageWrapper'
import { getUserAccessibleEvents } from '@/lib/eventService'
import { updateRsvp } from '@/lib/eventService'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StarRatingDisplay } from '@/components/StarRating'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Globe, Lock, Users, Calendar, MapPin } from 'lucide-react'
import { FullPageSkeleton, ErrorFallback } from '@/components/SkeletonLoaders'
import type { Event, RsvpStatus } from '@/types'

// Data loading function (outside component for stability)
const loadEventsData = async (user: any): Promise<Event[]> => {
  if (!user) {
    throw new Error('User authentication required')
  }

  try {
    console.log('🔍 Loading user accessible events for:', user.id)
    const data = await getUserAccessibleEvents()
    console.log('✅ Loaded events:', data?.length || 0)
    // Use type assertion since the data structure is compatible for our use case
    return (data || []) as Event[]
  } catch (error) {
    console.error('❌ Error loading events:', error)
    throw error
  }
}

function EventsContent() {
  const navigate = useNavigate()
  const [updatingRsvp, setUpdatingRsvp] = useState<string | null>(null)

  // Create stable fetch function
  const fetchEventsData = useCallback(async (user: any): Promise<Event[]> => {
    return loadEventsData(user)
  }, [])

  // Use enhanced auth-dependent data fetching
  const {
    data: events,
    isLoading,
    isError,
    error,
    refetch,
    user
  } = useAuthDependentData<Event[]>(
    fetchEventsData,
    {
      requireAuth: true, // This page requires authentication
      onSuccess: (data: Event[]) => {
        console.log('✅ Events loaded successfully:', data?.length || 0, 'events')
      },
      onError: (error: Error) => {
        console.error('❌ Failed to load events:', error)
        toast.error('Failed to load events. Please try again.')
      },
      retryCount: 2,
      retryDelay: 1000
    }
  )

  const handleRsvpUpdate = async (eventId: string, status: RsvpStatus) => {
    if (!user) return

    setUpdatingRsvp(eventId)
    try {
      await updateRsvp(eventId, user.id, status)
      toast.success(`RSVP updated to ${status}!`)
      // Refetch data to get updated state
      refetch()
    } catch (error) {
      console.error('Error updating RSVP:', error)
      toast.error('Failed to update RSVP')
    } finally {
      setUpdatingRsvp(null)
    }
  }

  const getDrinkEmoji = (drinkType: string) => {
    const emojis: Record<string, string> = {
      beer: '🍺',
      wine: '🍷',
      whiskey: '🥃',
      cocktails: '🍸',
      shots: '🥂',
      mixed: '🍹'
    }
    return emojis[drinkType] || '🍻'
  }

  const getVibeEmoji = (vibe: string) => {
    const emojis: Record<string, string> = {
      casual: '😎',
      party: '🎉',
      shots: '🥃',
      chill: '🌙',
      wild: '🔥',
      classy: '🥂'
    }
    return emojis[vibe] || '😎'
  }

  // Handle loading state
  if (isLoading) {
    return <FullPageSkeleton />
  }

  // Handle error state
  if (isError) {
    return (
      <ErrorFallback
        error={error || 'Unknown error'}
        onRetry={refetch}
        title="Failed to load events"
        description="We couldn't load your events. Please try again."
      />
    )
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-12 fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <span className="text-primary font-medium">Your Events</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-foreground mb-4">
            Your <span className="bg-gradient-primary bg-clip-text text-transparent">Sessions</span> 🍻
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Manage and discover drinking sessions you're part of
          </p>
        </div>

        <div className="slide-up" style={{ animationDelay: '0.3s' }}>
          {!events || events.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-gold">
                <span className="text-5xl">🔍</span>
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">No Sessions Found</h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
                No sessions available right now. Check back later or create your own epic session!
              </p>
              <Button onClick={() => navigate('/profile')} size="xl" className="group hover-glow">
                🍻 Create a Session
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => {
            const userRsvp = event.rsvps?.find(r => r.user_id === user.id)

            // Calculate attendee counts using the same logic as other pages
            const rsvpAttendees = (event.rsvps || []).filter((rsvp: any) => rsvp.status === 'going')
            const eventMembers = (event.event_members || []).filter((member: any) => member.status === 'accepted')

            // Deduplicate attendees
            const uniqueAttendeeIds = new Set<string>()
            const allAttendees: Array<{ user_id: string; status: string; source: 'rsvp' | 'crew' }> = []

            // Add RSVP attendees first
            rsvpAttendees.forEach((rsvp: any) => {
              if (!uniqueAttendeeIds.has(rsvp.user_id)) {
                uniqueAttendeeIds.add(rsvp.user_id)
                allAttendees.push({ ...rsvp, source: 'rsvp' })
              }
            })

            // Add event members (crew members) if they're not already in RSVPs
            eventMembers.forEach((member: any) => {
              if (!uniqueAttendeeIds.has(member.user_id)) {
                uniqueAttendeeIds.add(member.user_id)
                allAttendees.push({ ...member, status: 'going', source: 'crew' })
              }
            })

            const rsvpCounts = {
              going: allAttendees.length, // Total unique attendees
              maybe: event.rsvps?.filter(r => r.status === 'maybe').length ?? 0,
              not_going: event.rsvps?.filter(r => r.status === 'not_going').length ?? 0,
            }

            return (
              <div key={event.id} className="scale-in" style={{ animationDelay: `${0.4 + (events.indexOf(event) * 0.1)}s` }}>
                <div className="bg-gradient-card rounded-2xl p-6 border border-border hover:border-border-hover transition-all duration-300 hover-lift backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{getDrinkEmoji(event.drink_type || 'beer')}</span>
                      <span className="text-2xl">{getVibeEmoji(event.vibe || 'casual')}</span>
                      {event.is_public ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 rounded-full">
                          <Globe className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-500 font-medium">Public</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 rounded-full">
                          <Lock className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-orange-500 font-medium">Private</span>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="group backdrop-blur-sm"
                    >
                      View Details
                      <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                    </Button>
                  </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">{event.title}</h3>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(event.date_time), 'PPP p')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>{rsvpCounts.going} going, {rsvpCounts.maybe} maybe</span>
                  </div>
                  {event.total_ratings && event.total_ratings > 0 && (
                    <StarRatingDisplay
                      averageRating={event.average_rating || 0}
                      totalRatings={event.total_ratings}
                      size="sm"
                      variant="compact"
                      showCount={true}
                    />
                  )}
                </div>

                {event.notes && (
                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 mb-4">
                    {event.notes}
                  </p>
                )}

                {/* RSVP Section */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Your RSVP:</span>
                    <Select
                      value={userRsvp?.status || ''}
                      onValueChange={(value) => handleRsvpUpdate(event.id, value as RsvpStatus)}
                      disabled={updatingRsvp === event.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="RSVP" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="going">🍻 Going</SelectItem>
                        <SelectItem value="maybe">🤔 Maybe</SelectItem>
                        <SelectItem value="not_going">❌ Can't go</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  </div>
                </div>
              </div>
            )
          })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Main export with robust page wrapper
export function Events() {
  return (
    <RobustPageWrapper requireAuth={true}>
      <EventsContent />
    </RobustPageWrapper>
  )
}
