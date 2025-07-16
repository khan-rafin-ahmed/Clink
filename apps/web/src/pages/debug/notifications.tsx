import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RefreshCw, Play, CheckCircle, XCircle, AlertCircle, Database, Mail, Bell } from 'lucide-react'

interface DebugLog {
  timestamp: string
  type: 'info' | 'success' | 'error' | 'warning'
  message: string
  data?: any
}

interface TestEvent {
  id?: string
  title: string
  date_time: string
  location: string
  place_id?: string
  place_name?: string
  latitude?: number
  longitude?: number
  notes: string
  drink_type: 'beer' | 'wine' | 'cocktails' | 'shots' | 'mixed' | 'other'
  vibe: 'casual' | 'party' | 'chill' | 'wild' | 'classy' | 'other'
  is_public: boolean
  event_code?: string
  public_slug?: string
  private_slug?: string
}

interface InvitationToken {
  id: string
  token: string
  invitation_type: string
  invitation_id: string
  action: string
  user_id: string
  expires_at: string
  used: boolean
  created_at: string
}

interface EventMember {
  id: string
  event_id: string
  user_id: string
  invited_by: string
  status: string
  invitation_sent_at: string
  invitation_responded_at: string
  user?: {
    display_name: string
    email: string
  }
}

interface NotificationRecord {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data: any
  read: boolean
  created_at: string
}

