import { useState, useEffect, useCallback } from 'react'
import { useAuthDependentData } from '@/hooks/useAuthState'
import { RobustPageWrapper } from '@/components/PageWrapper'
import { cacheService, CacheKeys, CacheTTL } from '@/lib/cacheService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ShareModal } from '@/components/ShareModal'
import { JoinEventButton } from '@/components/JoinEventButton'
import { UserAvatar } from '@/components/UserAvatar'
import { UserHoverCard } from '@/components/UserHoverCard'
// import { EnhancedEventCard } from '@/components/EnhancedEventCard'
// import { CommandMenu, CommandMenuTrigger, useCommandMenu } from '@/components/CommandMenu'
import {
  FullPageSkeleton,
  ErrorFallback
} from '@/components/SkeletonLoaders'
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Wine,
  Beer,
  Martini,
  Coffee,
  Share2
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Event } from '@/types'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { calculateAttendeeCount } from '@/lib/eventUtils'

type SortOption = 'newest' | 'trending' | 'date' | 'popular'
type FilterOption = 'all' | 'tonight' | 'tomorrow' | 'weekend' | 'next-week'

interface EventWithCreator extends Event {
  creator?: {
    id: string;
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    favorite_drink: string | null;
    created_at: string;
    updated_at: string;
    tagline?: string | null;
    join_date?: string | null;
  };
  user_has_joined: boolean;
  rsvp_count: number;
}

// Extracted data loading function with better error handling and caching
const loadEventsData = async (currentUser: any = null): Promise<EventWithCreator[]> => {
  try {
    console.log('🔍 Loading events data for user:', currentUser?.id || 'anonymous')

    // Create cache key based on user ID (or 'anonymous' for non-logged in users)
    const cacheKey = CacheKeys.discoverEvents(currentUser?.id || 'anonymous')

    // Try to get from cache first
    const cached = cacheService.get<EventWithCreator[]>(cacheKey)
    if (cached) {
      console.log('📦 Using cached events data:', cached.length)
      return cached
    }

    // Get public events using RPC to bypass RLS issues
    const { data: publicEvents, error: publicEventsError } = await supabase
      .rpc('get_public_events_for_discover', {
        limit_count: 50
      })

    if (publicEventsError) {
      console.error('❌ Error loading public events:', publicEventsError)
      throw publicEventsError // Throw to be caught by the hook's error handling
    }

    console.log('📅 Found public events:', publicEvents?.length || 0)

    if (!publicEvents || publicEvents.length === 0) {
      console.log('⚠️ No public events found')
      return []
    }

    // Get event IDs for batch queries
    const eventIds = publicEvents.map((event: any) => event.id)

    // Batch fetch RSVPs for all events
    const { data: allRsvps, error: rsvpError } = await supabase
      .from('rsvps')
      .select('event_id, status, user_id')
      .in('event_id', eventIds)

    if (rsvpError) {
      console.error('❌ Error loading RSVPs:', rsvpError)
    }

    // Batch fetch event members for all events
    const { data: allEventMembers, error: memberError } = await supabase
      .from('event_members')
      .select('event_id, status, user_id')
      .in('event_id', eventIds)

    if (memberError) {
      console.error('❌ Error loading event members:', memberError)
    }

    // Get unique creator IDs to batch fetch profiles
    const creatorIds = [...new Set(publicEvents.map((event: any) => event.created_by))]
    console.log('👥 Loading profiles for creators:', creatorIds.length)

    // Batch fetch all creator profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', creatorIds)

    if (profilesError) {
      console.error('❌ Error loading profiles:', profilesError)
    } else {
      console.log('✅ Loaded profiles:', profiles?.length || 0)
    }

    // Batch fetch user's join statuses if logged in
    let userJoinStatuses = new Map()
    if (currentUser) {
      const eventIds = publicEvents.map((event: any) => event.id)
      const { data: rsvps, error: rsvpError } = await supabase
        .from('rsvps')
        .select('event_id, status')
        .eq('user_id', currentUser.id)
        .in('event_id', eventIds)

      if (rsvpError) {
        console.error('❌ Error loading RSVPs:', rsvpError)
      } else {
        console.log('✅ Loaded RSVPs:', rsvps?.length || 0)
        if (rsvps) {
          rsvps.forEach(rsvp => {
            userJoinStatuses.set(rsvp.event_id, rsvp.status === 'going')
          })
        }
      }
    }

    // Map events with their creators and join status, and calculate attendee count
    const eventsWithCreators: EventWithCreator[] = publicEvents.map((event: any) => {
      const profile = profiles?.find(p => p.user_id === event.created_by)

      // Add RSVPs and event members to the event object
      const eventRsvps = allRsvps?.filter(rsvp => rsvp.event_id === event.id) || []
      const eventMembers = allEventMembers?.filter(member => member.event_id === event.id) || []

      const eventWithData = {
        ...event,
        rsvps: eventRsvps,
        event_members: eventMembers
      }

      // Calculate attendee count using the utility function
      const attendeeCount = calculateAttendeeCount(eventWithData);

      return {
        ...eventWithData,
        creator: profile ? {
          id: profile.user_id,
          user_id: profile.user_id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          bio: null,
          favorite_drink: null,
          created_at: '',
          updated_at: ''
        } : undefined,
        user_has_joined: userJoinStatuses.get(event.id) || false,
        rsvp_count: attendeeCount
      }
    })

    console.log('🎉 Successfully loaded events with creators:', eventsWithCreators.length)

    // Cache the results
    cacheService.set(cacheKey, eventsWithCreators, CacheTTL.SHORT)

    return eventsWithCreators
  } catch (error) {
    console.error('💥 Error in loadEventsData:', error)
    throw error
  }
}

