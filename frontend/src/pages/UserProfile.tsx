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
import { ProgressAnalysisPanel } from '@/components/ProgressAnalysisPanel'
import { StatCard } from '@/components/StatCard'
import { Plus, Users as UsersIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useUserStats } from '@/hooks/useUserStats'
import { getUserProfile } from '@/lib/userService'
import { getUserCrews } from '@/lib/crewService'
import { supabase } from '@/lib/supabase'
import { useCacheInvalidation } from '@/hooks/useCachedData'
import { CacheKeys, CacheTTL, cacheService } from '@/lib/cacheService'

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
  const { user, loading } = useAuth()
  const [statsRefresh, setStatsRefresh] = useState(0)
  const [sessionsRefresh, setSessionsRefresh] = useState(0)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)
  const [enhancedSessions, setEnhancedSessions] = useState<EnhancedEvent[]>([])
  const [pastSessions, setPastSessions] = useState<EnhancedEvent[]>([])
  const [userCrews, setUserCrews] = useState<Crew[]>([])
  const [crewsRefresh, setCrewsRefresh] = useState(0)
  const { invalidatePattern, invalidateKey } = useCacheInvalidation()

  // Get user stats for inline display
  const { stats } = useUserStats(statsRefresh)

  // We're now using enhanced sessions instead of the basic hook
  // const {
  //   sessions: upcomingSessions,
  //   loading: loadingSessions,
  //   error: sessionsError
  // } = useUpcomingSessions(sessionsRefresh, 3)

  useEffect(() => {
    if (!loading && !user) {
      // navigate('/login')
    }
  }, [user, loading])

  useEffect(() => {
    if (user?.id) {
      getUserProfile(user.id).then(setUserProfile).catch(console.error)
    }
  }, [user?.id])

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

  // Cached fetch enhanced session data with creator info and RSVP counts
  const fetchEnhancedSessions = async () => {
    if (!user) return

    const cacheKey = CacheKeys.userEvents(user.id)

    // Try to get from cache first
    const cached = cacheService.get<{ upcoming: any[], past: any[] }>(cacheKey)
    if (cached) {
      setEnhancedSessions(cached.upcoming || [])
      setPastSessions(cached.past || [])
      return
    }
    try {


      // Get all crews the user is a member of
      const { data: _ } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      // Let's start simple and build up - just get events you created first
      const now = new Date().toISOString()

      console.log('Fetching events for user:', user.id)

      // Get user's crew memberships for crew-associated events
      const { data: userCrewMemberships } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      const userCrewIds = userCrewMemberships?.map(cm => cm.crew_id) || []
      console.log('User is member of crews:', userCrewIds)

      const [
        createdUpcomingResult,
        createdPastResult,
        rsvpUpcomingResult,
        rsvpPastResult,
        crewInvitedUpcomingResult,
        crewInvitedPastResult,
        crewAssociatedUpcomingResult,
        crewAssociatedPastResult
      ] = await Promise.all([
        // 1. Get upcoming events created by user with attendee data
        supabase
          .from('events')
          .select(`
            *,
            rsvps(user_id, status),
            event_members(user_id, status)
          `)
          .eq('created_by', user.id)
          .gte('date_time', now)
          .order('date_time', { ascending: true }),

        // 2. Get past events created by user with attendee data
        supabase
          .from('events')
          .select(`
            *,
            rsvps(user_id, status),
            event_members(user_id, status)
          `)
          .eq('created_by', user.id)
          .lt('date_time', now)
          .order('date_time', { ascending: false }),

        // 3. Get upcoming events user RSVP'd to with status 'going'
        supabase
          .from('events')
          .select(`
            *,
            rsvps!inner(user_id, status),
            event_members(user_id, status)
          `)
          .eq('rsvps.user_id', user.id)
          .eq('rsvps.status', 'going')
          .neq('created_by', user.id)
          .gte('date_time', now)
          .order('date_time', { ascending: true }),

        // 4. Get past events user RSVP'd to with status 'going'
        supabase
          .from('events')
          .select(`
            *,
            rsvps!inner(user_id, status),
            event_members(user_id, status)
          `)
          .eq('rsvps.user_id', user.id)
          .eq('rsvps.status', 'going')
          .neq('created_by', user.id)
          .lt('date_time', now)
          .order('date_time', { ascending: false }),

        // 5. Get upcoming events user was directly invited to via event_members
        supabase
          .from('events')
          .select(`
            *,
            event_members!inner(user_id, status),
            rsvps(user_id, status)
          `)
          .eq('event_members.user_id', user.id)
          .eq('event_members.status', 'accepted')
          .neq('created_by', user.id)
          .gte('date_time', now)
          .order('date_time', { ascending: true }),

        // 6. Get past events user was directly invited to via event_members
        supabase
          .from('events')
          .select(`
            *,
            event_members!inner(user_id, status),
            rsvps(user_id, status)
          `)
          .eq('event_members.user_id', user.id)
          .eq('event_members.status', 'accepted')
          .neq('created_by', user.id)
          .lt('date_time', now)
          .order('date_time', { ascending: false }),

        // 7. Get upcoming events associated with crews user is a member of
        userCrewIds.length > 0 ? supabase
          .from('events')
          .select(`
            *,
            rsvps(user_id, status),
            event_members(user_id, status)
          `)
          .in('crew_id', userCrewIds)
          .neq('created_by', user.id)
          .gte('date_time', now)
          .order('date_time', { ascending: true }) : Promise.resolve({ data: [], error: null }),

        // 8. Get past events associated with crews user is a member of
        userCrewIds.length > 0 ? supabase
          .from('events')
          .select(`
            *,
            rsvps(user_id, status),
            event_members(user_id, status)
          `)
          .in('crew_id', userCrewIds)
          .neq('created_by', user.id)
          .lt('date_time', now)
          .order('date_time', { ascending: false }) : Promise.resolve({ data: [], error: null })
      ])

      console.log('Created upcoming events result:', createdUpcomingResult)
      console.log('Created past events result:', createdPastResult)
      console.log('RSVP upcoming events result:', rsvpUpcomingResult)
      console.log('RSVP past events result:', rsvpPastResult)
      console.log('Crew invited upcoming events result:', crewInvitedUpcomingResult)
      console.log('Crew invited past events result:', crewInvitedPastResult)
      console.log('Crew associated upcoming events result:', crewAssociatedUpcomingResult)
      console.log('Crew associated past events result:', crewAssociatedPastResult)

      // Check for errors
      const errors = [
        createdUpcomingResult.error,
        createdPastResult.error,
        rsvpUpcomingResult.error,
        rsvpPastResult.error,
        crewInvitedUpcomingResult.error,
        crewInvitedPastResult.error,
        crewAssociatedUpcomingResult.error,
        crewAssociatedPastResult.error
      ].filter(Boolean)

      if (errors.length > 0) {
        console.error('Errors fetching events:', errors)
        throw errors[0]
      }

      // Combine all upcoming events from different sources
      const allUpcomingEventsRaw = [
        ...(createdUpcomingResult.data || []),
        ...(rsvpUpcomingResult.data || []),
        ...(crewInvitedUpcomingResult.data || []),
        ...(crewAssociatedUpcomingResult.data || [])
      ]

      // Combine all past events from different sources
      const allPastEventsRaw = [
        ...(createdPastResult.data || []),
        ...(rsvpPastResult.data || []),
        ...(crewInvitedPastResult.data || []),
        ...(crewAssociatedPastResult.data || [])
      ]

      // Remove duplicates (in case user both created and RSVP'd to same event)
      const uniqueUpcomingEvents = allUpcomingEventsRaw.reduce((acc: any[], event: any) => {
        if (!acc.find(e => e.id === event.id)) {
          acc.push(event)
        }
        return acc
      }, [])

      const uniquePastEvents = allPastEventsRaw.reduce((acc: any[], event: any) => {
        if (!acc.find(e => e.id === event.id)) {
          acc.push(event)
        }
        return acc
      }, [])

      console.log('Found total upcoming events:', uniqueUpcomingEvents.length)
      console.log('Found total past events:', uniquePastEvents.length)



      // Transform upcoming events data for EventCard compatibility
      let allUpcomingEvents = await Promise.all(uniqueUpcomingEvents.map(async (event: any) => {
        const isHosting = event.created_by === user.id

        // Get creator info for events not created by current user
        let creatorData
        if (isHosting) {
          // Use current user's profile for events they created
          creatorData = {
            display_name: userProfile?.display_name || user?.email?.split('@')[0] || 'Unknown Host',
            nickname: userProfile?.nickname,
            avatar_url: userProfile?.avatar_url,
            user_id: user.id
          }
        } else {
          // Fetch creator profile for events created by others
          try {
            const { data: creatorProfile } = await supabase
              .from('user_profiles')
              .select('display_name, nickname, avatar_url, user_id')
              .eq('user_id', event.created_by)
              .single()

            creatorData = creatorProfile || {
              display_name: `User ${event.created_by.slice(-4)}`,
              nickname: null,
              avatar_url: null,
              user_id: event.created_by
            }
          } catch (error) {
            console.error('Error fetching creator profile:', error)
            creatorData = {
              display_name: `User ${event.created_by.slice(-4)}`,
              nickname: null,
              avatar_url: null,
              user_id: event.created_by
            }
          }
        }

        return {
          ...event,
          creator: creatorData,
          isHosting
        }
      }))



      // Sort upcoming events by date (ascending - earliest first)
      allUpcomingEvents.sort((a: any, b: any) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())

      setEnhancedSessions(allUpcomingEvents)

      // Transform past events data for EventCard compatibility
      let allPastEvents = await Promise.all(uniquePastEvents.map(async (event: any) => {
        const isHosting = event.created_by === user.id

        // Get creator info for events not created by current user
        let creatorData
        if (isHosting) {
          // Use current user's profile for events they created
          creatorData = {
            display_name: userProfile?.display_name || user?.email?.split('@')[0] || 'Unknown Host',
            nickname: userProfile?.nickname,
            avatar_url: userProfile?.avatar_url,
            user_id: user.id
          }
        } else {
          // Fetch creator profile for events created by others
          try {
            const { data: creatorProfile } = await supabase
              .from('user_profiles')
              .select('display_name, nickname, avatar_url, user_id')
              .eq('user_id', event.created_by)
              .single()

            creatorData = creatorProfile || {
              display_name: `User ${event.created_by.slice(-4)}`,
              nickname: null,
              avatar_url: null,
              user_id: event.created_by
            }
          } catch (error) {
            console.error('Error fetching creator profile:', error)
            creatorData = {
              display_name: `User ${event.created_by.slice(-4)}`,
              nickname: null,
              avatar_url: null,
              user_id: event.created_by
            }
          }
        }

        return {
          ...event,
          creator: creatorData,
          isHosting
        }
      }))

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
    if (user) {
      invalidateKey(CacheKeys.userEvents(user.id))
      invalidateKey(CacheKeys.userStats(user.id))
      invalidatePattern('discover_events')
    }
    // Trigger both stats and sessions refresh
    setStatsRefresh(prev => prev + 1)
    setSessionsRefresh(prev => prev + 1)
    fetchEnhancedSessions()
  }

  const handleCrewCreated = () => {
    // Invalidate crew cache
    if (user) {
      invalidateKey(CacheKeys.userCrews(user.id))
    }
    setCrewsRefresh(prev => prev + 1)
  }

  const handleCrewUpdated = () => {
    // Invalidate crew cache
    if (user) {
      invalidateKey(CacheKeys.userCrews(user.id))
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
    if (user) {
      invalidateKey(CacheKeys.userEvents(user.id))
      invalidateKey(CacheKeys.userStats(user.id))
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
    if (user) {
      invalidateKey(CacheKeys.userEvents(user.id))
      invalidateKey(CacheKeys.userStats(user.id))
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
    if (user?.id) {
      fetchEnhancedSessions()
    }
  }, [user?.id, sessionsRefresh]) // Remove fetchEnhancedSessions from dependencies to prevent infinite loop

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

  if (!user) {
    return null // Will redirect to login
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

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Consistent Width Container - Matching Timeline Layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
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

              {/* Right Column - Action Cards (50% width) */}
              <div className="flex">
                <div className="w-full">
                  {/* Primary CTA Card Only */}
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
                </div>
              </div>
            </div>
          </div>

          {/* Next Clink Section - Separate from Hero */}
          <div>
            <NextEventBanner
              userId={user?.id || ''}
              className="glass-modal rounded-3xl"
            />
          </div>

          {/* Stats Section - Separate from Hero */}
          <div className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                count={stats.totalEvents || 0}
                label="Sessions"
                loading={!stats}
              />
              <StatCard
                count={stats.totalRSVPs || 0}
                label="RSVPs"
                loading={!stats}
              />
              <StatCard
                count={userCrews.length}
                label="Crews"
              />
              {(() => {
                const drinkInfo = getDrinkInfo(userProfile?.favorite_drink)
                return (
                  <StatCard
                    icon={drinkInfo.emoji}
                    label={drinkInfo.label}
                    className={!userProfile?.favorite_drink ? 'text-[#999999]' : ''}
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
              onEventEdit={handleEdit}
              onEventDelete={handleDelete}
              storageKey="userProfile_activityTabs"
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



      {/* Progress Analysis Panel - Only show in development */}
      {process.env.NODE_ENV === 'development' && <ProgressAnalysisPanel />}
    </div>
  )
}
