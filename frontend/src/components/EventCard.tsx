import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import type { Event } from '@/types'
import { ShareModal } from './ShareModal'
import { useState } from 'react'

interface EventCardProps {
  event: Event
  onEdit?: (event: Event) => void
  onDelete?: (event: Event) => void
}

export function EventCard({ event, onEdit, onDelete }: EventCardProps) {
  const rsvpCount = event.rsvps?.filter(r => r.status === 'going').length ?? 0
  const eventUrl = `${window.location.origin}/events/${event.id}`
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  return (
    <div className="bg-card rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <Link
            to={`/events/${event.id}`}
            className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
          >
            {event.title}
          </Link>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(event.date_time), 'PPP p')}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            📍 {event.location}
          </p>
          {event.notes && (
            <p className="text-sm text-muted-foreground mt-2">
              {event.notes}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {rsvpCount} {rsvpCount === 1 ? 'RSVP' : 'RSVPs'}
          </span>
          <button onClick={() => setIsShareModalOpen(true)}>
            <ShareModal
              isOpen={isShareModalOpen}
              onClose={() => setIsShareModalOpen(false)}
              title={event.title}
              url={eventUrl}
            />
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(event)}
              className="text-sm text-primary hover:text-primary/80"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(event)}
              className="text-sm text-destructive hover:text-destructive/80"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 