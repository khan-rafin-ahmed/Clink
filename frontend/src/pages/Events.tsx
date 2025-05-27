import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthDependentData } from '@/hooks/useAuthState'
import { RobustPageWrapper } from '@/components/PageWrapper'
import { getUserAccessibleEvents } from '@/lib/eventService'
import { updateRsvp } from '@/lib/eventService'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Loader2, Globe, Lock, Users, Calendar, MapPin } from 'lucide-react'
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
    return data || []
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">Discover Sessions 🍻</h1>
        <p className="text-muted-foreground mt-1">Find drinking sessions to join</p>
      </div>

      {!events || events.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔍</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">No sessions found</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              No public sessions available right now. Check back later or create your own!
            </p>
          </div>
          <Button onClick={() => navigate('/profile')} size="lg" className="font-semibold">
            🍻 Create a Session
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map(event => {
            const userRsvp = event.rsvps?.find(r => r.user_id === user.id)
            const rsvpCounts = {
              going: event.rsvps?.filter(r => r.status === 'going').length ?? 0,
              maybe: event.rsvps?.filter(r => r.status === 'maybe').length ?? 0,
              not_going: event.rsvps?.filter(r => r.status === 'not_going').length ?? 0,
            }

            return (
              <div key={event.id} className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getDrinkEmoji(event.drink_type || 'beer')}</span>
                    <span className="text-lg">{getVibeEmoji(event.vibe || 'casual')}</span>
                    {event.is_public ? (
                      <Globe className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="text-primary hover:text-primary/80"
                  >
                    View Details
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
            )
          })}
        </div>
      )}
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
