import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { QuickEventModal } from '@/components/QuickEventModal'
import { EditEventModal } from '@/components/EditEventModal'
import { DeleteEventDialog } from '@/components/DeleteEventDialog'
import { CreateCrewModal } from '@/components/CreateCrewModal'
import { CrewCard } from '@/components/CrewCard'
import { ActivityTabs } from '@/components/ActivityTabs'
import { ProfileInfoCard } from '@/components/ProfileInfoCard'
import { NextEventBanner } from '@/components/NextEventBanner'

import { StatCard } from '@/components/StatCard'
import { Plus, Users as UsersIcon, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSmartNavigation } from '@/hooks/useSmartNavigation'
import { useUserStats } from '@/hooks/useUserStats'
import { getUserProfile, getUserProfileByUsername } from '@/lib/userService'
import { Simple404 } from '@/components/Simple404'
import { getUserCrews } from '@/lib/crewService'
import { supabase } from '@/lib/supabase'
import { useCacheInvalidation } from '@/hooks/useCachedData'
import { CacheKeys, CacheTTL, cacheService } from '@/lib/cacheService'
import { filterEventsByDate } from '@/lib/eventUtils'

import type { UserProfile, Event, Crew } from '@/types'

// Helper function to get drink emoji and label
const getDrinkInfo = (drink: string | null | undefined) => {
  if (!drink) {
    return {
      emoji: '🍹',
      label: 'No favorite yet'
    }
  }

  const drinkMap: Record<string, { emoji: string; label: string }> = {
    beer: { emoji: '🍺', label: 'Beer' },
    wine: { emoji: '🍷', label: 'Wine' },
    cocktails: { emoji: '🍸', label: 'Cocktails' },
    whiskey: { emoji: '🥃', label: 'Whiskey' },
    vodka: { emoji: '🍸', label: 'Vodka' },
    rum: { emoji: '🍹', label: 'Rum' },
    gin: { emoji: '🍸', label: 'Gin' },
    tequila: { emoji: '🥃', label: 'Tequila' },
    champagne: { emoji: '🥂', label: 'Champagne' },
    sake: { emoji: '🍶', label: 'Sake' },
    other: { emoji: '🍻', label: 'Other' }
  }

  return drinkMap[drink.toLowerCase()] || { emoji: '🍻', label: drink }
}

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
  const { username } = useParams<{ username: string }>()
  const { user, loading } = useAuth()
  const { goBackSmart } = useSmartNavigation()
  const [statsRefresh, setStatsRefresh] = useState(0)
  const [sessionsRefresh, setSessionsRefresh] = useState(0)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)
  const [enhancedSessions, setEnhancedSessions] = useState<EnhancedEvent[]>([])
  const [pastSessions, setPastSessions] = useState<EnhancedEvent[]>([])
  const [userCrews, setUserCrews] = useState<Crew[]>([])
  const [crewsRefresh, setCrewsRefresh] = useState(0)
  const [profileError, setProfileError] = useState(false)
  const { invalidatePattern, invalidateKey } = useCacheInvalidation()

  // Determine if this is the user's own profile
  const isOwnProfile = !username || (userProfile && user?.id === userProfile.user_id)

  // Real-time updates disabled for now

  // Get user stats for inline display
  const { stats } = useUserStats(statsRefresh)

  // We're now using enhanced sessions instead of the basic hook
  // const {
  //   sessions: upcomingSessions,
  //   loading: loadingSessions,
  //   error: sessionsError
  // } = useUpcomingSessions(sessionsRefresh, 3)

  useEffect(() => {
    if (!loading && !user && !username) {
      // navigate('/login')
    }
  }, [user, loading, username])

  // Simple profile loading for username-based profiles
  useEffect(() => {
    if (!username) return

    const loadProfile = async () => {
      try {
        const profile = await getUserProfileByUsername(username)
        if (!profile) {
          setProfileError(true)
        } else {
          setUserProfile(profile)
          setProfileError(false)
        }
      } catch (error) {
        setProfileError(true)
      }
    }

    loadProfile()
  }, [username])

  // Fetch user crews
  const fetchUserCrews = async () => {
    try {
      // Use profile owner's ID when viewing others, logged-in user's ID for own profile
      const targetUserId = userProfile?.user_id || user?.id
      if (!targetUserId) return

      const crews = await getUserCrews(targetUserId)
      setUserCrews(crews)
    } catch (error) {
      console.error('❌ Error fetching user crews:', error)
    }
  }
  useEffect(() => {
    if (userProfile || (user?.id && !username)) {
      fetchUserCrews()
    }
  }, [user?.id, userProfile, crewsRefresh])

  // Cached fetch enhanced session data with creator info and RSVP counts
  const fetchEnhancedSessions = async () => {
    // Use profile owner's ID when viewing others, logged-in user's ID for own profile
    const targetUserId = userProfile?.user_id || user?.id
    if (!targetUserId) return

    // Determine if viewing own profile or another user's profile
    const isOwnProfile = !username || (user?.id === targetUserId)
    const viewerId = user?.id // The logged-in user who is viewing the profile

    const cacheKey = CacheKeys.userEvents(targetUserId)

    // Try to get from cache first
    const cached = cacheService.get<{ upcoming: any[], past: any[] }>(cacheKey)
    if (cached) {
      setEnhancedSessions(cached.upcoming || [])
      setPastSessions(cached.past || [])
      return
    }
    try {


      console.log('Fetching events for user:', targetUserId, 'isOwnProfile:', isOwnProfile)

      // Get user's crew memberships for crew-associated events
      const { data: userCrewMemberships } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', targetUserId)
        .eq('status', 'accepted')

      const userCrewIds = userCrewMemberships?.map(cm => cm.crew_id) || []
      console.log('User is member of crews:', userCrewIds)

      // Get ALL events first, then apply privacy filtering on frontend
      const [
        createdEventsResult,
        rsvpEventsResult,
        crewInvitedEventsResult,
        crewAssociatedEventsResult
      ] = await Promise.all([
        // 1. Get ALL events created by user with attendee data
        supabase
          .from('events')
          .select(`
            *,
            rsvps(user_id, status),
            event_members(user_id, status)
          `)
          .eq('created_by', targetUserId)
          .order('date_time', { ascending: true }),

        // 2. Get ALL events user RSVP'd to with status 'going'
        supabase
          .from('events')
          .select(`
            *,
            rsvps!inner(user_id, status),
            event_members(user_id, status)
          `)
          .eq('rsvps.user_id', targetUserId)
          .eq('rsvps.status', 'going')
          .neq('created_by', targetUserId)
          .order('date_time', { ascending: true }),

        // 3. Get ALL events user was directly invited to via event_members
        supabase
          .from('events')
          .select(`
            *,
            event_members!inner(user_id, status),
            rsvps(user_id, status)
          `)
          .eq('event_members.user_id', targetUserId)
          .eq('event_members.status', 'accepted')
          .neq('created_by', targetUserId)
          .order('date_time', { ascending: true }),

        // 4. Get ALL events associated with crews user is a member of
        userCrewIds.length > 0 ? supabase
          .from('events')
          .select(`
            *,
            rsvps(user_id, status),
            event_members(user_id, status)
          `)
          .in('crew_id', userCrewIds)
          .neq('created_by', targetUserId)
          .order('date_time', { ascending: true }) : Promise.resolve({ data: [], error: null })
      ])

      console.log('Created events result:', createdEventsResult)
      console.log('RSVP events result:', rsvpEventsResult)
      console.log('Crew invited events result:', crewInvitedEventsResult)
      console.log('Crew associated events result:', crewAssociatedEventsResult)

      // Check for errors
      const errors = [
        createdEventsResult.error,
        rsvpEventsResult.error,
        crewInvitedEventsResult.error,
        crewAssociatedEventsResult.error
      ].filter(Boolean)

      if (errors.length > 0) {
        console.error('Errors fetching events:', errors)
        throw errors[0]
      }

      // Combine all events from different sources
      const allEventsRaw = [
        ...(createdEventsResult.data || []),
        ...(rsvpEventsResult.data || []),
        ...(crewInvitedEventsResult.data || []),
        ...(crewAssociatedEventsResult.data || [])
      ]

      // Remove duplicates (in case user both created and RSVP'd to same event)
      const uniqueEvents = allEventsRaw.reduce((acc: any[], event: any) => {
        if (!acc.find(e => e.id === event.id)) {
          acc.push(event)
        }
        return acc
      }, [])

      console.log('Found total events before privacy filtering:', uniqueEvents.length)

      // Apply privacy filtering when viewing another user's profile
      let filteredEvents = uniqueEvents
      if (!isOwnProfile && viewerId) {
        // Get viewer's crew memberships for crew-based event access
        const { data: viewerCrewMemberships } = await supabase
          .from('crew_members')
          .select('crew_id')
          .eq('user_id', viewerId)
          .eq('status', 'accepted')

        const viewerCrewIds = viewerCrewMemberships?.map(cm => cm.crew_id) || []

        // Updated privacy filtering logic
        filteredEvents = uniqueEvents.filter((event: any) => {
          const isCreatedByProfileOwner = event.created_by === targetUserId;

          // If the event was not created by profile owner, show it (user is a participant)
          if (!isCreatedByProfileOwner) return true;

          // If event is public, show it
          if (event.is_public) return true;

          // If viewer is participant in private event, show it
          const hasRsvp = event.rsvps?.some(
            (rsvp: any) => rsvp.user_id === viewerId && rsvp.status === 'going'
          );
          const isInvited = event.event_members?.some(
            (member: any) => member.user_id === viewerId && member.status === 'accepted'
          );
          const isCrewEvent =
            event.crew_id && viewerCrewIds.includes(event.crew_id);

          return hasRsvp || isInvited || isCrewEvent;
        });

        console.log('Events after privacy filtering:', filteredEvents.length, 'removed:', uniqueEvents.length - filteredEvents.length)
      }

      // Now use duration-aware filtering to separate upcoming vs past
      const { upcoming: upcomingEvents, past: pastEvents } = filterEventsByDate(filteredEvents)

      console.log('Found upcoming events after duration-aware filtering:', upcomingEvents.length)
      console.log('Found past events after duration-aware filtering:', pastEvents.length)

      // Batch fetch creator profiles to avoid N+1 queries
      const allCreatorIds = Array.from(new Set([
        ...upcomingEvents,
        ...pastEvents
      ].map((e: any) => e.created_by).filter((id: string) => id !== targetUserId)))

      let creatorProfileMap: Record<string, { display_name: string | null; nickname: string | null; avatar_url: string | null; user_id: string }> = {}
      if (allCreatorIds.length > 0) {
        try {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('display_name, nickname, avatar_url, user_id')
            .in('user_id', allCreatorIds)

          if (profiles) {
            profiles.forEach(profile => {
              creatorProfileMap[profile.user_id] = profile
            })
          }
        } catch (error) {
          console.error('Error batch fetching creator profiles:', error)
        }
      }



      // Transform upcoming events data for EventCard compatibility
      let allUpcomingEvents = upcomingEvents.map((event: any) => {
        const isHosting = event.created_by === targetUserId

        let creatorData
        if (isHosting) {
          creatorData = {
            display_name: userProfile?.display_name || user?.email?.split('@')[0] || 'Unknown Host',
            nickname: userProfile?.nickname,
            avatar_url: userProfile?.avatar_url,
            user_id: targetUserId
          }
        } else {
          const profile = creatorProfileMap[event.created_by]
          creatorData = profile || {
            display_name: `User ${event.created_by.slice(-4)}`,
            nickname: null,
            avatar_url: null,
            user_id: event.created_by
          }
        }

        return {
          ...event,
          creator: creatorData,
          isHosting
        }
      })



      // Sort upcoming events by date (ascending - earliest first)
      allUpcomingEvents.sort((a: any, b: any) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())

      setEnhancedSessions(allUpcomingEvents)

      // Transform past events data for EventCard compatibility
      let allPastEvents = pastEvents.map((event: any) => {
        const isHosting = event.created_by === targetUserId

        let creatorData
        if (isHosting) {
          creatorData = {
            display_name: userProfile?.display_name || user?.email?.split('@')[0] || 'Unknown Host',
            nickname: userProfile?.nickname,
            avatar_url: userProfile?.avatar_url,
            user_id: targetUserId
          }
        } else {
          const profile = creatorProfileMap[event.created_by]
          creatorData = profile || {
            display_name: `User ${event.created_by.slice(-4)}`,
            nickname: null,
            avatar_url: null,
            user_id: event.created_by
          }
        }

        return {
          ...event,
          creator: creatorData,
          isHosting
        }
      })

      // Sort past events by date (descending - most recent first)
      allPastEvents.sort((a: any, b: any) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())

      console.log('Past events after sorting (should be most recent first):')
      allPastEvents.forEach((event: any, index: number) => {
        console.log(`${index + 1}. ${event.title} - ${new Date(event.date_time).toLocaleDateString()}`)
      })

      setPastSessions(allPastEvents)

      // Cache the results
      cacheService.set(cacheKey, {
        upcoming: allUpcomingEvents,
        past: allPastEvents
      }, CacheTTL.SHORT)
    } catch (error) {
      console.error('Error fetching enhanced sessions:', error)
    }
  }

  const handleEventCreated = () => {
    // Invalidate relevant caches
    const targetUserId = userProfile?.user_id || user?.id
    if (targetUserId) {
      invalidateKey(CacheKeys.userEvents(targetUserId))
      invalidateKey(CacheKeys.userStats(targetUserId))
      invalidatePattern('discover_events')
    }
    // Trigger both stats and sessions refresh
    setStatsRefresh(prev => prev + 1)
    setSessionsRefresh(prev => prev + 1)
    fetchEnhancedSessions()
  }

  const handleCrewCreated = () => {
    // Invalidate crew cache
    const targetUserId = userProfile?.user_id || user?.id
    if (targetUserId) {
      invalidateKey(CacheKeys.userCrews(targetUserId))
    }
    setCrewsRefresh(prev => prev + 1)
  }

  const handleCrewUpdated = () => {
    // Invalidate crew cache
    const targetUserId = userProfile?.user_id || user?.id
    if (targetUserId) {
      invalidateKey(CacheKeys.userCrews(targetUserId))
    }
    setCrewsRefresh(prev => prev + 1)
  }

  const handleEdit = (event: any) => {
    setEditingEvent(event)
  }

  const handleDelete = (event: any) => {
    setDeletingEvent(event)
  }

  const handleEventUpdated = () => {
    // Invalidate relevant caches
    const targetUserId = userProfile?.user_id || user?.id
    if (targetUserId) {
      invalidateKey(CacheKeys.userEvents(targetUserId))
      invalidateKey(CacheKeys.userStats(targetUserId))
      invalidatePattern('discover_events')
      invalidatePattern('event_details')
    }
    setSessionsRefresh(prev => prev + 1)
    setStatsRefresh(prev => prev + 1)
    setEditingEvent(null)
    fetchEnhancedSessions()
  }

  const handleEventDeleted = () => {
    // Invalidate relevant caches
    const targetUserId = userProfile?.user_id || user?.id
    if (targetUserId) {
      invalidateKey(CacheKeys.userEvents(targetUserId))
      invalidateKey(CacheKeys.userStats(targetUserId))
      invalidatePattern('discover_events')
      invalidatePattern('event_details')
    }
    setSessionsRefresh(prev => prev + 1)
    setStatsRefresh(prev => prev + 1)
    setDeletingEvent(null)
    fetchEnhancedSessions()
  }

  // Fetch enhanced sessions when user changes or refresh triggers
  useEffect(() => {
    if (userProfile || (user?.id && !username)) {
      fetchEnhancedSessions()
    }
  }, [user?.id, userProfile, sessionsRefresh]) // Remove fetchEnhancedSessions from dependencies to prevent infinite loop

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base">
        <div className="flex h-screen items-center justify-center">
          <div className="text-center space-y-6 fade-in">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-gold animate-pulse">
              <span className="text-3xl">👤</span>
            </div>
            <div className="space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
              <p className="text-lg text-muted-foreground font-medium">Loading your profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Allow public profiles to be viewable by unauthenticated users
  if (!user && username) {
    if (profileError) return <Simple404 username={username} />
    if (!userProfile) return null // Still loading profile
    if (userProfile.profile_visibility === 'private')
      return <Simple404 username={username} />
  }

  const displayName = userProfile?.display_name || user?.email?.split('@')[0] || 'Champion'
  const avatarFallback = displayName.charAt(0).toUpperCase()



  const renderCrewsContent = () => {
    return (
      <div className="space-y-6">
        {userCrews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userCrews.map((crew) => (
              <div key={crew.id} style={{ marginBottom: '24px' }}>
                <CrewCard
                  crew={crew}
                  onCrewUpdated={handleCrewUpdated}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gradient-card rounded-2xl border border-border hover:border-border-hover">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-heading font-bold mb-2">No Crews Yet</h3>
            <p className="text-sm text-muted-foreground mb-4 px-4 max-w-sm mx-auto leading-relaxed">
              Create your first crew to organize your drinking buddies and make event planning easier.
            </p>
            <CreateCrewModal
              trigger={
                <Button size="sm" className="group">
                  <UsersIcon className="mr-2 h-4 w-4" />
                  Create Your First Crew
                  <span className="ml-2">→</span>
                </Button>
              }
              onCrewCreated={handleCrewCreated}
            />
          </div>
        )}
      </div>
    )
  }

  console.log('🎯 UserProfile render:', { loading, profileError, userProfile: !!userProfile, username })

  // ALWAYS show Simple404 if profileError is true
  if (profileError) {
    console.log('🚨 Rendering Simple404 due to profileError')
    return <Simple404 username={username} />
  }

  // Handle loading and error states
  if (loading) {
    console.log('⏳ Rendering loading state')
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="text-center space-y-4">
          <img
            src="/thirstee-logo.svg"
            alt="Thirstee"
            className="h-16 w-auto mx-auto mb-4"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return null
  }

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Consistent Width Container - Matching Timeline Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header - Only show for non-own profiles */}
          {!isOwnProfile && (
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={goBackSmart}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          )}

          {/* Two-Column Hero Section - 50:50 Layout */}
          <div>
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">

              {/* Left Column - Profile Info Card (50% width) */}
              <div className="flex">
                <ProfileInfoCard
                  userProfile={userProfile}
                  displayName={displayName}
                  avatarFallback={avatarFallback}
                  className="w-full"
                />
              </div>

              {/* Right Column - Action Cards or Info Panel (50% width) */}
              <div className="flex">
                <div className="w-full">
                  {isOwnProfile ? (
                    // Primary CTA Card for Own Profile
                    <div className="glass-modal rounded-3xl p-6 lg:p-8 border border-white/15 hover:border-primary/30 relative overflow-hidden h-full flex flex-col justify-center">
                      {/* Glass shimmer overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-white/4 opacity-0 hover:opacity-100 pointer-events-none rounded-3xl" />

                      <div className="relative z-10 space-y-6">
                        <div className="text-center space-y-3">
                          <h2 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
                            Ready to Raise Hell? 🔥
                          </h2>
                          <p className="text-muted-foreground text-base lg:text-lg">
                            Create your next session or build your crew
                          </p>
                        </div>

                      <div className="space-y-4">
                        {/* Create Session Button */}
                        <QuickEventModal
                          trigger={
                            <Button
                              size="lg"
                              className="w-full group bg-gradient-primary hover:shadow-amber-lg"
                            >
                              <Plus className="mr-3 h-5 w-5" />
                              Create Session
                              <span className="ml-3">🍻</span>
                            </Button>
                          }
                          onEventCreated={handleEventCreated}
                        />

                        {/* Build Crew Button */}
                        <CreateCrewModal
                          trigger={
                            <Button
                              variant="glass"
                              size="lg"
                              className="w-full group"
                            >
                              <UsersIcon className="mr-3 h-5 w-5" />
                              Build Crew
                              <span className="ml-3">→</span>
                            </Button>
                          }
                          onCrewCreated={handleCrewCreated}
                        />
                      </div>
                      </div>
                    </div>
                  ) : (
                    // Info Panel for Other Profiles
                    <div className="glass-modal rounded-3xl p-6 lg:p-8 border border-white/15 relative overflow-hidden h-full flex flex-col justify-center">
                      <div className="text-center">
                        <h2 className="text-xl lg:text-2xl font-display font-bold text-foreground mb-2">
                          {displayName}'s Profile
                        </h2>
                        <p className="text-muted-foreground text-sm lg:text-base">
                          Check out their sessions and crews
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Next Clink Section - Separate from Hero (only for own profile) */}
          {isOwnProfile && (
            <div>
              <NextEventBanner
                userId={user?.id || ''}
                className="glass-modal rounded-3xl"
              />
            </div>
          )}

          {/* Stats Section - Separate from Hero */}
          <div className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                count={stats?.totalEvents}
                label="Sessions"
                loading={!stats}
              />
              <StatCard
                count={stats?.totalRSVPs}
                label="RSVPs"
                loading={!stats}
              />
              <StatCard
                count={userCrews.length}
                label="Crews"
                loading={!userProfile} // Show loading until profile is loaded
              />
              {(() => {
                const drinkInfo = getDrinkInfo(userProfile?.favorite_drink)
                return (
                  <StatCard
                    icon={drinkInfo.emoji}
                    label={drinkInfo.label}
                    className={!userProfile?.favorite_drink ? 'text-[#999999]' : ''}
                    loading={!userProfile} // Show loading until profile is loaded
                  />
                )
              })()}
            </div>
          </div>

          {/* Activity Tabs - Crews and Sessions with Timeline Layout */}
          <div>
            <ActivityTabs
              crews={userCrews}
              crewsContent={renderCrewsContent()}
              upcomingEvents={enhancedSessions}
              pastEvents={pastSessions}
              onEventEdit={isOwnProfile ? handleEdit : undefined}
              onEventDelete={isOwnProfile ? handleDelete : undefined}
              storageKey={`userProfile_${username || 'own'}_activityTabs`}
              className="mt-6"
            />
          </div>

          {/* Compact Glass App Features */}
          <div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="glass-card rounded-xl p-4 sm:p-6 text-center group bg-white/5 backdrop-blur-md transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:backdrop-blur-lg cursor-pointer" style={{
                border: '1px solid hsla(0,0%,100%,.06)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div className="text-3xl sm:text-4xl mb-3">⚡</div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 text-shadow">60-Second Setup</h3>
                <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground">
                  Create hell-raising sessions in under a minute
                </p>
              </div>

              <div className="glass-card rounded-xl p-4 sm:p-6 text-center group bg-white/5 backdrop-blur-md transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:backdrop-blur-lg cursor-pointer" style={{
                border: '1px solid hsla(0,0%,100%,.06)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div className="text-3xl sm:text-4xl mb-3">📱</div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 text-shadow">Rally the Stable</h3>
                <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground">
                  Share via WhatsApp, SMS, or any app
                </p>
              </div>

              <div className="glass-card rounded-xl p-4 sm:p-6 text-center group sm:col-span-2 md:col-span-1 bg-white/5 backdrop-blur-md transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:backdrop-blur-lg cursor-pointer" style={{
                border: '1px solid hsla(0,0%,100%,.06)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div className="text-3xl sm:text-4xl mb-3">🍻</div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 text-shadow">One-Tap Hell</h3>
                <p className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground">
                  Your stable can join with just one click
                </p>
              </div>
            </div>
          </div>

          {/* Compact Stone Cold Quote */}
          <div className="text-center pt-6">
            <div className="glass-pill inline-block px-6 py-3" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
              <p className="text-base sm:text-lg text-muted-foreground hover:text-primary italic font-medium">
                "And that's the bottom line, 'cause Stone Cold said so!" 🥃
              </p>
            </div>
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
