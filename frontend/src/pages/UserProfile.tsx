import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { QuickEventModal } from '@/components/QuickEventModal'
import { EditEventModal } from '@/components/EditEventModal'
import { DeleteEventDialog } from '@/components/DeleteEventDialog'
import { UserStats } from '@/components/UserStats'
import { EventCard } from '@/components/EventCard'
import { CreateCrewModal } from '@/components/CreateCrewModal'
import { CrewCard } from '@/components/CrewCard'
import { useEffect, useState } from 'react'
import { Calendar, Plus, Users } from 'lucide-react'
import { getUserProfile } from '@/lib/userService'
import { getUserCrews, getCrewMembers } from '@/lib/crewService'
import { supabase } from '@/lib/supabase'
import type { UserProfile, Event, Crew } from '@/types'

interface EnhancedEvent extends Event {
  creator?: {
    display_name: string | null
    avatar_url: string | null
    user_id: string
  }
  rsvp_count?: number
  isHosting?: boolean
}

export function UserProfile() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [statsRefresh, setStatsRefresh] = useState(0)
  const [sessionsRefresh, setSessionsRefresh] = useState(0)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)
  const [enhancedSessions, setEnhancedSessions] = useState<EnhancedEvent[]>([])
  const [pastSessions, setPastSessions] = useState<EnhancedEvent[]>([])
  const [loadingEnhanced, setLoadingEnhanced] = useState(false)
  const [userCrews, setUserCrews] = useState<Crew[]>([])
  const [crewsRefresh, setCrewsRefresh] = useState(0)
  const [pastPage, setPastPage] = useState(1)
  const itemsPerPage = 10

  // We're now using enhanced sessions instead of the basic hook
  // const {
  //   sessions: upcomingSessions,
  //   loading: loadingSessions,
  //   error: sessionsError
  // } = useUpcomingSessions(sessionsRefresh, 3)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      getUserProfile(user.id).then(setUserProfile).catch(console.error)
    }
  }, [user])

  // Fetch user crews
  const fetchUserCrews = async () => {
    try {
      const crews = await getUserCrews() // no user.id needed anymore
      setUserCrews(crews)
    } catch (error) {
      console.error('❌ Error fetching user crews:', error)
    }
  }
  useEffect(() => {
    if (user?.id) {
      fetchUserCrews()
    }
  }, [user?.id, crewsRefresh])

  // Fetch enhanced session data with creator info and RSVP counts
  const fetchEnhancedSessions = async () => {
    if (!user) return

    setLoadingEnhanced(true)
    try {
      // Get creator info once
      const { data: creatorData } = await supabase
        .from('user_profiles')
        .select('display_name, avatar_url, user_id')
        .eq('user_id', user.id)
        .single()

      const creatorInfo = creatorData || {
        display_name: 'Unknown Host',
        avatar_url: null,
        user_id: user.id
      }

      // Get all crews the user is a member of
      const { data: userCrews } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      const crewIds = userCrews?.map(crew => crew.crew_id) || []

      // Fetch all data in parallel
      const [
        upcomingHostedResult,
        upcomingRSVPResult,
        upcomingInvitedResult,
        upcomingCrewEventsResult,
        pastHostedResult,
        pastAttendingRSVPResult,
        pastAttendingMembersResult,
        pastCrewEventsResult
      ] = await Promise.all([
        // Upcoming sessions you're hosting
        supabase
          .from('events')
          .select(`
            *,
            rsvps (
              id,
              status,
              user_id
            ),
            event_members (
              id,
              status,
              user_id
            )
          `)
          .eq('created_by', user.id)
          .gte('date_time', new Date().toISOString())
          .order('date_time', { ascending: true }),

        // Upcoming sessions you're attending via RSVP
        supabase
          .from('events')
          .select(`
            *,
            rsvps (
              id,
              status,
              user_id
            ),
            event_members (
              id,
              status,
              user_id
            )
          `)
          .eq('rsvps.user_id', user.id)
          .eq('rsvps.status', 'going')
          .neq('created_by', user.id)
          .gte('date_time', new Date().toISOString())
          .order('date_time', { ascending: true }),

        // Upcoming sessions you're invited to via event_members (private events)
        supabase
          .from('events')
          .select(`
            *,
            rsvps (
              id,
              status,
              user_id
            ),
            event_members (
              id,
              status,
              user_id
            )
          `)
          .eq('event_members.user_id', user.id)
          .eq('event_members.status', 'accepted')
          .neq('created_by', user.id)
          .gte('date_time', new Date().toISOString())
          .order('date_time', { ascending: true }),

        // Upcoming crew-based events (for crews the user belongs to)
        supabase
          .from('events')
          .select(`
            *,
            rsvps (
              id,
              status,
              user_id
            )
          `)
          .in('crew_id', crewIds)
          .gte('date_time', new Date().toISOString())
          .order('date_time', { ascending: true }),

        // Past sessions you hosted
        supabase
          .from('events')
          .select(`
            *,
            rsvps (
              id,
              status,
              user_id
            ),
            event_members (
              id,
              status,
              user_id
            )
          `)
          .eq('created_by', user.id)
          .lt('date_time', new Date().toISOString())
          .order('date_time', { ascending: false }),

        // Past sessions you attended via RSVP
        supabase
          .from('events')
          .select(`
            *,
            rsvps!inner (
              id,
              status,
              user_id
            ),
            event_members (
              id,
              status,
              user_id
            )
          `)
          .eq('rsvps.user_id', user.id)
          .eq('rsvps.status', 'going')
          .neq('created_by', user.id)
          .lt('date_time', new Date().toISOString())
          .order('date_time', { ascending: false }),

        // Past sessions you attended via event_members (private events)
        supabase
          .from('events')
          .select(`
            *,
            rsvps (
              id,
              status,
              user_id
            ),
            event_members!inner (
              id,
              status,
              user_id
            )
          `)
          .eq('event_members.user_id', user.id)
          .eq('event_members.status', 'accepted')
          .neq('created_by', user.id)
          .lt('date_time', new Date().toISOString())
          .order('date_time', { ascending: false }),

        // Past sessions from crews you're a member of
        supabase
          .from('events')
          .select(`
            *,
            rsvps (
              id,
              status,
              user_id
            ),
            event_members (
              id,
              status,
              user_id
            )
          `)
          .in('created_by', crewIds)
          .lt('date_time', new Date().toISOString())
          .order('date_time', { ascending: false })
      ])

      // Helper function to calculate attendee count (same logic as EventDetail and getPublicEvents)
      const calculateAttendeeCount = (event: any) => {
        // Get RSVPs with status 'going'
        const rsvpAttendees = (event.rsvps || []).filter((rsvp: any) => rsvp.status === 'going')

        // Get event members with status 'accepted' (crew members)
        const eventMembers = (event.event_members || []).filter((member: any) => member.status === 'accepted')

        // Create a Set to track unique user IDs to avoid duplicates
        const uniqueAttendeeIds = new Set<string>()
        const allAttendees: Array<{
          user_id: string
          status: string
          source: 'rsvp' | 'crew' | 'creator'
        }> = []

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

        // Add the creator if they're not already counted
        if (event.created_by && !uniqueAttendeeIds.has(event.created_by)) {
          uniqueAttendeeIds.add(event.created_by)
          allAttendees.push({
            user_id: event.created_by,
            status: 'going',
            source: 'creator'
          })
        }

        return allAttendees.length
      }

      // Process upcoming sessions (combine hosted and attending)
      const allUpcomingEvents = []

      // Add hosted events
      if (upcomingHostedResult.error) {
        console.error('Error fetching upcoming hosted sessions:', upcomingHostedResult.error)
      } else {
        const hostedEvents = (upcomingHostedResult.data || []).map(event => ({
          ...event,
          creator: creatorInfo,
          rsvp_count: calculateAttendeeCount(event),
          isHosting: true
        }))
        allUpcomingEvents.push(...hostedEvents)
      }

      // Add RSVP attending events
      if (upcomingRSVPResult.error) {
        console.error('Error fetching upcoming RSVP sessions:', upcomingRSVPResult.error)
      } else {
        // Fetch creator info for RSVP events
        const rsvpEventsWithCreators = await Promise.all(
          (upcomingRSVPResult.data || []).map(async (event) => {
            const { data: creatorData } = await supabase
              .from('user_profiles')
              .select('display_name, avatar_url, user_id')
              .eq('user_id', event.created_by)
              .single()

            return {
              ...event,
              creator: creatorData || {
                display_name: 'Unknown Host',
                avatar_url: null,
                user_id: event.created_by
              },
              rsvp_count: calculateAttendeeCount(event),
              isHosting: false
            }
          })
        )
        allUpcomingEvents.push(...rsvpEventsWithCreators)
      }

      // Add invited events (private events you were invited to)
      if (upcomingInvitedResult.error) {
        console.error('Error fetching upcoming invited sessions:', upcomingInvitedResult.error)
      } else {
        // Fetch creator info for invited events
        const invitedEventsWithCreators = await Promise.all(
          (upcomingInvitedResult.data || []).map(async (event) => {
            const { data: creatorData } = await supabase
              .from('user_profiles')
              .select('display_name, avatar_url, user_id')
              .eq('user_id', event.created_by)
              .single()

            return {
              ...event,
              creator: creatorData || {
                display_name: 'Unknown Host',
                avatar_url: null,
                user_id: event.created_by
              },
              rsvp_count: calculateAttendeeCount(event),
              isHosting: false
            }
          })
        )
        allUpcomingEvents.push(...invitedEventsWithCreators)
      }

      // Add crew events
      if (upcomingCrewEventsResult.error) {
        console.error('Error fetching upcoming crew events:', upcomingCrewEventsResult.error)
      } else {
        const crewEventsWithCreators = await Promise.all(
          (upcomingCrewEventsResult.data || []).map(async (event) => {
            // Use creatorInfo for host
            const crewMembers = await getCrewMembers(event.crew_id)
            return {
              ...event,
              creator: creatorInfo,
              rsvp_count: crewMembers.length,
              isHosting: false,
              isCrewEvent: true
            }
          })
        )
        allUpcomingEvents.push(...crewEventsWithCreators)
      }

      // Sort all upcoming events by date
      allUpcomingEvents.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())

      setEnhancedSessions(allUpcomingEvents)

      // Process past sessions (combine hosted and attended)
      const allPastEvents = []

      // Add hosted past events
      if (pastHostedResult.error) {
        console.error('Error fetching past hosted sessions:', pastHostedResult.error)
      } else {
        const hostedPastEvents = (pastHostedResult.data || []).map(event => ({
          ...event,
          creator: creatorInfo,
          rsvp_count: calculateAttendeeCount(event),
          isHosting: true
        }))
        allPastEvents.push(...hostedPastEvents)
      }

      // Add attended past events (RSVP)
      if (pastAttendingRSVPResult.error) {
        console.error('Error fetching past RSVP attending sessions:', pastAttendingRSVPResult.error)
      } else {
        // Fetch creator info for past RSVP attended events
        const attendedRSVPPastEventsWithCreators = await Promise.all(
          (pastAttendingRSVPResult.data || []).map(async (event: any) => {
            const { data: creatorData } = await supabase
              .from('user_profiles')
              .select('display_name, avatar_url, user_id')
              .eq('user_id', event.created_by)
              .single()

            return {
              ...event,
              creator: creatorData || {
                display_name: 'Unknown Host',
                avatar_url: null,
                user_id: event.created_by
              },
              rsvp_count: calculateAttendeeCount(event),
              isHosting: false
            }
          })
        )
        allPastEvents.push(...attendedRSVPPastEventsWithCreators)
      }

      // Add attended past events (event members)
      if (pastAttendingMembersResult.error) {
        console.error('Error fetching past member attending sessions:', pastAttendingMembersResult.error)
      } else {
        // Fetch creator info for past member attended events
        const attendedMemberPastEventsWithCreators = await Promise.all(
          (pastAttendingMembersResult.data || []).map(async (event: any) => {
            const { data: creatorData } = await supabase
              .from('user_profiles')
              .select('display_name, avatar_url, user_id')
              .eq('user_id', event.created_by)
              .single()

            return {
              ...event,
              creator: creatorData || {
                display_name: 'Unknown Host',
                avatar_url: null,
                user_id: event.created_by
              },
              rsvp_count: calculateAttendeeCount(event),
              isHosting: false
            }
          })
        )
        allPastEvents.push(...attendedMemberPastEventsWithCreators)
      }

      // Add past crew events
      if (pastCrewEventsResult.error) {
        console.error('Error fetching past crew events:', pastCrewEventsResult.error)
      } else {
        // Fetch creator info for past crew events
        const crewEventsWithCreators = await Promise.all(
          (pastCrewEventsResult.data || []).map(async (event) => {
            const { data: creatorData } = await supabase
              .from('user_profiles')
              .select('display_name, avatar_url, user_id')
              .eq('user_id', event.created_by)
              .single()

            return {
              ...event,
              creator: creatorData || {
                display_name: 'Unknown Host',
                avatar_url: null,
                user_id: event.created_by
              },
              rsvp_count: calculateAttendeeCount(event),
              isHosting: false,
              isCrewEvent: true
            }
          })
        )
        allPastEvents.push(...crewEventsWithCreators)
      }

      // Sort all past events by date (most recent first)
      allPastEvents.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
      setPastSessions(allPastEvents)
    } catch (error) {
      console.error('Error fetching enhanced sessions:', error)
    } finally {
      setLoadingEnhanced(false)
    }
  }

  const handleEventCreated = () => {
    // Trigger both stats and sessions refresh
    setStatsRefresh(prev => prev + 1)
    setSessionsRefresh(prev => prev + 1)
    fetchEnhancedSessions()
  }

  const handleCrewCreated = () => {
    setCrewsRefresh(prev => prev + 1)
  }

  const handleCrewUpdated = () => {
    setCrewsRefresh(prev => prev + 1)
  }

  const handleEdit = (event: any) => {
    setEditingEvent(event)
  }

  const handleDelete = (event: any) => {
    setDeletingEvent(event)
  }

  const handleEventUpdated = () => {
    setSessionsRefresh(prev => prev + 1)
    setStatsRefresh(prev => prev + 1)
    setEditingEvent(null)
    fetchEnhancedSessions()
  }

  const handleEventDeleted = () => {
    setSessionsRefresh(prev => prev + 1)
    setStatsRefresh(prev => prev + 1)
    setDeletingEvent(null)
    fetchEnhancedSessions()
  }

  // Fetch enhanced sessions when user changes or refresh triggers
  useEffect(() => {
    if (user?.id) {
      fetchEnhancedSessions()
    }
  }, [user?.id, sessionsRefresh])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const displayName = userProfile?.display_name || user?.email?.split('@')[0] || 'Champion'
  const avatarFallback = displayName.charAt(0).toUpperCase()

  const pageCount = Math.ceil(pastSessions.length / itemsPerPage)
  const displayedPastSessions = pastSessions.slice((pastPage - 1) * itemsPerPage, pastPage * itemsPerPage)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Header */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Avatar className="w-14 h-14 sm:w-16 sm:h-16">
                <AvatarImage src={userProfile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl sm:text-2xl font-bold">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                  {displayName}'s Profile 🍻
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Ready to raise some hell? Let's get this party started!
                </p>
              </div>
            </div>

            <div className="bg-primary/10 rounded-lg p-3 sm:p-4 max-w-md mx-auto">
              <p className="text-xs sm:text-sm text-muted-foreground">
                <strong>Signed in as:</strong> {user.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since {new Date(user.created_at || '').toLocaleDateString() || 'today'}
              </p>
            </div>
          </div>

          {/* User Stats */}
          <UserStats className="max-w-2xl mx-auto" refreshTrigger={statsRefresh} />

          {/* Quick Actions */}
          <div className="text-center space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <QuickEventModal
                trigger={
                  <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-semibold">
                    <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Create New Session</span>
                    <span className="sm:hidden">Raise Some Hell</span>
                  </Button>
                }
                onEventCreated={handleEventCreated}
              />

              <CreateCrewModal
                trigger={
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-semibold">
                    <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline">Create Crew</span>
                    <span className="sm:hidden">Build Crew</span>
                  </Button>
                }
                onCrewCreated={handleCrewCreated}
              />
            </div>
          </div>

          {/* Crews You're In */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                Crews You're In
              </h2>
            </div>

            {userCrews.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {userCrews.map((crew) => (
                  <CrewCard
                    key={crew.id}
                    crew={crew}
                    onCrewUpdated={handleCrewUpdated}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Crews Yet</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
                  Create your first crew to organize your drinking buddies and make event planning easier.
                </p>
                <CreateCrewModal
                  trigger={
                    <Button className="w-full sm:w-auto">
                      <Users className="mr-2 h-4 w-4" />
                      Create Your First Crew
                    </Button>
                  }
                  onCrewCreated={handleCrewCreated}
                />
              </div>
            )}
          </div>

          {/* Upcoming Sessions Preview */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                Your Coming Hell
              </h2>
              <p className="text-sm text-muted-foreground">
                Events you're hosting and attending
              </p>

            </div>

            {loadingEnhanced ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : enhancedSessions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {enhancedSessions.map((session) => (
                  <EventCard
                    key={session.id}
                    event={session}
                    showHostActions={session.isHosting}
                    onEdit={session.isHosting ? handleEdit : undefined}
                    onDelete={session.isHosting ? handleDelete : undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Hell</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
                  You haven't created or joined any upcoming hell-raising sessions yet.
                </p>
                <QuickEventModal
                  trigger={
                    <Button className="w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Start Raising Hell
                    </Button>
                  }
                  onEventCreated={handleEventCreated}
                />
              </div>
            )}
          </div>

          {/* Your Past Sessions */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                Your Past Hell
              </h2>
              <p className="text-sm text-muted-foreground">
                Events you hosted and attended
              </p>
            </div>

            {loadingEnhanced ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading past sessions...</p>
              </div>
            ) : pastSessions.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {displayedPastSessions.map((session) => (
                    <EventCard
                      key={session.id}
                      event={session}
                      showHostActions={false}
                      onEdit={undefined}
                      onDelete={undefined}
                    />
                  ))}
                </div>
                {pageCount > 1 && (
                  <div className="flex justify-center space-x-2 mt-4">
                    <Button disabled={pastPage === 1} onClick={() => setPastPage(p => p - 1)}>Previous</Button>
                    <span className="px-2 py-1">{pastPage} / {pageCount}</span>
                    <Button disabled={pastPage === pageCount} onClick={() => setPastPage(p => p + 1)}>Next</Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Past Hell</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
                  Your completed hell-raising sessions (hosted and attended) will appear here.
                </p>
              </div>
            )}
          </div>

          {/* App Features */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
            <div className="bg-card rounded-xl p-4 sm:p-6 text-center border border-border">
              <div className="text-3xl sm:text-4xl mb-3">⚡</div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">60-Second Setup</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Create hell-raising sessions in under a minute
              </p>
            </div>

            <div className="bg-card rounded-xl p-4 sm:p-6 text-center border border-border">
              <div className="text-3xl sm:text-4xl mb-3">📱</div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">Rally the Stable</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Share via WhatsApp, SMS, or any app
              </p>
            </div>

            <div className="bg-card rounded-xl p-4 sm:p-6 text-center border border-border sm:col-span-2 md:col-span-1">
              <div className="text-3xl sm:text-4xl mb-3">🍻</div>
              <h3 className="text-base sm:text-lg font-semibold mb-2">One-Tap Hell</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your stable can join with just one click
              </p>
            </div>
          </div>

          {/* Stone Cold Quote */}
          <div className="text-center pt-8">
            <p className="text-base sm:text-lg text-muted-foreground italic px-4">
              "And that's the bottom line, 'cause Stone Cold said so!" 🥃
            </p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          open={!!editingEvent}
          onOpenChange={(open) => !open && setEditingEvent(null)}
          onEventUpdated={handleEventUpdated}
        />
      )}

      {/* Delete Dialog */}
      {deletingEvent && (
        <DeleteEventDialog
          event={deletingEvent}
          open={!!deletingEvent}
          onOpenChange={(open) => !open && setDeletingEvent(null)}
          onEventDeleted={handleEventDeleted}
        />
      )}
    </div>
  )
}
