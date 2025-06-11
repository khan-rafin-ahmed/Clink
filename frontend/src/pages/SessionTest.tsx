import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useUserSessions } from '@/hooks/useUserSessions'
import { getSessionInfo, isSessionValid, refreshSessionIfNeeded } from '@/lib/sessionUtils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Clock, CheckCircle, XCircle, User, Calendar } from 'lucide-react'

export function SessionTest() {
  const { user } = useAuth()
  const { upcomingSessions, pastSessions, loading, error, refresh } = useUserSessions()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [sessionValid, setSessionValid] = useState<boolean | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Load session info on mount
  useEffect(() => {
    loadSessionInfo()
  }, [])

  const loadSessionInfo = async () => {
    try {
      const info = await getSessionInfo()
      const valid = await isSessionValid()
      setSessionInfo(info)
      setSessionValid(valid)
    } catch (error) {
      console.error('Failed to load session info:', error)
    }
  }

  const handleRefreshSession = async () => {
    setRefreshing(true)
    try {
      await refreshSessionIfNeeded()
      await loadSessionInfo()
    } catch (error) {
      console.error('Failed to refresh session:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const formatExpiresIn = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Not Authenticated</h2>
            <p className="text-muted-foreground">Please log in to test session functionality.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Session & Database Test</h1>
        <p className="text-muted-foreground">
          Testing session management and user events functionality
        </p>
      </div>

      {/* Session Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Session Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Session Status</h3>
              <div className="flex items-center gap-2">
                {sessionValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <Badge variant={sessionValid ? "default" : "destructive"}>
                  {sessionValid ? "Valid" : "Invalid/Expired"}
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">User ID</h3>
              <code className="text-sm bg-muted p-2 rounded block">
                {sessionInfo?.userId || 'N/A'}
              </code>
            </div>
          </div>

          {sessionInfo?.expiresIn && (
            <div>
              <h3 className="font-semibold mb-2">Session Expires In</h3>
              <Badge variant={sessionInfo.expiresIn < 600 ? "destructive" : "default"}>
                {formatExpiresIn(sessionInfo.expiresIn)}
              </Badge>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={loadSessionInfo} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Info
            </Button>
            <Button 
              onClick={handleRefreshSession} 
              variant="outline" 
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Sessions ({upcomingSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : upcomingSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No upcoming sessions</p>
            ) : (
              <div className="space-y-2">
                {upcomingSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium">{session.title}</h4>
                    <p className="text-sm text-muted-foreground">{session.location}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.date_time).toLocaleString()}
                    </p>
                  </div>
                ))}
                {upcomingSessions.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{upcomingSessions.length - 5} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Past Sessions ({pastSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            ) : pastSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No past sessions</p>
            ) : (
              <div className="space-y-2">
                {pastSessions.slice(0, 5).map((session) => (
                  <div key={session.id} className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium">{session.title}</h4>
                    <p className="text-sm text-muted-foreground">{session.location}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.date_time).toLocaleString()}
                    </p>
                  </div>
                ))}
                {pastSessions.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{pastSessions.length - 5} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All Data
        </Button>
      </div>
    </div>
  )
}
