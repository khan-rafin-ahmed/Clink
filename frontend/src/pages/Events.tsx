import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthDependentData } from '@/hooks/useAuthState'
import { RobustPageWrapper } from '@/components/PageWrapper'
import { getUserAccessibleEvents } from '@/lib/eventService'
import { Button } from '@/components/ui/button'
import { EnhancedEventCard } from '@/components/EnhancedEventCard'
import { toast } from 'sonner'
import { FullPageSkeleton, ErrorFallback } from '@/components/SkeletonLoaders'
import type { Event } from '@/types'

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
    refetch
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
                <EnhancedEventCard
                  event={{
                    ...event,
                    rsvp_count: rsvpCounts.going
                  }}
                  variant="default"
                  className="bg-gradient-card border-border hover:border-border-hover transition-all duration-300 hover-lift backdrop-blur-sm"
                />
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
