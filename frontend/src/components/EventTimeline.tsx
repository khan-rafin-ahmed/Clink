import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ShareModal } from '@/components/ShareModal'
import { UserAvatar } from '@/components/UserAvatar'
import { Link } from 'react-router-dom'
import { format, isToday, isTomorrow, isThisWeek, isSameDay, parseISO } from 'date-fns'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  ArrowRight,
  Share2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getEventCoverImage, getVibeEmoji } from '@/lib/coverImageUtils'
import { calculateAttendeeCount, getLocationDisplayName } from '@/lib/eventUtils'
import { useAuth } from '@/lib/auth-context'
import type { Event } from '@/types'

interface EventTimelineProps {
  events: Event[]
  onEdit?: (event: Event) => void
  onDelete?: (event: Event) => void
  showEditActions?: boolean
  className?: string
  emptyStateTitle?: string
  emptyStateDescription?: string
  itemsPerPage?: number
}

interface TimelineEvent extends Event {
  creator?: {
    display_name: string | null
    avatar_url: string | null
    user_id: string
  }
  rsvp_count?: number
  hero_image_url?: string | null
}

export function EventTimeline({
  events,
  onEdit,
  onDelete,
  showEditActions = false,
  className,
  emptyStateTitle = "No Events",
  emptyStateDescription = "No events to display at this time.",
  itemsPerPage = 6
}: EventTimelineProps) {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const [shareModalEvent, setShareModalEvent] = useState<TimelineEvent | null>(null)

  // Pagination logic
  const totalPages = Math.ceil(events.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedEvents = events.slice(startIndex, endIndex)

  // Group events by date for timeline organization
  const groupEventsByDate = (events: Event[]) => {
    const groups: { [key: string]: Event[] } = {}

    events.forEach(event => {
      const eventDate = parseISO(event.date_time)
      const dateKey = format(eventDate, 'yyyy-MM-dd')

      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
    })

    return groups
  }

  const eventGroups = groupEventsByDate(paginatedEvents)
  const sortedDateKeys = Object.keys(eventGroups).sort()

  // Format date labels for timeline
  const formatDateLabel = (dateString: string) => {
    const date = parseISO(dateString + 'T00:00:00')
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isThisWeek(date)) return format(date, 'EEEE')
    return format(date, 'MMM d')
  }

  // Format event time
  const formatEventTime = (dateTime: string) => {
    const eventDate = parseISO(dateTime)
    return format(eventDate, 'h:mm a')
  }

  // Generate event URL
  const getEventUrl = (event: Event) => {
    const baseUrl = window.location.origin
    if (event.is_public && event.public_slug) {
      return `${baseUrl}/event/${event.public_slug}`
    } else if (!event.is_public && event.private_slug) {
      return `${baseUrl}/private-event/${event.private_slug}`
    }
    return `${baseUrl}/event/${event.event_code || event.id}`
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16 bg-gradient-card rounded-2xl border border-border">
        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-heading font-bold mb-3">{emptyStateTitle}</h3>
        <p className="text-base text-muted-foreground px-4 max-w-md mx-auto leading-relaxed">
          {emptyStateDescription}
        </p>
      </div>
    )
  }

  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      {/* Luma-Style Timeline Container */}
      <div className="relative">
        {/* Main Timeline Line - Responsive positioning */}
        <div className="absolute left-4 lg:left-20 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/60 via-primary/40 to-primary/20 rounded-full"></div>

        {/* Timeline Content - Luma Style */}
        <div className="space-y-2">
          {sortedDateKeys.map((dateKey, dateIndex) => (
            <div key={dateKey} className="relative">
              {/* Date Block Header - Luma Style */}
              <div className="flex items-start gap-6 mb-4">
                {/* Timeline Label - Responsive Left Side */}
                <div className="w-12 lg:w-16 flex-shrink-0 pt-2">
                  <div className="text-right">
                    <h3 className="text-xs lg:text-sm font-semibold text-foreground">
                      {formatDateLabel(dateKey)}
                    </h3>
                    <p className="text-xs text-muted-foreground hidden lg:block">
                      {format(parseISO(dateKey + 'T00:00:00'), 'MMM d')}
                    </p>
                  </div>
                </div>

                {/* Timeline Anchor */}
                <div className="relative z-10 flex-shrink-0 pt-3">
                  <div className="w-3 h-3 bg-gradient-primary rounded-full border-2 border-background shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer group">
                    {/* Glowing effect on hover */}
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-sm opacity-0 group-hover:opacity-50 scale-150 transition-opacity duration-200"></div>
                  </div>
                </div>

                {/* Events Container - Fixed Width Cards */}
                <div className="flex-1 min-w-0 max-w-2xl">
                  {/* Event Cards - Luma Style */}
                  <div className="space-y-2">
                    {eventGroups[dateKey].map((event, eventIndex) => {
                      const timelineEvent = event as TimelineEvent
                      const isHost = user && event.created_by === user.id
                      const displayCount = timelineEvent.rsvp_count !== undefined
                        ? timelineEvent.rsvp_count
                        : calculateAttendeeCount(event)

                      return (
                        <div
                          key={event.id}
                          className="event-row scale-in"
                          style={{ animationDelay: `${(dateIndex * 2 + eventIndex) * 0.1}s` }}
                        >
                          {/* Luma-Style Event Card - Fixed Width */}
                          <Card className="event-card w-full max-w-2xl interactive-card group glass-card border-white/10 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-amber-lg relative overflow-hidden backdrop-blur-sm rounded-xl">
                            {/* Glass shimmer overlay */}
                            <div className="absolute inset-0 glass-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                            <CardContent className="p-4 relative z-10">
                              <div className="flex items-center gap-4">
                                {/* Time - Responsive Left Aligned */}
                                <div className="flex-shrink-0 w-12 lg:w-16 text-left">
                                  <div className="text-xs lg:text-sm font-medium text-foreground">
                                    {formatEventTime(event.date_time)}
                                  </div>
                                </div>

                                {/* Event Content - Main Section */}
                                <div className="flex-1 min-w-0">
                                  {/* Title - Bold, Styled */}
                                  <h4 className="font-heading font-bold text-base line-clamp-1 group-hover:text-primary transition-colors mb-1">
                                    {event.title}
                                  </h4>

                                  {/* Location */}
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {event.place_nickname || getLocationDisplayName(event)}
                                    </span>
                                  </div>

                                  {/* Guest Count & Tags */}
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Users className="w-3 h-3" />
                                      <span>{displayCount} attending</span>
                                    </div>

                                    {/* Tag Pills - Glassmorphism */}
                                    <div className="flex items-center gap-2">
                                      <div className="glass-pill px-2 py-0.5 text-xs font-medium border-primary/30 text-primary backdrop-blur-sm">
                                        {getVibeEmoji(event.vibe)} {event.vibe}
                                      </div>
                                      <Badge
                                        variant={event.is_public ? "default" : "secondary"}
                                        size="sm"
                                        className="text-xs backdrop-blur-sm"
                                      >
                                        {event.is_public ? "Public" : "Private"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Enhanced Cover Image - Right Side */}
                                <div className="flex-shrink-0">
                                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-card-hover shadow-lg">
                                    {getEventCoverImage(timelineEvent.cover_image_url, event.vibe) ? (
                                      <img
                                        src={getEventCoverImage(timelineEvent.cover_image_url, event.vibe)}
                                        alt={event.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent-secondary/20 flex items-center justify-center">
                                        <span className="text-2xl">{getVibeEmoji(event.vibe)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Action Buttons - Right Side */}
                                <div className="flex-shrink-0 flex items-center gap-1">
                                  {/* Host Actions */}
                                  {showEditActions && isHost && (
                                    <>
                                      {onEdit && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => onEdit(event)}
                                          className="h-7 px-2 text-xs hover:bg-accent-secondary/20 text-accent-secondary"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                      )}
                                      {onDelete && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => onDelete(event)}
                                          className="h-7 px-2 text-xs hover:bg-destructive/20 text-destructive"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      )}
                                    </>
                                  )}

                                  {/* Share Button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShareModalEvent(timelineEvent)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </Button>

                                  {/* View Details Button */}
                                  <Link to={getEventUrl(event).replace(window.location.origin, '')}>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 px-2 text-xs bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm"
                                    >
                                      View
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compact Luma-Style Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 max-w-4xl mx-auto">
          {/* Previous Button */}
          {currentPage > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="glass-card hover:border-primary/50 transition-all duration-200 h-8 px-3 text-xs"
            >
              <ChevronLeft className="w-3 h-3 mr-1" />
              Previous
            </Button>
          )}

          {/* Compact Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const showPage =
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1

              if (!showPage) {
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <span key={page} className="px-1 text-muted-foreground text-xs">
                      ...
                    </span>
                  )
                }
                return null
              }

              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] h-8 text-xs transition-all duration-200 ${
                    page === currentPage
                      ? 'bg-gradient-primary text-primary-foreground shadow-lg'
                      : 'glass-card hover:bg-primary/10 hover:border-primary/30'
                  }`}
                >
                  {page}
                </Button>
              )
            })}
          </div>

          {/* Next Button */}
          {currentPage < totalPages && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="glass-card hover:border-primary/50 transition-all duration-200 h-8 px-3 text-xs"
            >
              Next
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}

          {/* Compact Page Info */}
          <div className="ml-4 text-xs text-muted-foreground">
            {startIndex + 1}–{Math.min(endIndex, events.length)} of {events.length}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalEvent && (
        <ShareModal
          isOpen={!!shareModalEvent}
          onClose={() => setShareModalEvent(null)}
          title={shareModalEvent.title}
          url={getEventUrl(shareModalEvent)}
        />
      )}
    </div>
  )
}
