import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { QuickEventModal } from '@/components/QuickEventModal'
import { EditEventModal } from '@/components/EditEventModal'
import { DeleteEventDialog } from '@/components/DeleteEventDialog'
import { UserStats } from '@/components/UserStats'
import { EventCard } from '@/components/EventCard'
import { useEffect, useState } from 'react'
import { Calendar, Plus } from 'lucide-react'
import { getUserProfile } from '@/lib/userService'
import { supabase } from '@/lib/supabase'
import type { UserProfile, Event } from '@/types'

interface EnhancedEvent extends Event {
  creator?: {
    display_name: string | null
    avatar_url: string | null
    user_id: string
  }
  rsvp_count?: number
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

  // Fetch enhanced session data with creator info and RSVP counts
  const fetchEnhancedSessions = async () => {
    if (!user?.id) return

    setLoadingEnhanced(true)
    try {
      // Get the user's profile for creator info first (single fetch)
      const { data: userProfileData } = await supabase
        .from('user_profiles')
        .select('display_name, avatar_url, user_id')
        .eq('user_id', user.id)
        .single()

      const creatorInfo = userProfileData || {
        display_name: user.email?.split('@')[0] || 'You',
        avatar_url: null,
        user_id: user.id
      }

      // Fetch upcoming and past sessions in parallel
      const [upcomingResult, pastResult] = await Promise.all([
        // Upcoming sessions
        supabase
          .from('events')
          .select(`
            *,
            rsvps (
              status
            )
          `)
          .eq('created_by', user.id)
          .gte('date_time', new Date().toISOString())
          .order('date_time', { ascending: true }),

        // Past sessions
        supabase
          .from('events')
          .select(`
            *,
            rsvps (
              status
            )
          `)
          .eq('created_by', user.id)
          .lt('date_time', new Date().toISOString())
          .order('date_time', { ascending: false })
          .limit(6)
      ])

      // Process upcoming sessions
      if (upcomingResult.error) {
        console.error('Error fetching upcoming sessions:', upcomingResult.error)
      } else {
        const enhancedUpcoming = (upcomingResult.data || []).map(event => ({
          ...event,
          creator: creatorInfo,
          rsvp_count: event.rsvps?.filter((r: any) => r.status === 'going').length || 0
        }))
        setEnhancedSessions(enhancedUpcoming)
      }

      // Process past sessions
      if (pastResult.error) {
        console.error('Error fetching past sessions:', pastResult.error)
      } else {
        const enhancedPast = (pastResult.data || []).map(event => ({
          ...event,
          creator: creatorInfo,
          rsvp_count: event.rsvps?.filter((r: any) => r.status === 'going').length || 0
        }))
        setPastSessions(enhancedPast)
      }
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


            </div>
          </div>

          {/* Upcoming Sessions Preview */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                Your Upcoming Hell
              </h2>

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
                    showHostActions={true}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Hell</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
                  You haven't created any upcoming hell-raising sessions yet.
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
                Your Past Sessions
              </h2>
            </div>

            {loadingEnhanced ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading past sessions...</p>
              </div>
            ) : pastSessions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {pastSessions.map((session) => (
                  <EventCard
                    key={session.id}
                    event={session}
                    showHostActions={false}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Past Sessions</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
                  Your completed hell-raising sessions will appear here.
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
