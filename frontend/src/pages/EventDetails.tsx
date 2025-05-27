import { useCallback, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import { getEventDetails, updateRsvp } from '@/lib/eventService'
import { useAuthDependentData } from '@/hooks/useAuthState'
import { FullPageSkeleton, ErrorFallback } from '@/components/SkeletonLoaders'
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
import { InnerCircleBadge } from '@/components/InnerCircleBadge'
import { toast } from 'sonner'

// Data loading function (outside component for stability)
const loadEventDetailsData = async (_user: any, eventId: string) => {
  console.log('🔍 loadEventDetailsData: Loading event details for eventId:', eventId)

  try {
    const eventData = await getEventDetails(eventId)
    console.log('✅ loadEventDetailsData: Event details loaded successfully')
    return eventData
  } catch (error) {
    console.error('🚨 loadEventDetailsData: Error loading event details:', error)
    throw error
  }
}

export function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [updatingRsvp, setUpdatingRsvp] = useState(false)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // STRONGEST GUARD: Validate eventId from URL params
  if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Invalid Event URL</h2>
          <Button onClick={() => navigate('/discover')}>Back to Discover</Button>
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
          <Button onClick={() => navigate('/discover')}>Back to Discover</Button>
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </Button>
          <button onClick={() => setIsShareModalOpen(true)} className="flex items-center space-x-1 text-muted-foreground hover:text-foreground">
            <ShareModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              title={event.title}
              url={eventUrl}
            />
          </button>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
          <InnerCircleBadge userId={event.created_by} />
        </div>
        <div className="mt-4 space-y-2 text-muted-foreground">
          <p>📅 {format(new Date(event.date_time), 'PPP p')}</p>
          <p>📍 {event.location}</p>
          {event.notes && <p className="mt-4">{event.notes}</p>}
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
    </div>
  )
}