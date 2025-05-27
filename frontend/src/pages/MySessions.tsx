import { useRequireAuth } from '@/hooks/useAuthState'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { SessionCard } from '@/components/SessionCard'
import { QuickEventModal } from '@/components/QuickEventModal'
import { useEffect, useState, Suspense } from 'react'
import { Calendar, Plus, ArrowLeft, Filter } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAllSessions } from '@/hooks/useAllSessions'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { FullPageSkeleton, ErrorFallback } from '@/components/SkeletonLoaders'

type FilterType = 'all' | 'upcoming' | 'past'

// Enhanced MySessions component with proper state management
function MySessionsContent() {
  const { shouldRender } = useRequireAuth()
  const [filter, setFilter] = useState<FilterType>('all')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Use the cached hook instead of manual data fetching
  const { sessions, loading: loadingSessions, error } = useAllSessions(filter, refreshTrigger)
  // Get all sessions for stats calculation
  const { sessions: allSessions } = useAllSessions('all', refreshTrigger)

  // Don't render until auth is ready and user is authenticated
  if (!shouldRender) {
    return <FullPageSkeleton />
  }

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

  // Handle error state
  if (error) {
    return (
      <ErrorFallback
        error={error}
        onRetry={() => setRefreshTrigger(prev => prev + 1)}
        title="Failed to load sessions"
        description="We couldn't load your sessions. Please try again."
      />
    )
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link to="/profile">
                <Button variant="outline" size="sm" className="w-fit">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Profile</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8" />
                  My Sessions
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  All your hell-raising sessions in one place
                </p>
              </div>
            </div>

            <QuickEventModal
              trigger={
                <Button size="lg" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-5 w-5" />
                  <span className="hidden sm:inline">Raise Some Hell</span>
                  <span className="sm:hidden">Create Session</span>
                </Button>
              }
              onEventCreated={handleEventCreated}
            />
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl">
            <div className="bg-card rounded-lg p-3 sm:p-4 text-center border border-border">
              <div className="text-lg sm:text-2xl font-bold text-primary">{allSessions.length}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Total Hell Raised</div>
            </div>
            <div className="bg-card rounded-lg p-3 sm:p-4 text-center border border-border">
              <div className="text-lg sm:text-2xl font-bold text-primary">{upcomingSessions.length}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Upcoming</div>
            </div>
            <div className="bg-card rounded-lg p-3 sm:p-4 text-center border border-border">
              <div className="text-lg sm:text-2xl font-bold text-primary">{pastSessions.length}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Hell Raised</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={filter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer text-xs sm:text-sm"
                onClick={() => setFilter('all')}
              >
                All ({allSessions.length})
              </Badge>
              <Badge
                variant={filter === 'upcoming' ? 'default' : 'outline'}
                className="cursor-pointer text-xs sm:text-sm"
                onClick={() => setFilter('upcoming')}
              >
                Upcoming ({upcomingSessions.length})
              </Badge>
              <Badge
                variant={filter === 'past' ? 'default' : 'outline'}
                className="cursor-pointer text-xs sm:text-sm"
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
              <p className="text-muted-foreground">Loading your hell-raising sessions...</p>
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
                  ? "No upcoming parties planned. Time to fix that!"
                  : filter === 'past'
                  ? "You haven't partied yet. Let's change that!"
                  : "You haven't created any sessions yet. Time to start the party!"
                }
              </p>
              <QuickEventModal
                trigger={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Start the Party
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

// Main export with error boundary and suspense
export function MySessions() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<FullPageSkeleton />}>
        <MySessionsContent />
      </Suspense>
    </ErrorBoundary>
  )
}