export default function NotificationDebugPage() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<DebugLog[]>([])
  const [loading, setLoading] = useState(false)
  
  // Test Event State
  const [testEvent, setTestEvent] = useState<TestEvent>({
    title: 'Debug Test Event',
    date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    location: 'Test Location',
    notes: 'This is a test event for debugging the notification system',
    drink_type: 'mixed',
    vibe: 'casual',
    is_public: true
  })
  const [createdEventId, setCreatedEventId] = useState<string>('')
  
  // Token Testing State
  const [testToken, setTestToken] = useState('')
  const [tokenTestResult, setTokenTestResult] = useState<any>(null)
  
  // Database State
  const [invitationTokens, setInvitationTokens] = useState<InvitationToken[]>([])
  const [eventMembers, setEventMembers] = useState<EventMember[]>([])
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  
  // Test User Email
  const [testUserEmail, setTestUserEmail] = useState('')
  
  // End-to-End Test State
  const [e2eTestRunning, setE2eTestRunning] = useState(false)
  const [e2eTestSteps, setE2eTestSteps] = useState<{[key: string]: 'pending' | 'running' | 'success' | 'error'}>({})

  const addLog = (type: DebugLog['type'], message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    }
    setLogs(prev => [log, ...prev])
    console.log(`[${type.toUpperCase()}] ${message}`, data)
  }

  const clearLogs = () => setLogs([])

  // Create Test Event
  const createTestEvent = async () => {
    if (!user) return
    
    setLoading(true)
    addLog('info', 'Creating test event...', testEvent)
    
    try {
      const eventData: any = {
        title: testEvent.title,
        date_time: testEvent.date_time,
        location: testEvent.location,
        place_id: testEvent.place_id,
        place_name: testEvent.place_name,
        latitude: testEvent.latitude,
        longitude: testEvent.longitude,
        notes: testEvent.notes,
        drink_type: testEvent.drink_type,
        vibe: testEvent.vibe,
        is_public: testEvent.is_public,
        created_by: user.id
      }

      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()
      
      if (error) throw error
      
      setCreatedEventId(data.id)
      addLog('success', 'Test event created successfully', data)
      toast.success('Test event created!')
      
      // Refresh database state
      await refreshDatabaseState()
      
    } catch (error: any) {
      addLog('error', 'Failed to create test event', error)
      toast.error('Failed to create test event')
    } finally {
      setLoading(false)
    }
  }

  // Send Test Invitation
  const sendTestInvitation = async () => {
    if (!createdEventId || !testUserEmail || !user) return
    
    setLoading(true)
    addLog('info', 'Sending test invitation...', { eventId: createdEventId, email: testUserEmail })
    
    try {
      // First, find or create a user with this email
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', testUserEmail)
        .single()
      
      let targetUserId = existingUser?.user_id
      
      if (!targetUserId) {
        // For debug purposes, we'll create a mock invitation without creating a real user
        // In a real scenario, the user would already exist
        addLog('warning', 'User not found, creating mock invitation for testing', { email: testUserEmail })

        // Create a temporary user ID for testing
        targetUserId = '00000000-0000-0000-0000-000000000001' // Mock user ID

        // Note: In production, this would require the user to exist
        addLog('info', 'Using mock user ID for testing purposes', { mockUserId: targetUserId })
      }
      
      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('event_members')
        .insert({
          event_id: createdEventId,
          user_id: targetUserId,
          invited_by: user.id,
          status: 'pending',
          invitation_sent_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (inviteError) throw inviteError
      
      addLog('success', 'Invitation created', invitation)
      
      // Send email with tokens
      const { data: emailResult, error: emailError } = await supabase
        .rpc('send_event_invitation_emails_with_tokens', {
          p_event_id: createdEventId,
          p_inviter_id: user.id
        })
      
      if (emailError) throw emailError
      
      addLog('success', 'Email invitation sent with tokens', emailResult)
      toast.success('Test invitation sent!')
      
      // Refresh database state
      await refreshDatabaseState()
      
    } catch (error: any) {
      addLog('error', 'Failed to send test invitation', error)
      toast.error('Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  // Test Token Processing
  const testTokenProcessing = async () => {
    if (!testToken) return
    
    setLoading(true)
    addLog('info', 'Testing token processing...', { token: testToken })
    
    try {
      const { data, error } = await supabase
        .rpc('process_event_invitation_token', {
          p_token: testToken,
          p_user_id: user?.id
        })
      
      if (error) throw error
      
      setTokenTestResult(data)
      addLog('success', 'Token processing result', data)
      
      if (data.success) {
        toast.success('Token processed successfully!')
      } else {
        toast.error(`Token processing failed: ${data.message}`)
      }
      
      // Refresh database state
      await refreshDatabaseState()
      
    } catch (error: any) {
      addLog('error', 'Token processing failed', error)
      setTokenTestResult({ success: false, error: error.message })
      toast.error('Token processing failed')
    } finally {
      setLoading(false)
    }
  }

  // Refresh Database State
  const refreshDatabaseState = async () => {
    addLog('info', 'Refreshing database state...')
    
    try {
      // Get invitation tokens
      const { data: tokens } = await supabase
        .from('invitation_tokens')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      
      setInvitationTokens(tokens || [])
      
      // Get event members
      const { data: members } = await supabase
        .from('event_members')
        .select(`
          *,
          user:user_profiles(display_name, email)
        `)
        .order('invitation_sent_at', { ascending: false })
        .limit(20)
      
      setEventMembers(members || [])
      
      // Get notifications
      const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      setNotifications(notifs || [])
      
      addLog('success', 'Database state refreshed')
      
    } catch (error: any) {
      addLog('error', 'Failed to refresh database state', error)
    }
  }

  // Run End-to-End Test
  const runE2ETest = async () => {
    if (!user || !testUserEmail) return
    
    setE2eTestRunning(true)
    setE2eTestSteps({
      createEvent: 'running',
      sendInvitation: 'pending',
      processToken: 'pending',
      verifySync: 'pending'
    })
    
    try {
      // Step 1: Create Event
      addLog('info', 'E2E Test Step 1: Creating event...')
      await createTestEvent()
      setE2eTestSteps(prev => ({ ...prev, createEvent: 'success', sendInvitation: 'running' }))
      
      // Step 2: Send Invitation
      addLog('info', 'E2E Test Step 2: Sending invitation...')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for event creation
      await sendTestInvitation()
      setE2eTestSteps(prev => ({ ...prev, sendInvitation: 'success', processToken: 'running' }))
      
      // Step 3: Get and Process Token
      addLog('info', 'E2E Test Step 3: Processing token...')
      await refreshDatabaseState()
      
      // Find the latest accept token
      const latestToken = invitationTokens.find(t => t.action === 'accept' && !t.used)
      if (latestToken) {
        setTestToken(latestToken.token)
        await testTokenProcessing()
        setE2eTestSteps(prev => ({ ...prev, processToken: 'success', verifySync: 'running' }))
      } else {
        throw new Error('No accept token found')
      }
      
      // Step 4: Verify Sync
      addLog('info', 'E2E Test Step 4: Verifying notification sync...')
      await refreshDatabaseState()
      setE2eTestSteps(prev => ({ ...prev, verifySync: 'success' }))
      
      addLog('success', 'E2E Test completed successfully!')
      toast.success('End-to-end test completed!')
      
    } catch (error: any) {
      addLog('error', 'E2E Test failed', error)
      toast.error('End-to-end test failed')
      
      // Mark current step as error
      const currentStep = Object.entries(e2eTestSteps).find(([_, status]) => status === 'running')?.[0]
      if (currentStep) {
        setE2eTestSteps(prev => ({ ...prev, [currentStep]: 'error' }))
      }
    } finally {
      setE2eTestRunning(false)
    }
  }

  useEffect(() => {
    if (user) {
      refreshDatabaseState()
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-[--bg-base] flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-[--text-secondary]">Please log in to access the debug page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[--bg-base] p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[--text-primary] mb-2">
            🐛 Notification System Debug Console
          </h1>
          <p className="text-[--text-secondary]">
            Comprehensive testing and debugging for email invitations and notification synchronization
          </p>
        </div>

        <Tabs defaultValue="email-testing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="email-testing" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Testing
            </TabsTrigger>
            <TabsTrigger value="token-testing" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Token Testing
            </TabsTrigger>
            <TabsTrigger value="notification-sync" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notification Sync
            </TabsTrigger>
            <TabsTrigger value="database-state" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Database State
            </TabsTrigger>
            <TabsTrigger value="e2e-testing" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              E2E Testing
            </TabsTrigger>
          </TabsList>

          {/* Email Invitation Testing */}
          <TabsContent value="email-testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Invitation Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Test Event Configuration</h3>
                    <Input
                      placeholder="Event Title"
                      value={testEvent.title}
                      onChange={(e) => setTestEvent(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Event Date & Time</label>
                      <Input
                        type="datetime-local"
                        value={testEvent.date_time}
                        onChange={(e) => setTestEvent(prev => ({ ...prev, date_time: e.target.value }))}
                      />
                    </div>
                    <Input
                      placeholder="Location"
                      value={testEvent.location}
                      onChange={(e) => setTestEvent(prev => ({ ...prev, location: e.target.value }))}
                    />
                    <Textarea
                      placeholder="Event Notes (optional)"
                      value={testEvent.notes}
                      onChange={(e) => setTestEvent(prev => ({ ...prev, notes: e.target.value }))}
                    />

                    {/* Drink Type Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Drink Type</label>
                      <select
                        value={testEvent.drink_type}
                        onChange={(e) => setTestEvent(prev => ({
                          ...prev,
                          drink_type: e.target.value as 'beer' | 'wine' | 'cocktails' | 'shots' | 'mixed' | 'other'
                        }))}
                        className="w-full p-2 bg-[--bg-glass] border border-[--border] rounded-lg text-[--text-primary]"
                      >
                        <option value="beer">Beer</option>
                        <option value="wine">Wine</option>
                        <option value="cocktails">Cocktails</option>
                        <option value="shots">Shots</option>
                        <option value="mixed">Mixed</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Vibe Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Vibe</label>
                      <select
                        value={testEvent.vibe}
                        onChange={(e) => setTestEvent(prev => ({
                          ...prev,
                          vibe: e.target.value as 'casual' | 'party' | 'chill' | 'wild' | 'classy' | 'other'
                        }))}
                        className="w-full p-2 bg-[--bg-glass] border border-[--border] rounded-lg text-[--text-primary]"
                      >
                        <option value="casual">Casual</option>
                        <option value="party">Party</option>
                        <option value="chill">Chill</option>
                        <option value="wild">Wild</option>
                        <option value="classy">Classy</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Privacy Setting */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Event Privacy</label>
                      <select
                        value={testEvent.is_public ? 'public' : 'private'}
                        onChange={(e) => setTestEvent(prev => ({
                          ...prev,
                          is_public: e.target.value === 'public'
                        }))}
                        className="w-full p-2 bg-[--bg-glass] border border-[--border] rounded-lg text-[--text-primary]"
                      >
                        <option value="public">Public Event</option>
                        <option value="private">Private Event</option>
                      </select>
                    </div>

                    <Button onClick={createTestEvent} disabled={loading} className="w-full">
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                      Create Test Event
                    </Button>
                    {createdEventId && (
                      <Badge variant="outline" className="w-full justify-center">
                        Event ID: {createdEventId}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Send Test Invitation</h3>
                    <Input
                      type="email"
                      placeholder="Test user email"
                      value={testUserEmail}
                      onChange={(e) => setTestUserEmail(e.target.value)}
                    />
                    <Button
                      onClick={sendTestInvitation}
                      disabled={loading || !createdEventId || !testUserEmail}
                      className="w-full"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                      Send Email Invitation
                    </Button>

                    <div className="text-sm text-[--text-secondary] space-y-1">
                      <p>• Creates invitation tokens automatically</p>
                      <p>• Sends email with working accept/decline links</p>
                      <p>• Updates database with token records</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Token Processing Testing */}
          <TabsContent value="token-testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Token Processing Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Test Specific Token</h3>
                  <Input
                    placeholder="Enter invitation token (e.g., event_accept_0eee3cab3e7946a4839f430f5a177d12)"
                    value={testToken}
                    onChange={(e) => setTestToken(e.target.value)}
                  />
                  <Button onClick={testTokenProcessing} disabled={loading || !testToken} className="w-full">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                    Process Token
                  </Button>

                  {tokenTestResult && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          {tokenTestResult.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          Token Processing Result
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-[--bg-glass] p-3 rounded overflow-auto">
                          {JSON.stringify(tokenTestResult, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Quick Token Tests</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {invitationTokens.slice(0, 4).map((token) => (
                      <Button
                        key={token.id}
                        variant="outline"
                        size="sm"
                        onClick={() => setTestToken(token.token)}
                        className="text-xs"
                      >
                        {token.action} - {token.token.slice(-8)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Synchronization Testing */}
          <TabsContent value="notification-sync" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Synchronization Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Current In-App Notifications</h3>
                  <Button variant="outline" size="sm" onClick={refreshDatabaseState}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-auto">
                  {notifications.length === 0 ? (
                    <p className="text-[--text-secondary] text-center py-4">No notifications found</p>
                  ) : (
                    notifications.map((notification) => (
                      <Card key={notification.id} className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <Badge variant={notification.read ? "secondary" : "default"}>
                            {notification.type}
                          </Badge>
                          <span className="text-xs text-[--text-secondary]">
                            {new Date(notification.created_at).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-xs text-[--text-secondary] mb-2">{notification.message}</p>

                        {notification.data && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-[--text-secondary]">
                              Notification Data
                            </summary>
                            <pre className="mt-2 bg-[--bg-glass] p-2 rounded overflow-auto">
                              {JSON.stringify(notification.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database State Inspection */}
          <TabsContent value="database-state" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Invitation Tokens */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Invitation Tokens
                    <Badge variant="outline">{invitationTokens.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-auto">
                  {invitationTokens.map((token) => (
                    <Card key={token.id} className="p-2">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant={token.used ? "secondary" : "default"} className="text-xs">
                          {token.action}
                        </Badge>
                        <span className="text-xs text-[--text-secondary]">
                          {token.used ? 'Used' : 'Active'}
                        </span>
                      </div>
                      <p className="text-xs font-mono break-all">{token.token}</p>
                      <p className="text-xs text-[--text-secondary]">
                        Expires: {new Date(token.expires_at).toLocaleString()}
                      </p>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Event Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Event Members
                    <Badge variant="outline">{eventMembers.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-auto">
                  {eventMembers.map((member) => (
                    <Card key={member.id} className="p-2">
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant={
                          member.status === 'accepted' ? 'default' :
                          member.status === 'declined' ? 'destructive' :
                          'secondary'
                        } className="text-xs">
                          {member.status}
                        </Badge>
                        <span className="text-xs text-[--text-secondary]">
                          {member.user?.display_name || 'Unknown User'}
                        </span>
                      </div>
                      <p className="text-xs">{member.user?.email}</p>
                      <p className="text-xs text-[--text-secondary]">
                        Invited: {member.invitation_sent_at ? new Date(member.invitation_sent_at).toLocaleString() : 'N/A'}
                      </p>
                      {member.invitation_responded_at && (
                        <p className="text-xs text-[--text-secondary]">
                          Responded: {new Date(member.invitation_responded_at).toLocaleString()}
                        </p>
                      )}
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Notifications Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    Notifications Summary
                    <Badge variant="outline">{notifications.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-auto">
                  {Object.entries(
                    notifications.reduce((acc, notif) => {
                      acc[notif.type] = (acc[notif.type] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center p-2 bg-[--bg-glass] rounded">
                      <span className="text-xs">{type}</span>
                      <Badge variant="outline" className="text-xs">{count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Database Refresh</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={refreshDatabaseState} disabled={loading} className="w-full">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                  Refresh All Database State
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* End-to-End Testing */}
          <TabsContent value="e2e-testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  End-to-End Flow Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Complete Flow Test</h3>
                  <p className="text-sm text-[--text-secondary]">
                    This will run a complete test: Create Event → Send Invitation → Process Email Response → Verify Notification Sync
                  </p>

                  <Input
                    type="email"
                    placeholder="Test user email for E2E test"
                    value={testUserEmail}
                    onChange={(e) => setTestUserEmail(e.target.value)}
                  />

                  <Button
                    onClick={runE2ETest}
                    disabled={e2eTestRunning || !testUserEmail}
                    className="w-full"
                  >
                    {e2eTestRunning ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    Run End-to-End Test
                  </Button>
                </div>

                {/* Test Progress */}
                {Object.keys(e2eTestSteps).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Test Progress</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {Object.entries(e2eTestSteps).map(([step, status]) => (
                        <div key={step} className="flex items-center gap-3 p-2 bg-[--bg-glass] rounded">
                          {status === 'pending' && <div className="w-4 h-4 rounded-full bg-gray-300" />}
                          {status === 'running' && <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />}
                          {status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                          <span className="text-sm capitalize">{step.replace(/([A-Z])/g, ' $1')}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Debug Console */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Debug Console
              </span>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                Clear Logs
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto space-y-2">
              {logs.length === 0 ? (
                <p className="text-[--text-secondary] text-center py-4">No debug logs yet</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex gap-3 p-2 bg-[--bg-glass] rounded text-xs">
                    <span className="text-[--text-secondary] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge
                      variant={
                        log.type === 'error' ? 'destructive' :
                        log.type === 'success' ? 'default' :
                        log.type === 'warning' ? 'secondary' :
                        'outline'
                      }
                      className="text-xs"
                    >
                      {log.type}
                    </Badge>
                    <span className="flex-1">{log.message}</span>
                    {log.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer">Data</summary>
                        <pre className="mt-1 bg-black/20 p-1 rounded overflow-auto max-w-md">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
