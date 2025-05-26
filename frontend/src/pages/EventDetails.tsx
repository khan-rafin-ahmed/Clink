import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import { getEventDetails, updateRsvp } from '@/lib/eventService'
import type { Event, RsvpStatus } from '@/types'
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
import { toast } from 'sonner'

export function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingRsvp, setUpdatingRsvp] = useState(false)
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    if (eventId) {
      loadEventDetails()
    }
  }, [eventId])

  async function loadEventDetails() {
    try {
      const data = await getEventDetails(eventId!)
      setEvent(data)
    } catch (error) {
      console.error('Error loading event details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRsvpChange = async (status: RsvpStatus) => {
    if (!eventId || !user) return

    setRsvpLoading(true)
    try {
      const updatedEvent = await updateRsvp(eventId, status)
      setEvent(updatedEvent)
      toast.success('RSVP updated!')
    } catch (error) {
      toast.error('Failed to update RSVP.')
    } finally {
      setUpdatingRsvp(false)
      setRsvpLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Event Not Found</h2>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    )
  }

  const userRsvp = event.rsvps?.find(r => r.user_id === user?.id)
  const rsvpCounts = {
    going: event.rsvps?.filter(r => r.status === 'going').length ?? 0,
    maybe: event.rsvps?.filter(r => r.status === 'maybe').length ?? 0,
    not_going: event.rsvps?.filter(r => r.status === 'not_going').length ?? 0,
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
        <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
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
            {event.rsvps?.map(rsvp => (
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