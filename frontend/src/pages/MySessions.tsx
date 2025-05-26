import { useAuth } from '@/lib/auth-context'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SessionCard } from '@/components/SessionCard'
import { QuickEventModal } from '@/components/QuickEventModal'
import { useEffect, useState } from 'react'
import { Calendar, Plus, ArrowLeft, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAllSessions } from '@/hooks/useAllSessions'

type FilterType = 'all' | 'upcoming' | 'past'

export function MySessions() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterType>('all')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Use the cached hook instead of manual data fetching
  const { sessions, loading: loadingSessions, error } = useAllSessions(filter, refreshTrigger)
  // Get all sessions for stats calculation
  const { sessions: allSessions } = useAllSessions('all', refreshTrigger)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error('Failed to load sessions. Please try again later.')
    }
  }, [error])

  const handleEventCreated = () => {
    // Trigger a refresh by updating the refresh trigger
    setRefreshTrigger(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your sessions...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const upcomingSessions = allSessions.filter(s => new Date(s.date_time) > new Date())
  const pastSessions = allSessions.filter(s => new Date(s.date_time) <= new Date())

  // The sessions from the hook are already filtered based on the current filter
  const filteredSessions = sessions

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Profile
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-8 w-8" />
                  My Sessions
                </h1>
                <p className="text-muted-foreground">
                  Manage all your drinking sessions
                </p>
              </div>
            </div>

            <QuickEventModal
              trigger={
                <Button size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Session
                </Button>
              }
              onEventCreated={handleEventCreated}
            />
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl">
            <div className="bg-card rounded-lg p-4 text-center border border-border">
              <div className="text-2xl font-bold text-primary">{allSessions.length}</div>
              <div className="text-sm text-muted-foreground">Total Sessions</div>
            </div>
            <div className="bg-card rounded-lg p-4 text-center border border-border">
              <div className="text-2xl font-bold text-primary">{upcomingSessions.length}</div>
              <div className="text-sm text-muted-foreground">Upcoming</div>
            </div>
            <div className="bg-card rounded-lg p-4 text-center border border-border">
              <div className="text-2xl font-bold text-primary">{pastSessions.length}</div>
              <div className="text-sm text-muted-foreground">Past Sessions</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground mr-2">Filter:</span>
            <div className="flex gap-2">
              <Badge
                variant={filter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('all')}
              >
                All ({allSessions.length})
              </Badge>
              <Badge
                variant={filter === 'upcoming' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('upcoming')}
              >
                Upcoming ({upcomingSessions.length})
              </Badge>
              <Badge
                variant={filter === 'past' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter('past')}
              >
                Past ({pastSessions.length})
              </Badge>
            </div>
          </div>

          {/* Sessions List */}
          {loadingSessions ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your sessions...</p>
            </div>
          ) : filteredSessions.length > 0 ? (
            <div className="grid gap-6">
              {filteredSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  event={session}
                  compact={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {filter === 'upcoming' ? 'No Upcoming Sessions' :
                 filter === 'past' ? 'No Past Sessions' : 'No Sessions Yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'upcoming'
                  ? "You don't have any upcoming drinking sessions."
                  : filter === 'past'
                  ? "You haven't hosted any sessions yet."
                  : "You haven't created any drinking sessions yet."
                }
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
      </div>
    </div>
  )
}
