import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import { useSmartNavigation, useActionNavigation } from '@/hooks/useSmartNavigation'
import { getEventDetails, updateRsvp } from '@/lib/eventService'
import { supabase } from '@/lib/supabase'
import { useAuthDependentData } from '@/hooks/useAuthState'
import { FullPageSkeleton, ErrorFallback } from '@/components/SkeletonLoaders'
import { EditEventModal } from '@/components/EditEventModal'
import { DeleteEventDialog } from '@/components/DeleteEventDialog'
import type { RsvpStatus } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ShareModal } from '@/components/ShareModal'
// import { InnerCircleBadge } from '@/components/InnerCircleBadge' // Removed - using Crew System now
import { toast } from 'sonner'
import { Edit, Trash2 } from 'lucide-react'

// Data loading function (outside component for stability)
const loadEventDetailsData = async (_user: any, eventIdOrSlug: string) => {
  console.log('🔍 loadEventDetailsData: Loading event details for:', eventIdOrSlug)

  try {
    // Try fetching by ID first
    let eventData = await getEventDetails(eventIdOrSlug)

    // If not found by ID, attempt to fetch by public_slug
    if (!eventData) {
      const { data: publicEvt, error: publicErr } = await supabase
        .from('events')
        .select('*')
        .eq('public_slug', eventIdOrSlug)
        .maybeSingle()

      if (publicErr) {
        throw publicErr
      }
      eventData = publicEvt
    }

    console.log('✅ loadEventDetailsData: Event details loaded successfully')
    return eventData
  } catch (error) {
    console.error('🚨 loadEventDetailsData: Error loading event details:', error)
    throw error
  }
}

export function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>()
  const { goBackSmart } = useSmartNavigation()
  const { handleDeleteSuccess } = useActionNavigation()
  const { user } = useAuth()
  const [updatingRsvp, setUpdatingRsvp] = useState(false)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // STRONGEST GUARD: Validate eventId from URL params
  if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Invalid Event URL</h2>
          <Button onClick={goBackSmart}>Back</Button>
        </div>
      </div>
    )
  }

  // Create stable fetch function
  const fetchEventData = useCallback(async (user: any) => {
    return loadEventDetailsData(user, eventId)
  }, [eventId])

  // Use strengthened auth-dependent data hook
  const {
    data: event,
    isLoading,
    isError,
    error,
    refetch
  } = useAuthDependentData(fetchEventData, {
    requireAuth: false, // Event viewing doesn't require auth
    onSuccess: (data) => console.log('✅ Event details loaded:', data?.title),
    onError: () => toast.error('Failed to load event details')
  })

  const handleEventUpdated = useCallback(() => {
    refetch()
  }, [refetch])

  const handleEventDeleted = useCallback(() => {
    toast.success('Session deleted successfully!')
    handleDeleteSuccess('event')
  }, [handleDeleteSuccess])

  const handleRsvpChange = async (status: RsvpStatus) => {
    if (!eventId || !user) return

    setRsvpLoading(true)
    try {
      await updateRsvp(eventId, user.id, status)
      // Reload the event to get updated data
      refetch()
      toast.success('RSVP updated!')
    } catch (error) {
      toast.error('Failed to update RSVP.')
    } finally {
      setUpdatingRsvp(false)
      setRsvpLoading(false)
    }
  }

  // Show loading skeleton while auth or data is loading
  if (isLoading) {
    return <FullPageSkeleton />
  }

  // Show error fallback if there's an error
  if (isError) {
    return (
      <ErrorFallback
        error={String(error || 'Unknown error')}
        onRetry={refetch}
        title="Failed to Load Event"
        description="There was a problem loading this event. Please try again."
      />
    )
  }

  // Show not found if no event data
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Event Not Found</h2>
          <Button onClick={goBackSmart}>Back</Button>
        </div>
      </div>
    )
  }

  const userRsvp = event.rsvps?.find((r: any) => r.user_id === user?.id)
  const rsvpCounts = {
    going: event.rsvps?.filter((r: any) => r.status === 'going').length ?? 0,
    maybe: event.rsvps?.filter((r: any) => r.status === 'maybe').length ?? 0,
    not_going: event.rsvps?.filter((r: any) => r.status === 'not_going').length ?? 0,
  }

  const eventUrl = `${window.location.origin}/events/${event.id}`

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

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-12 fade-in">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={goBackSmart}
              size="lg"
              className="group backdrop-blur-sm"
            >
              <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
              Back
            </Button>
            <div className="flex items-center gap-3">
              {/* Host Actions */}
              {user && event.created_by === user.id && (
                <>
                  <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="group backdrop-blur-sm">
                    <Edit className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Edit
                  </Button>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive hover:text-destructive group backdrop-blur-sm">
                    <Trash2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Delete
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setIsShareModalOpen(true)} className="group backdrop-blur-sm">
                <span className="mr-2 group-hover:scale-110 transition-transform">📤</span>
                Share
              </Button>
            </div>
          </div>

          {/* Event Title & Info */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground">
              {event.title}
            </h1>

            <div className="bg-gradient-card rounded-2xl p-6 lg:p-8 border border-border hover:border-border-hover transition-all duration-300 backdrop-blur-sm">
              <div className="grid sm:grid-cols-2 gap-6 text-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📅</span>
                  <span className="text-foreground font-medium">{format(new Date(event.date_time), 'PPP p')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <span className="text-foreground font-medium">{event.location}</span>
                </div>
              </div>
              {event.notes && (
                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-muted-foreground leading-relaxed">{event.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

      {user && (
        <div className="mb-8 p-4 bg-card rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Your RSVP</h2>
          <Select
            value={userRsvp?.status}
            onValueChange={handleRsvpChange}
            disabled={updatingRsvp || rsvpLoading}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select your response" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="going">Going</SelectItem>
              <SelectItem value="maybe">Maybe</SelectItem>
              <SelectItem value="not_going">Not Going</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-card rounded-lg border text-center">
            <div className="text-2xl font-bold text-primary">{rsvpCounts.going}</div>
            <div className="text-sm text-muted-foreground">Going</div>
          </div>
          <div className="p-4 bg-card rounded-lg border text-center">
            <div className="text-2xl font-bold text-yellow-500">{rsvpCounts.maybe}</div>
            <div className="text-sm text-muted-foreground">Maybe</div>
          </div>
          <div className="p-4 bg-card rounded-lg border text-center">
            <div className="text-2xl font-bold text-destructive">{rsvpCounts.not_going}</div>
            <div className="text-sm text-muted-foreground">Not Going</div>
          </div>
        </div>

        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">RSVP List</h2>
          </div>
          <div className="divide-y">
            {event.rsvps?.map((rsvp: any) => (
              <div key={rsvp.id} className="p-4 flex justify-between items-center">
                <span className="text-foreground">{rsvp.users?.email}</span>
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  rsvp.status === 'going' && 'bg-primary/10 text-primary',
                  rsvp.status === 'maybe' && 'bg-yellow-500/10 text-yellow-500',
                  rsvp.status === 'not_going' && 'bg-destructive/10 text-destructive'
                )}>
                  {rsvp.status.charAt(0).toUpperCase() + rsvp.status.slice(1)}
                </span>
              </div>
            ))}
            {!event.rsvps?.length && (
              <div className="p-4 text-center text-muted-foreground">
                No RSVPs yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={event.title}
        url={eventUrl}
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
    </div>
  )
}