// Enhanced Discover component with robust auth handling
function DiscoverContent() {
  const [filteredEvents, setFilteredEvents] = useState<EventWithCreator[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [drinkFilter, setDrinkFilter] = useState<string>('all')
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedEventForShare, setSelectedEventForShare] = useState<EventWithCreator | null>(null)
  // const commandMenu = useCommandMenu()
  const { user } = useAuth()

  // Create a stable fetch function that will receive the user from the hook
  const fetchEventsData = useCallback(async (currentUser: any): Promise<EventWithCreator[]> => {
    return loadEventsData(currentUser)
  }, [])

  // Use the enhanced auth-dependent data fetching
  const {
    data: events,
    isLoading,
    isError,
    error,
    refetch
  } = useAuthDependentData<EventWithCreator[]>(
    fetchEventsData,
    {
      requireAuth: false, // Public data - doesn't require auth
      onSuccess: (data: EventWithCreator[]) => {
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

  // All hooks must be called before any early returns
  const applyFiltersAndSort = useCallback((eventsData: EventWithCreator[]) => {
    let filtered = [...eventsData]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.notes?.toLowerCase().includes(query) ||
        event.creator?.display_name?.toLowerCase().includes(query)
      )
    }

    // Apply drink type filter
    if (drinkFilter !== 'all') {
      filtered = filtered.filter(event => event.drink_type === drinkFilter)
    }

    // Apply time filter
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

    switch (filterBy) {
      case 'tonight':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date_time)
          return eventDate >= now && eventDate < tomorrow
        })
        break
      case 'tomorrow':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date_time)
          const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
          return eventDate >= tomorrow && eventDate < dayAfterTomorrow
        })
        break
      case 'weekend':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date_time)
          const dayOfWeek = eventDate.getDay()
          return (dayOfWeek === 0 || dayOfWeek === 6) && eventDate >= now
        })
        break
      case 'next-week':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date_time)
          return eventDate >= now && eventDate <= weekEnd
        })
        break
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'trending':
        filtered.sort((a, b) => (b.rsvp_count || 0) - (a.rsvp_count || 0))
        break
      case 'date':
        filtered.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())
        break
      case 'popular':
        filtered.sort((a, b) => (b.rsvp_count || 0) - (a.rsvp_count || 0))
        break
    }

    setFilteredEvents(filtered)
  }, [searchQuery, sortBy, filterBy, drinkFilter])

  const handleJoinChange = useCallback((_eventId: string, _joined: boolean) => {
    // Update the specific event's join status without full reload
    // Note: This would need access to setEvents which we don't have here
    // For now, we'll just trigger a refetch
    refetch()
  }, [refetch])

  // Apply filters and sorting when data or filters change
  useEffect(() => {
    if (events && Array.isArray(events)) {
      applyFiltersAndSort(events)
    }
  }, [events, searchQuery, sortBy, filterBy, drinkFilter, applyFiltersAndSort])

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
        description="We couldn't load the events. Please try again."
      />
    )
  }

  // Handle empty state
  if (!events || !Array.isArray(events) || events.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Discover Epic Sessions 🍻
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Find amazing drinking sessions happening near you. Join the party and make some memories!
            </p>
          </div>

          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍻</div>
            <h3 className="text-xl font-semibold mb-2">No events yet</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create an epic drinking session!
            </p>
            <Link to="/">
              <Button>Create First Event</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const handleShareEvent = (event: EventWithCreator) => {
    setSelectedEventForShare(event)
    setShareModalOpen(true)
  }

  const getDrinkIcon = (drinkType?: string) => {
    switch (drinkType) {
      case 'beer': return <Beer className="w-4 h-4" />
      case 'wine': return <Wine className="w-4 h-4" />
      case 'cocktails': return <Martini className="w-4 h-4" />
      case 'whiskey': return <Coffee className="w-4 h-4" />
      default: return <Martini className="w-4 h-4" />
    }
  }

  const getVibeColor = (vibe?: string) => {
    switch (vibe) {
      case 'energetic': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'chill': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'sophisticated': return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'casual': return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'creative': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      case 'competitive': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const formatEventTime = (dateTime: string) => {
    const date = new Date(dateTime)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })

    if (date >= today && date < tomorrow) {
      return `Tonight at ${timeStr}`
    } else if (date >= tomorrow && date < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
      return `Tomorrow at ${timeStr}`
    } else {
      return `${date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })} at ${timeStr}`
    }
  }

  // Main content render
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
            <span className="text-primary font-medium">Discover Events</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
            Discover Epic <span className="bg-gradient-primary bg-clip-text text-transparent">Sessions</span> 🍻
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Find amazing drinking sessions happening near you. Join the party and make some legendary memories!
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-card rounded-xl p-4 sm:p-6 border border-border mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search sessions, locations, or hosts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Newest
                  </div>
                </SelectItem>
                <SelectItem value="trending">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Trending
                  </div>
                </SelectItem>
                <SelectItem value="date">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    By Date
                  </div>
                </SelectItem>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Most Popular
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Time Filter */}
            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="When" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="tonight">Tonight</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="weekend">This Weekend</SelectItem>
                <SelectItem value="next-week">Next Week</SelectItem>
              </SelectContent>
            </Select>

            {/* Drink Filter */}
            <Select value={drinkFilter} onValueChange={setDrinkFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Drink Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drinks</SelectItem>
                <SelectItem value="beer">🍺 Beer</SelectItem>
                <SelectItem value="wine">🍷 Wine</SelectItem>
                <SelectItem value="cocktails">🍸 Cocktails</SelectItem>
                <SelectItem value="whiskey">🥃 Whiskey</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <p className="text-muted-foreground">
            Found {filteredEvents.length} session{filteredEvents.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {sortBy === 'newest' && 'Newest first'}
              {sortBy === 'trending' && 'Trending'}
              {sortBy === 'date' && 'By date'}
              {sortBy === 'popular' && 'Most popular'}
            </span>
          </div>
        </div>

        {/* Enhanced Events Grid */}
        <div className="slide-up" style={{ animationDelay: '0.4s' }}>
          {filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">🔍</span>
              </div>
              <h3 className="text-2xl font-heading font-bold mb-3">No Sessions Found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                Try adjusting your filters or search terms to find the perfect party
              </p>
              <Button
                size="lg"
                onClick={() => {
                  setSearchQuery('')
                  setFilterBy('all')
                  setDrinkFilter('all')
                }}
                className="group hover-glow"
              >
                🔄 Clear Filters
                <span className="ml-2 group-hover:rotate-180 transition-transform">↻</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredEvents.map((event) => {
              return (
                <Card key={event.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg line-clamp-2">
                            {event.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <Calendar className="w-4 h-4" />
                          {formatEventTime(event.date_time)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-primary">
                        {getDrinkIcon(event.drink_type)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Event Description */}
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {event.notes}
                    </p>

                    {/* Vibe Badge and RSVP Count */}
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className={getVibeColor(event.vibe)}>
                        {event.vibe}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="w-4 h-4" />
                        <span className="text-muted-foreground">
                          {event.rsvp_count} {event.rsvp_count === 1 ? 'person' : 'people'} going
                        </span>
                      </div>
                    </div>

                    {/* Host Info */}
                    <UserHoverCard
                      userId={event.created_by}
                      displayName={event.creator?.display_name}
                      avatarUrl={event.creator?.avatar_url}
                      isHost={true}
                    >
                      <div className="flex items-center gap-2 mb-4 p-2 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors cursor-pointer">
                        <UserAvatar
                          userId={event.created_by}
                          displayName={event.creator?.display_name}
                          avatarUrl={event.creator?.avatar_url}
                          size="xs"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Hosted by {event.creator?.display_name || 'Anonymous'}
                          </span>
                          {/* Crew badge removed - using Crew System now */}
                        </div>
                      </div>
                    </UserHoverCard>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <JoinEventButton
                          eventId={event.id}
                          initialJoined={event.user_has_joined}
                          onJoinChange={(joined) => handleJoinChange(event.id, joined)}
                          className="flex-1"
                          isHost={event.created_by === user?.id}
                        />
                        <Link to={`/event/${event.event_code || event.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            <span className="hidden sm:inline">View Details</span>
                            <span className="sm:hidden">Details</span>
                          </Button>
                        </Link>
                      </div>
                      <Button
                        onClick={() => handleShareEvent(event)}
                        variant="ghost"
                        size="sm"
                        className="w-full text-muted-foreground hover:text-primary"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        </div>
      </div>

      {/* Share Modal */}
      {selectedEventForShare && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false)
            setSelectedEventForShare(null)
          }}
          title={selectedEventForShare.title}
          url={`${window.location.origin}/event/${selectedEventForShare.event_code || selectedEventForShare.id}`}
        />
      )}

      {/* Command Menu - Temporarily disabled */}
      {/* <CommandMenu
        open={commandMenu.open}
        onOpenChange={commandMenu.setOpen}
      /> */}
    </div>
  )
}

// Main export with robust page wrapper
export function Discover() {
  return (
    <RobustPageWrapper requireAuth={false}>
      <DiscoverContent />
    </RobustPageWrapper>
  )
}
