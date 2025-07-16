import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { sendEventInvitationsToUsers } from '@/lib/eventInvitationService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface DebugLog {
  type: 'info' | 'success' | 'error'
  message: string
  data?: any
  timestamp: Date
}

export default function IndividualInvitationsDebug() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [testEvent, setTestEvent] = useState<any>(null)
  const [testUsers, setTestUsers] = useState<any[]>([])

  const addLog = (type: DebugLog['type'], message: string, data?: any) => {
    setLogs(prev => [...prev, { type, message, data, timestamp: new Date() }])
  }

  const clearLogs = () => setLogs([])

  useEffect(() => {
    if (user) {
      loadTestData()
    }
  }, [user])

  const loadTestData = async () => {
    try {
      addLog('info', 'Loading test data...')

      // Get or create a test event
      let { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', user!.id)
        .limit(1)

      if (eventsError) throw eventsError

      let event = events?.[0]

      if (!event) {
        addLog('info', 'Creating test event...')
        const { data: newEvent, error: createError } = await supabase
          .from('events')
          .insert({
            title: 'Debug Individual Invitations',
            description: 'Testing individual user invitations',
            location: 'Debug Location',
            date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            created_by: user!.id,
            privacy: 'private'
          })
          .select()
          .single()

        if (createError) throw createError
        event = newEvent
      }

      setTestEvent(event)
      addLog('success', 'Test event loaded', { id: event.id, title: event.title })

      // Get test users
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, email')
        .neq('user_id', user!.id)
        .limit(3)

      if (usersError) throw usersError

      setTestUsers(users || [])
      addLog('success', `Found ${users?.length || 0} test users`, users)

    } catch (error: any) {
      addLog('error', 'Failed to load test data', error)
    }
  }

  const testRPCFunction = async () => {
    if (!testEvent || testUsers.length === 0) {
      toast.error('Test data not loaded')
      return
    }

    setIsLoading(true)
    try {
      addLog('info', 'Testing send_event_invitations_to_users RPC function...')

      const userIds = testUsers.map(u => u.user_id)

      const { data, error } = await supabase
        .rpc('send_event_invitations_to_users', {
          p_event_id: testEvent.id,
          p_user_ids: userIds,
          p_invited_by: user!.id
        })

      if (error) {
        addLog('error', 'RPC function failed', error)
        toast.error('RPC function failed - function may not exist')
      } else {
        addLog('success', 'RPC function succeeded', data)
        toast.success('RPC function works!')
      }

    } catch (error: any) {
      addLog('error', 'RPC function exception', error)
      toast.error('RPC function exception')
    } finally {
      setIsLoading(false)
    }
  }

  const testFrontendService = async () => {
    if (!testEvent || testUsers.length === 0) {
      toast.error('Test data not loaded')
      return
    }

    setIsLoading(true)
    try {
      addLog('info', 'Testing frontend sendEventInvitationsToUsers service...')

      const userIds = testUsers.map(u => u.user_id)
      const result = await sendEventInvitationsToUsers(testEvent.id, userIds, user!.id)

      if (result.success) {
        addLog('success', 'Frontend service succeeded', result)
        toast.success(`Successfully invited ${result.invitedCount} users`)
      } else {
        addLog('error', 'Frontend service failed', result)
        toast.error('Frontend service failed')
      }

    } catch (error: any) {
      addLog('error', 'Frontend service exception', error)
      toast.error('Frontend service exception')
    } finally {
      setIsLoading(false)
    }
  }

  const checkNotifications = async () => {
    if (testUsers.length === 0) {
      toast.error('No test users loaded')
      return
    }

    try {
      addLog('info', 'Checking recent notifications...')

      const userIds = testUsers.map(u => u.user_id)

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'event_invitation')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      addLog('success', `Found ${notifications?.length || 0} recent notifications`, notifications)
      toast.success(`Found ${notifications?.length || 0} notifications`)

    } catch (error: any) {
      addLog('error', 'Failed to check notifications', error)
      toast.error('Failed to check notifications')
    }
  }

  if (!user) {
    return <div className="p-8">Please log in to use this debug page.</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Individual Invitations Debug</CardTitle>
          <p className="text-sm text-muted-foreground">
            Debug page for testing individual user invitation functionality
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Data Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Test Event</CardTitle>
              </CardHeader>
              <CardContent>
                {testEvent ? (
                  <div className="text-xs">
                    <p><strong>ID:</strong> {testEvent.id}</p>
                    <p><strong>Title:</strong> {testEvent.title}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Test Users</CardTitle>
              </CardHeader>
              <CardContent>
                {testUsers.length > 0 ? (
                  <div className="text-xs space-y-1">
                    {testUsers.map(user => (
                      <p key={user.user_id}>{user.display_name}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Test Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={testRPCFunction} 
              disabled={isLoading}
              variant="outline"
            >
              Test RPC Function
            </Button>
            <Button 
              onClick={testFrontendService} 
              disabled={isLoading}
              variant="outline"
            >
              Test Frontend Service
            </Button>
            <Button 
              onClick={checkNotifications} 
              disabled={isLoading}
              variant="outline"
            >
              Check Notifications
            </Button>
            <Button 
              onClick={clearLogs} 
              variant="ghost"
              size="sm"
            >
              Clear Logs
            </Button>
          </div>

          {/* Debug Logs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`text-xs p-2 rounded ${
                      log.type === 'error' ? 'bg-red-100 text-red-800' :
                      log.type === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{log.message}</span>
                      <span className="text-xs opacity-70">
                        {log.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {log.data && (
                      <pre className="mt-1 text-xs opacity-80 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-xs text-muted-foreground">No logs yet. Run a test to see results.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
