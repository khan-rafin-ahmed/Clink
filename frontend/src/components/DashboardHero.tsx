import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuickEventModal } from '@/components/QuickEventModal'
import { UserAvatar } from '@/components/UserAvatar'
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import type { Event, UserProfile } from '@/types'
import { cn } from '@/lib/utils'

interface DashboardHeroProps {
  user: any
  userProfile?: UserProfile | null
  upcomingEvent?: Event & {
    creator?: {
      display_name: string | null
      avatar_url: string | null
      user_id: string
    }
    rsvp_count?: number
  }
  totalEvents?: number
  totalAttendees?: number
  className?: string
}

export function DashboardHero({
  user,
  userProfile,
  upcomingEvent,
  totalEvents = 0,
  totalAttendees = 0,
  className
}: DashboardHeroProps) {
  const formatEventTime = (dateTime: string) => {
    const eventDate = new Date(dateTime)
    if (isToday(eventDate)) return `Today at ${format(eventDate, 'h:mm a')}`
    if (isTomorrow(eventDate)) return `Tomorrow at ${format(eventDate, 'h:mm a')}`
    return format(eventDate, 'MMM d \'at\' h:mm a')
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Helper function to get drink emoji for display names (returns empty if no drink)
  const getDrinkEmojiForDisplay = (drink: string | null | undefined): string => {
    if (!drink || drink === 'none') {
      return '' // Return empty string for display names when no drink is set
    }

    const drinkMap: Record<string, string> = {
      beer: '🍺',
      wine: '🍷',
      cocktails: '🍸',
      whiskey: '🥃',
      vodka: '🍸',
      rum: '🍹',
      gin: '🍸',
      tequila: '🥃',
      champagne: '🥂',
      sake: '🍶',
      other: '🍻'
    }

    return drinkMap[drink.toLowerCase()] || '🍻'
  }

  const displayName = userProfile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Thirstee'
  const emoji = getDrinkEmojiForDisplay(userProfile?.favorite_drink)
  const displayNameWithDrink = emoji ? `${displayName} ${emoji}` : displayName

  return (
    <div className={cn("space-y-6", className)}>
      {/* Main Hero Card */}
      <Card className="relative overflow-hidden border-primary/20">

        <CardContent className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Welcome Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  userId={user.id}
                  displayName={displayName}
                  avatarUrl={userProfile?.avatar_url || user.user_metadata?.avatar_url}
                  size="lg"
                />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                    {getGreeting()}, {displayNameWithDrink}!
                  </h1>
                  <p className="text-muted-foreground">
                    Ready to raise some hell today?
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{totalEvents}</div>
                  <div className="text-xs text-muted-foreground">Events Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{totalAttendees}</div>
                  <div className="text-xs text-muted-foreground">Total Attendees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">⭐</div>
                  <div className="text-xs text-muted-foreground">Hell Raiser</div>
                </div>
              </div>
            </div>

            {/* Action Section */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <QuickEventModal
                trigger={
                  <Button size="lg" className="group hover-glow">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Event
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                }
              />
              <Link to="/discover">
                <Button variant="outline" size="lg" className="w-full group">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Discover Events
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Event Spotlight */}
      {upcomingEvent ? (
        <Card className="interactive-card group">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-heading font-semibold">Your Next Event</h2>
              </div>
              <Badge variant="default" size="sm">
                {isToday(new Date(upcomingEvent.date_time)) ? 'Today' : 
                 isTomorrow(new Date(upcomingEvent.date_time)) ? 'Tomorrow' : 'Upcoming'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Event Info */}
              <div className="space-y-3">
                <h3 className="text-xl font-heading font-bold text-foreground group-hover:text-primary transition-colors">
                  {upcomingEvent.title}
                </h3>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatEventTime(upcomingEvent.date_time)}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">
                      {upcomingEvent.place_nickname || upcomingEvent.place_name || upcomingEvent.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {upcomingEvent.rsvp_count || 1} people going
                  </div>
                </div>

                {upcomingEvent.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {upcomingEvent.notes}
                  </p>
                )}
              </div>

              {/* Event Actions */}
              <div className="flex flex-col justify-center space-y-3">
                <Link 
                  to={`/event/${upcomingEvent.public_slug || upcomingEvent.event_code || upcomingEvent.id}`}
                  className="block"
                >
                  <Button className="w-full group/btn">
                    View Event Details
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    Share Event
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit Event
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* No Upcoming Events */
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-semibold mb-2">No upcoming events</h3>
                <p className="text-muted-foreground mb-4">
                  Time to plan your next epic drinking session!
                </p>
              </div>
              <QuickEventModal
                trigger={
                  <Button className="group">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your Next Event
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to="/discover">
          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-sm font-medium">Discover</div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/profile">
          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-sm font-medium">My Profile</div>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/events">
          <Card className="hover-lift cursor-pointer">
            <CardContent className="p-4 text-center">
              <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-sm font-medium">My Events</div>
            </CardContent>
          </Card>
        </Link>
        
        <QuickEventModal
          trigger={
            <Card className="hover-lift cursor-pointer">
              <CardContent className="p-4 text-center">
                <Plus className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-sm font-medium">Create</div>
              </CardContent>
            </Card>
          }
        />
      </div>
    </div>
  )
}
