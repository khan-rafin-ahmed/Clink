import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { QuickEventModal } from '@/components/QuickEventModal'
import { EditEventModal } from '@/components/EditEventModal'
import { DeleteEventDialog } from '@/components/DeleteEventDialog'
import { UserStats } from '@/components/UserStats'
import { EnhancedEventCard } from '@/components/EnhancedEventCard'
import { CreateCrewModal } from '@/components/CreateCrewModal'
import { CrewCard } from '@/components/CrewCard'
import { NextEventBanner } from '@/components/NextEventBanner'
import { EventTabs } from '@/components/EventTabs'
import { useEffect, useState } from 'react'

import { Calendar, Plus, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { getUserProfile } from '@/lib/userService'
import { getUserCrews } from '@/lib/crewService'
import { supabase } from '@/lib/supabase'
import { useCacheInvalidation } from '@/hooks/useCachedData'
import { CacheKeys, CacheTTL, cacheService } from '@/lib/cacheService'

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
  const { invalidatePattern, invalidateKey } = useCacheInvalidation()

  const itemsPerPage = 10

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
      setLoadingEnhanced(false)
      return
    }

    setLoadingEnhanced(true)
    try {
      // Get creator info once
      const { data: creatorData } = await supabase
        .from('user_profiles')
        .select('display_name, nickname, avatar_url, user_id')
        .eq('user_id', user.id)
        .single()

      const creatorInfo = creatorData || {
        display_name: 'Unknown Host',
        nickname: null,
        avatar_url: null,
        user_id: user.id
      }

      // Get all crews the user is a member of
      const { data: _ } = await supabase
        .from('crew_members')
        .select('crew_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      // Get all events user has access to with proper privacy filtering
      // This prevents duplicates and ensures proper privacy filtering
      const [
        allUpcomingResult,
        allPastResult
      ] = await Promise.all([
        // Upcoming events (hosted, RSVP'd, or invited)
        supabase.rpc('get_user_accessible_events', {
          user_id: user.id,
          include_past: false,
          event_limit: 50
        }),

        // Past events (hosted or attended)
        supabase.rpc('get_user_accessible_events', {
          user_id: user.id,
          include_past: true,
          event_limit: 50
        })
      ])



      // Process upcoming events with proper creator info
      const allUpcomingEvents = []

      if (allUpcomingResult.error) {
        console.error('Error fetching upcoming events:', allUpcomingResult.error)
      } else {
        // Process all upcoming events and add creator info (now included in RPC response)
        const upcomingEventsWithCreators = (allUpcomingResult.data || []).map((event: any) => {
          const isHosting = event.created_by === user.id

          // Get creator info - use RPC response data or fallback to current user info
          let creatorData = creatorInfo
          if (!isHosting) {
            creatorData = (event.creator_display_name || event.creator_nickname) ? {
              display_name: event.creator_display_name,
              nickname: event.creator_nickname,
              avatar_url: event.creator_avatar_url,
              user_id: event.created_by
            } : {
              display_name: 'Unknown Host',
              nickname: null,
              avatar_url: null,
              user_id: event.created_by
            }
          }

          return {
            ...event,
            creator: creatorData,
            rsvp_count: event.rsvp_count || 0, // Use the count from the function
            isHosting
          }
        })
        allUpcomingEvents.push(...upcomingEventsWithCreators)
      }



      // Sort all upcoming events by date
      allUpcomingEvents.sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime())

      setEnhancedSessions(allUpcomingEvents)

      // Process past events with proper creator info
      const allPastEvents = []

      if (allPastResult.error) {
        console.error('Error fetching past events:', allPastResult.error)
      } else {
        // Process all past events and add creator info (now included in RPC response)
        const pastEventsWithCreators = (allPastResult.data || []).map((event: any) => {
          const isHosting = event.created_by === user.id

          // Get creator info - use RPC response data or fallback to current user info
          let creatorData = creatorInfo
          if (!isHosting) {
            creatorData = (event.creator_display_name || event.creator_nickname) ? {
              display_name: event.creator_display_name,
              nickname: event.creator_nickname,
              avatar_url: event.creator_avatar_url,
              user_id: event.created_by
            } : {
              display_name: 'Unknown Host',
              nickname: null,
              avatar_url: null,
              user_id: event.created_by
            }
          }

          return {
            ...event,
            creator: creatorData,
            rsvp_count: event.rsvp_count || 0, // Use the count from the function
            isHosting
          }
        })
        allPastEvents.push(...pastEventsWithCreators)
      }

      // Sort all past events by date (most recent first)
      allPastEvents.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
      setPastSessions(allPastEvents)

      // Cache the results
      cacheService.set(cacheKey, {
        upcoming: allUpcomingEvents,
        past: allPastEvents
      }, CacheTTL.SHORT)
    } catch (error) {
      console.error('Error fetching enhanced sessions:', error)
    } finally {
      setLoadingEnhanced(false)
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
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary-muted)_0%,_transparent_50%)] opacity-20"></div>

        <div className="relative flex h-screen items-center justify-center">
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

  const pageCount = Math.ceil(pastSessions.length / itemsPerPage)
  const displayedPastSessions = pastSessions.slice((pastPage - 1) * itemsPerPage, pastPage * itemsPerPage)

  // Render upcoming events content
  const renderUpcomingContent = () => {
    if (loadingEnhanced) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Calendar className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-muted-foreground font-medium">Loading your sessions...</p>
        </div>
      )
    }

    if (enhancedSessions.length === 0) {
      return (
        <div className="text-center py-16 bg-gradient-card rounded-2xl border border-border hover:border-border-hover transition-all duration-300">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-heading font-bold mb-3">No Upcoming Hell</h3>
          <p className="text-base text-muted-foreground mb-6 px-4 max-w-md mx-auto leading-relaxed">
            You haven't created or joined any upcoming hell-raising sessions yet. Time to change that!
          </p>
          <QuickEventModal
            trigger={
              <Button size="lg" className="group hover-glow">
                <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                🍺 Start Raising Hell
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </Button>
            }
            onEventCreated={handleEventCreated}
          />
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {enhancedSessions.map((session, index) => (
          <div key={session.id} className="scale-in" style={{ animationDelay: `${0.7 + index * 0.1}s` }}>
            <EnhancedEventCard
              event={session}
              showHostActions={session.isHosting}
              onEdit={session.isHosting ? handleEdit : undefined}
              onDelete={session.isHosting ? handleDelete : undefined}
              variant="default"
            />
          </div>
        ))}
      </div>
    )
  }

  // Render past events content
  const renderPastContent = () => {
    if (loadingEnhanced) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading past sessions...</p>
        </div>
      )
    }

    if (pastSessions.length === 0) {
      return (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Past Hell</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
            Your completed hell-raising sessions (hosted and attended) will appear here.
          </p>
        </div>
      )
    }

    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {displayedPastSessions.map((session) => (
            <EnhancedEventCard
              key={session.id}
              event={session}
              showHostActions={false}
              onEdit={undefined}
              onDelete={undefined}
              variant="default"
            />
          ))}
        </div>
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {/* Previous Button - Hidden on first page */}
            {pastPage > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPastPage(p => p - 1)}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
            )}

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                const showPage =
                  page === 1 ||
                  page === pageCount ||
                  Math.abs(page - pastPage) <= 1

                if (!showPage) {
                  // Show ellipsis for gaps
                  if (page === pastPage - 2 || page === pastPage + 2) {
                    return (
                      <span key={page} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    )
                  }
                  return null
                }

                return (
                  <Button
                    key={page}
                    variant={page === pastPage ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setPastPage(page)}
                    className={`min-w-[40px] ${
                      page === pastPage
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>

            {/* Next Button - Hidden on last page */}
            {pastPage < pageCount && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPastPage(p => p + 1)}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Page Info */}
        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {((pastPage - 1) * itemsPerPage) + 1} to {Math.min(pastPage * itemsPerPage, pastSessions.length)} of {pastSessions.length} past sessions
          </p>
        </div>
      </>
    )
  }

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
        <div className="space-y-8">
          {/* Enhanced Profile Header */}
          <div className="text-center space-y-8 fade-in">
            <div className="relative">
              {/* Profile Avatar & Info */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8">
                <div className="relative group">
                  <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary/20 shadow-gold hover-scale">
                    <AvatarImage src={userProfile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl sm:text-4xl font-bold">
                      {avatarFallback}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="text-center sm:text-left space-y-3">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground">
                    {displayName}'s <span className="bg-gradient-primary bg-clip-text text-transparent">Profile</span> 🍻
                  </h1>
                  {userProfile?.nickname && (
                    <p className="text-lg sm:text-xl text-yellow-400 font-medium italic">
                      aka {userProfile.nickname} 🐉
                    </p>
                  )}
                  {userProfile?.tagline && (
                    <p className="text-lg sm:text-xl text-primary font-medium italic">
                      "{userProfile.tagline}"
                    </p>
                  )}
                  {userProfile?.bio && (
                    <p className="text-base text-muted-foreground max-w-md leading-relaxed">
                      {userProfile.bio}
                    </p>
                  )}
                </div>
              </div>


            </div>
          </div>

          {/* Enhanced User Stats */}
          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <UserStats className="max-w-2xl mx-auto" refreshTrigger={statsRefresh} />
          </div>

          {/* Enhanced Next Event Banner */}
          {user?.id && (
            <div className="slide-up" style={{ animationDelay: '0.3s' }}>
              <NextEventBanner
                userId={user.id}
                className="max-w-4xl mx-auto"
              />
            </div>
          )}

          {/* Enhanced Quick Actions */}
          <div className="slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="bg-gradient-card rounded-2xl p-6 lg:p-8 border border-border hover:border-border-hover transition-all duration-300 backdrop-blur-sm">
              <div className="text-center space-y-6">
                <h3 className="text-xl font-heading font-bold text-foreground">
                  Ready to Raise Hell? 🍻
                </h3>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <QuickEventModal
                    trigger={
                      <Button size="lg" className="w-full sm:w-auto group hover-glow">
                        <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" />
                        🍺 Create Session
                        <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                      </Button>
                    }
                    onEventCreated={handleEventCreated}
                  />

                  <CreateCrewModal
                    trigger={
                      <Button size="lg" variant="outline" className="w-full sm:w-auto group backdrop-blur-sm">
                        <Users className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                        Build Crew
                        <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                      </Button>
                    }
                    onCrewCreated={handleCrewCreated}
                  />
                </div>


              </div>
            </div>
          </div>

          {/* Enhanced Crews Section */}
          <div className="slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-3">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  Your <span className="bg-gradient-primary bg-clip-text text-transparent">Crews</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {userCrews.length} crew{userCrews.length !== 1 ? 's' : ''}
                </p>
              </div>

              {userCrews.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {userCrews.map((crew, index) => (
                    <div key={crew.id} className="scale-in" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                      <CrewCard
                        crew={crew}
                        onCrewUpdated={handleCrewUpdated}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-gradient-card rounded-2xl border border-border hover:border-border-hover transition-all duration-300">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-3">No Crews Yet</h3>
                  <p className="text-base text-muted-foreground mb-6 px-4 max-w-md mx-auto leading-relaxed">
                    Create your first crew to organize your drinking buddies and make event planning easier.
                  </p>
                  <CreateCrewModal
                    trigger={
                      <Button size="lg" className="group hover-glow">
                        <Users className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                        Create Your First Crew
                        <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                      </Button>
                    }
                    onCrewCreated={handleCrewCreated}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Event Tabs - Upcoming and Past Sessions */}
          <div className="slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-2xl sm:text-3xl font-display font-bold flex items-center gap-3">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  Your <span className="bg-gradient-primary bg-clip-text text-transparent">Sessions</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {enhancedSessions.length + pastSessions.length} total session{(enhancedSessions.length + pastSessions.length) !== 1 ? 's' : ''}
                </p>
              </div>

              <EventTabs
                upcomingEvents={enhancedSessions}
                pastEvents={pastSessions}
                upcomingContent={renderUpcomingContent()}
                pastContent={renderPastContent()}
                storageKey="userProfile_eventTabs"
                className="mt-6"
              />
            </div>
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
