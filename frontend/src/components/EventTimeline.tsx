import { useState, useEffect } from 'react'
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
  Share2,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { getEventCoverImage, getVibeEmoji } from '@/lib/coverImageUtils'
import { calculateAttendeeCount, getLocationDisplayName } from '@/lib/eventUtils'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
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
  const [attendeeProfiles, setAttendeeProfiles] = useState<Record<string, any>>({})

  // Fetch attendee profiles for better avatar display
  useEffect(() => {
    const fetchAttendeeProfiles = async () => {
      if (!events.length) return

      const allUserIds = new Set<string>()

      events.forEach(event => {
        // Add host
        if (event.created_by) allUserIds.add(event.created_by)

        // Add RSVP users
        if (event.rsvps) {
          event.rsvps.forEach((rsvp: any) => {
            if (rsvp.status === 'going') allUserIds.add(rsvp.user_id)
          })
        }

        // Add event members
        if (event.event_members) {
          event.event_members.forEach((member: any) => {
            if (member.status === 'accepted') allUserIds.add(member.user_id)
          })
        }
      })

      if (allUserIds.size === 0) return

      try {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, nickname, avatar_url')
          .in('user_id', Array.from(allUserIds))

        const profileMap: Record<string, any> = {}
        profiles?.forEach(profile => {
          profileMap[profile.user_id] = profile
        })

        setAttendeeProfiles(profileMap)
      } catch (error) {
        console.error('Error fetching attendee profiles:', error)
      }
    }

    fetchAttendeeProfiles()
  }, [events])

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

  // Format secondary date label (only show when not showing day name)
  const formatSecondaryDateLabel = (dateString: string) => {
    const date = parseISO(dateString + 'T00:00:00')
    if (isToday(date) || isTomorrow(date) || isThisWeek(date)) {
      return format(date, 'MMM d')
    }
    return null // Don't show secondary label for dates that already show "MMM d"
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
      <div className="text-center py-16 bg-gradient-card rounded-2xl" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
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
        {/* Main Timeline Line - Lighter and thinner */}
        <div className="absolute left-4 lg:left-6 top-0 bottom-0 w-[1px] bg-white/10 hidden sm:block"></div>

        {/* Timeline Content - Luma Style */}
        <div className="space-y-6">
          {sortedDateKeys.map((dateKey, dateIndex) => (
            <div key={dateKey} className="relative">
              {/* Mobile Date Header - Full width on mobile */}
              <div className="sm:hidden mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {formatDateLabel(dateKey)}
                </h3>
                {formatSecondaryDateLabel(dateKey) && (
                  <p className="text-sm text-muted-foreground">
                    {formatSecondaryDateLabel(dateKey)}
                  </p>
                )}
              </div>

              {/* Desktop Date Block Header */}
              <div className="hidden sm:flex items-start gap-4 mb-6">
                {/* Timeline Label - Desktop Left Side */}
                <div className="w-12 lg:w-16 flex-shrink-0 pt-1">
                  <div className="text-right">
                    <h3 className="text-sm font-semibold text-foreground">
                      {formatDateLabel(dateKey)}
                    </h3>
                    {formatSecondaryDateLabel(dateKey) && (
                      <p className="text-xs text-muted-foreground">
                        {formatSecondaryDateLabel(dateKey)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Timeline Anchor - Aligned to title row */}
                <div className="relative z-10 flex-shrink-0 pt-2">
                  <div className="w-3 h-3 bg-gradient-primary rounded-full border-2 border-background shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer group">
                    {/* Glowing effect on hover */}
                    <div className="absolute inset-0 bg-gradient-primary rounded-full blur-sm opacity-0 group-hover:opacity-50 scale-150 transition-opacity duration-200"></div>
                  </div>
                </div>
              </div>

              {/* Events Container - Mobile and Desktop */}
              <div className="sm:pl-[80px] lg:pl-[88px]">
                {/* Event Cards - Luma Style */}
                <div className="space-y-4">
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
                          {/* Lu.ma-Style Event Card - Mobile Optimized */}
                          <Card className="event-card w-full max-w-2xl interactive-card group glass-card transition-all duration-300 hover:shadow-white-lg relative overflow-hidden backdrop-blur-sm rounded-xl" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
                            {/* Glass shimmer overlay */}
                            <div className="absolute inset-0 glass-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                            <CardContent className="px-4 py-4 relative z-10">
                              {/* Lu.ma-style layout - Always side-by-side */}
                              <div className="flex items-start gap-x-4">
                                {/* Lu.ma-style Fixed Width Image */}
                                <div className="flex-shrink-0">
                                  <div className="w-[96px] h-[96px] rounded-xl overflow-hidden bg-card-hover">
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

                                {/* Event Content - Main Section */}
                                <div className="flex-1 min-w-0">
                                  {/* Time and Title Row */}
                                  <div className="flex items-start gap-2 mb-2">
                                    <div className="flex items-center gap-1 text-xs font-medium text-accent-primary flex-shrink-0">
                                      <Clock className="w-3 h-3" />
                                      <span>{formatEventTime(event.date_time)}</span>
                                    </div>
                                  </div>

                                  {/* Title - Always fully visible, no truncation */}
                                  <h4 className="font-heading text-white text-base font-semibold mb-2 leading-tight">
                                    {event.title}
                                  </h4>

                                  {/* Location */}
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {event.place_nickname || getLocationDisplayName(event)}
                                    </span>
                                  </div>

                                  {/* Guest Count & Tags - Mobile Optimized */}
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      {/* Enhanced Attendee Avatars - Show real attendees */}
                                      <div className="flex -space-x-1">
                                        {(() => {
                                          // Get all unique attendees for this event
                                          const uniqueAttendeeIds = new Set<string>()
                                          const attendeeList: Array<{ user_id: string; source: 'host' | 'rsvp' | 'crew' }> = []

                                          // Always include host first
                                          if (event.created_by) {
                                            uniqueAttendeeIds.add(event.created_by)
                                            attendeeList.push({ user_id: event.created_by, source: 'host' })
                                          }

                                          // Add RSVP attendees
                                          if (event.rsvps) {
                                            event.rsvps.forEach((rsvp: any) => {
                                              if (rsvp.status === 'going' && !uniqueAttendeeIds.has(rsvp.user_id)) {
                                                uniqueAttendeeIds.add(rsvp.user_id)
                                                attendeeList.push({ user_id: rsvp.user_id, source: 'rsvp' })
                                              }
                                            })
                                          }

                                          // Add crew members
                                          if (event.event_members) {
                                            event.event_members.forEach((member: any) => {
                                              if (member.status === 'accepted' && !uniqueAttendeeIds.has(member.user_id)) {
                                                uniqueAttendeeIds.add(member.user_id)
                                                attendeeList.push({ user_id: member.user_id, source: 'crew' })
                                              }
                                            })
                                          }

                                          // Show up to 3 real avatars + count badge
                                          const visibleAttendees = attendeeList.slice(0, 3)
                                          const remainingCount = Math.max(0, displayCount - 3)

                                          return (
                                            <>
                                              {visibleAttendees.map((attendee, index) => {
                                                const profile = attendeeProfiles[attendee.user_id]
                                                const isHost = attendee.source === 'host'

                                                return (
                                                  <UserAvatar
                                                    key={`${attendee.user_id}-${index}`}
                                                    userId={attendee.user_id}
                                                    displayName={profile?.display_name || (isHost ? timelineEvent.creator?.display_name : null)}
                                                    avatarUrl={profile?.avatar_url || (isHost ? timelineEvent.creator?.avatar_url : null)}
                                                    size="sm"
                                                    className={`border-2 border-background ring-1 ring-white/20 hover:ring-accent-primary/40 transition-all duration-300 hover:scale-110 hover:z-10 relative ${
                                                      isHost ? 'ring-accent-primary/30' : ''
                                                    }`}
                                                  />
                                                )
                                              })}

                                              {/* Count badge for remaining attendees */}
                                              {remainingCount > 0 && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20 border-2 border-background ring-1 ring-white/20 flex items-center justify-center hover:ring-accent-primary/40 transition-all duration-300 hover:scale-110 hover:z-10 relative">
                                                  <span className="text-xs font-bold text-accent-primary">
                                                    +{remainingCount}
                                                  </span>
                                                </div>
                                              )}
                                            </>
                                          )
                                        })()}
                                      </div>
                                      <span className="font-medium">{displayCount} attending</span>
                                    </div>

                                    {/* Tag Pills - Glassmorphism */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <div className="glass-pill px-2 py-1 text-xs font-medium text-white backdrop-blur-sm flex items-center gap-1" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
                                        <span className="text-[#CFCFCF]">{getVibeEmoji(event.vibe)}</span>
                                        <span className="text-white font-medium">{event.vibe}</span>
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

                                {/* Actions Dropdown - Top Right */}
                                <div className="absolute top-3 right-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-bg-glass-hover backdrop-blur-sm">
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="glass-modal border-border/50">
                                      <DropdownMenuItem asChild>
                                        <Link to={getEventUrl(event).replace(window.location.origin, '')} className="flex items-center">
                                          <ArrowRight className="w-4 h-4 mr-2" />
                                          View Details
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => setShareModalEvent(timelineEvent)}>
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Share Event
                                      </DropdownMenuItem>
                                      {showEditActions && isHost && (
                                        <>
                                          <DropdownMenuSeparator />
                                          {onEdit && (
                                            <DropdownMenuItem onClick={() => onEdit(event)}>
                                              <Edit className="w-4 h-4 mr-2" />
                                              Edit Event
                                            </DropdownMenuItem>
                                          )}
                                          {onDelete && (
                                            <DropdownMenuItem
                                              onClick={() => onDelete(event)}
                                              className="text-destructive focus:text-destructive"
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Delete Event
                                            </DropdownMenuItem>
                                          )}
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
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
          ))}
        </div>
      </div>

      {/* Compact Luma-Style Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 max-w-4xl mx-auto">
          {/* Previous Button */}
          {currentPage > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="bg-white/5 text-[#B3B3B3] hover:bg-white/10 hover:text-white backdrop-blur-md hover:shadow-[0_2px_10px_rgba(255,255,255,0.08)] transition-all duration-200 h-8 px-3 text-xs"
              style={{ border: '1px solid hsla(0,0%,100%,.06)' }}
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
                      ? 'bg-white text-[#08090A] font-medium shadow-md'
                      : 'bg-white/5 text-[#B3B3B3] hover:bg-white/10 hover:text-white backdrop-blur-md hover:shadow-[0_2px_10px_rgba(255,255,255,0.08)]'
                  }`}
                  style={{ border: '1px solid hsla(0,0%,100%,.06)' }}
                >
                  {page}
                </Button>
              )
            })}
          </div>

          {/* Next Button */}
          {currentPage < totalPages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="bg-white/5 text-[#B3B3B3] hover:bg-white/10 hover:text-white backdrop-blur-md hover:shadow-[0_2px_10px_rgba(255,255,255,0.08)] transition-all duration-200 h-8 px-3 text-xs"
              style={{ border: '1px solid hsla(0,0%,100%,.06)' }}
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
