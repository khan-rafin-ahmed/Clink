import { useAuth } from '@/lib/auth-context'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { QuickEventModal } from '@/components/QuickEventModal'
import { UserStats } from '@/components/UserStats'
import { SessionCard } from '@/components/SessionCard'
import { useUpcomingSessions } from '@/hooks/useUpcomingSessions'
import { useEffect, useState } from 'react'
import { Calendar, Plus, Eye } from 'lucide-react'
import { getUserProfile } from '@/lib/userService'
import type { UserProfile } from '@/types'

export function UserProfile() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [statsRefresh, setStatsRefresh] = useState(0)
  const [sessionsRefresh, setSessionsRefresh] = useState(0)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  // Use the custom hook for upcoming sessions
  const {
    sessions: upcomingSessions,
    loading: loadingSessions,
    error: sessionsError
  } = useUpcomingSessions(sessionsRefresh, 3)

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

  const handleEventCreated = () => {
    // Trigger both stats and sessions refresh
    setStatsRefresh(prev => prev + 1)
    setSessionsRefresh(prev => prev + 1)
  }

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
            <div className="flex items-center justify-center gap-3">
              <Avatar className="w-16 h-16">
                <AvatarImage src={userProfile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">
                  {displayName}'s Profile 🍻
                </h1>
                <p className="text-muted-foreground">
                  Ready to raise some hell? Let's get this party started!
                </p>
              </div>
            </div>

            <div className="bg-primary/10 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-muted-foreground">
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
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <QuickEventModal
                trigger={
                  <Button size="lg" className="text-lg px-8 py-4 font-semibold">
                    <Plus className="mr-2 h-5 w-5" />
                    Create New Session
                  </Button>
                }
                onEventCreated={handleEventCreated}
              />

              <Link to="/my-sessions">
                <Button size="lg" variant="outline" className="text-lg px-8 py-4 font-semibold">
                  <Eye className="mr-2 h-5 w-5" />
                  View All Sessions
                </Button>
              </Link>
            </div>
          </div>

          {/* Upcoming Sessions Preview */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Your Upcoming Sessions
              </h2>
              {upcomingSessions.length > 0 && (
                <Link to="/my-sessions">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              )}
            </div>

            {loadingSessions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading sessions...</p>
              </div>
            ) : sessionsError ? (
              <div className="text-center py-8 bg-card rounded-xl border border-border">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-destructive">Failed to Load Sessions</h3>
                <p className="text-muted-foreground mb-4">
                  {sessionsError}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSessionsRefresh(prev => prev + 1)}
                >
                  Try Again
                </Button>
              </div>
            ) : upcomingSessions.length > 0 ? (
              <div className="grid gap-4">
                {upcomingSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    event={session}
                    compact={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Sessions</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created any upcoming drinking sessions yet.
                </p>
                <QuickEventModal
                  trigger={
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Session
                    </Button>
                  }
                  onEventCreated={handleEventCreated}
                />
              </div>
            )}
          </div>

          {/* App Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-lg font-semibold mb-2">60-Second Setup</h3>
              <p className="text-sm text-muted-foreground">
                Create drinking sessions in under a minute
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="text-lg font-semibold mb-2">Instant Sharing</h3>
              <p className="text-sm text-muted-foreground">
                Share via WhatsApp, SMS, or any app
              </p>
            </div>

            <div className="bg-card rounded-xl p-6 text-center border border-border">
              <div className="text-4xl mb-3">🍻</div>
              <h3 className="text-lg font-semibold mb-2">One-Tap RSVP</h3>
              <p className="text-sm text-muted-foreground">
                Friends can join with just one click
              </p>
            </div>
          </div>

          {/* Stone Cold Quote */}
          <div className="text-center pt-8">
            <p className="text-lg text-muted-foreground italic">
              "And that's the bottom line, 'cause Stone Cold said so!" 🥃
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
