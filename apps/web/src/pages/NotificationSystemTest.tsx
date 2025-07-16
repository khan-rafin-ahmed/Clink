import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Bell, Database, Mail, TestTube, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import NotificationService, { notificationTriggers } from '@/lib/notificationService'
import { sendEventInvitationEmail } from '@/lib/emailService'
import { NotificationBell } from '@/components/NotificationBell'

interface TestResult {
  test: string
  status: 'success' | 'error' | 'pending'
  message: string
  details?: any
}

export default function NotificationSystemTest() {
  const { user } = useAuth()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testEventTitle, setTestEventTitle] = useState('Test Event Invitation')
  const [testMessage, setTestMessage] = useState('This is a test notification')

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result])
  }

  const clearResults = () => {
    setTestResults([])
  }

  // Test 1: Database Connection and Notification Creation
  const testDatabaseNotification = async () => {
    console.log('🧪 [NotificationTest] Starting database notification test')
    
    if (!user?.id) {
      addTestResult({
        test: 'Database Notification',
        status: 'error',
        message: 'User not authenticated'
      })
      return
    }

    try {
      const notificationService = NotificationService.getInstance()
      
      await notificationService.createNotification({
        user_id: user.id,
        type: 'event_invitation',
        title: 'Test Database Notification',
        message: testMessage,
        data: {
          test: true,
          timestamp: new Date().toISOString()
        },
        read: false
      })

      addTestResult({
        test: 'Database Notification',
        status: 'success',
        message: 'Notification created successfully in database'
      })
    } catch (error: any) {
      console.error('❌ [NotificationTest] Database test failed:', error)
      addTestResult({
        test: 'Database Notification',
        status: 'error',
        message: `Failed: ${error.message}`,
        details: error
      })
    }
  }

  // Test 2: Notification Retrieval
  const testNotificationRetrieval = async () => {
    console.log('🧪 [NotificationTest] Starting notification retrieval test')
    
    if (!user?.id) {
      addTestResult({
        test: 'Notification Retrieval',
        status: 'error',
        message: 'User not authenticated'
      })
      return
    }

    try {
      const notificationService = NotificationService.getInstance()
      const notifications = await notificationService.getUserNotifications(user.id)
      const unreadCount = await notificationService.getUnreadCount(user.id)

      addTestResult({
        test: 'Notification Retrieval',
        status: 'success',
        message: `Retrieved ${notifications.length} notifications, ${unreadCount} unread`,
        details: { notifications, unreadCount }
      })
    } catch (error: any) {
      console.error('❌ [NotificationTest] Retrieval test failed:', error)
      addTestResult({
        test: 'Notification Retrieval',
        status: 'error',
        message: `Failed: ${error.message}`,
        details: error
      })
    }
  }

  // Test 3: Email Service Test
  const testEmailService = async () => {
    console.log('🧪 [NotificationTest] Starting email service test')
    
    if (!testEmail) {
      addTestResult({
        test: 'Email Service',
        status: 'error',
        message: 'Please enter a test email address'
      })
      return
    }

    try {
      const result = await sendEventInvitationEmail(testEmail, {
        inviterName: 'Test User',
        eventTitle: testEventTitle,
        eventDate: new Date().toLocaleDateString(),
        eventTime: '7:00 PM',
        eventLocation: 'Test Location',
        acceptUrl: 'https://thirstee.app/test/accept',
        declineUrl: 'https://thirstee.app/test/decline',
        eventUrl: 'https://thirstee.app/test/event'
      })

      addTestResult({
        test: 'Email Service',
        status: result.success ? 'success' : 'error',
        message: result.message,
        details: result
      })
    } catch (error: any) {
      console.error('❌ [NotificationTest] Email test failed:', error)
      addTestResult({
        test: 'Email Service',
        status: 'error',
        message: `Failed: ${error.message}`,
        details: error
      })
    }
  }

  // Test 4: Notification Triggers
  const testNotificationTriggers = async () => {
    console.log('🧪 [NotificationTest] Starting notification triggers test')
    
    if (!user?.id) {
      addTestResult({
        test: 'Notification Triggers',
        status: 'error',
        message: 'User not authenticated'
      })
      return
    }

    try {
      // Test event RSVP trigger
      await notificationTriggers.onEventRSVP(
        'test-event-id',
        testEventTitle,
        user.id,
        'test-rsvp-user-id',
        'Test User'
      )

      addTestResult({
        test: 'Notification Triggers',
        status: 'success',
        message: 'Event RSVP notification trigger executed successfully'
      })
    } catch (error: any) {
      console.error('❌ [NotificationTest] Triggers test failed:', error)
      addTestResult({
        test: 'Notification Triggers',
        status: 'error',
        message: `Failed: ${error.message}`,
        details: error
      })
    }
  }

  // Test 5: Database Schema Validation
  const testDatabaseSchema = async () => {
    console.log('🧪 [NotificationTest] Starting database schema test')

    try {
      // Test notifications table structure
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .limit(1)

      if (notifError) throw notifError

      // Test email_logs table structure
      const { data: emailLogs, error: emailError } = await supabase
        .from('email_logs')
        .select('*')
        .limit(1)

      if (emailError) throw emailError

      addTestResult({
        test: 'Database Schema',
        status: 'success',
        message: 'All required tables accessible',
        details: { notifications: !!notifications, emailLogs: !!emailLogs }
      })
    } catch (error: any) {
      console.error('❌ [NotificationTest] Schema test failed:', error)
      addTestResult({
        test: 'Database Schema',
        status: 'error',
        message: `Failed: ${error.message}`,
        details: error
      })
    }
  }

  // Test 6: Invitation Response Flow
  const testInvitationResponse = async () => {
    console.log('🧪 [NotificationTest] Starting invitation response test')

    if (!user?.id) {
      addTestResult({
        test: 'Invitation Response',
        status: 'error',
        message: 'User not authenticated'
      })
      return
    }

    try {
      // First, create a test event invitation
      const testEventId = 'test-event-' + Date.now()
      const testInvitationId = 'test-invitation-' + Date.now()

      // Create a test notification that simulates an event invitation
      const notificationService = NotificationService.getInstance()
      await notificationService.createNotification({
        user_id: user.id,
        type: 'event_invitation',
        title: 'Test Invitation Response Flow',
        message: 'This tests the invitation response system',
        data: {
          event_id: testEventId,
          invitation_id: testInvitationId,
          event_title: 'Test Response Event',
          inviter_id: user.id,
          test: true
        },
        read: false
      })

      addTestResult({
        test: 'Invitation Response',
        status: 'success',
        message: 'Test invitation notification created - check NotificationBell for response buttons',
        details: { eventId: testEventId, invitationId: testInvitationId }
      })
    } catch (error: any) {
      console.error('❌ [NotificationTest] Invitation response test failed:', error)
      addTestResult({
        test: 'Invitation Response',
        status: 'error',
        message: `Failed: ${error.message}`,
        details: error
      })
    }
  }

  // Test 7: Check for "Someone" Notifications
  const testSomeoneNotifications = async () => {
    console.log('🧪 [NotificationTest] Checking for "Someone" notifications')

    try {
      const { data: someoneNotifications, error } = await supabase
        .from('notifications')
        .select('id, title, message, created_at, data')
        .ilike('title', '%Someone%')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const count = someoneNotifications?.length || 0

      addTestResult({
        test: 'Someone Notifications Check',
        status: count > 0 ? 'error' : 'success',
        message: count > 0
          ? `Found ${count} notifications with "Someone" - this indicates missing user profile data`
          : 'No "Someone" notifications found - user profile integration working correctly',
        details: someoneNotifications
      })
    } catch (error: any) {
      console.error('❌ [NotificationTest] Someone notifications check failed:', error)
      addTestResult({
        test: 'Someone Notifications Check',
        status: 'error',
        message: `Failed: ${error.message}`,
        details: error
      })
    }
  }

  // Test 8: Fix Existing "Someone" Notifications
  const fixSomeoneNotifications = async () => {
    console.log('🧪 [NotificationTest] Attempting to fix "Someone" notifications')

    try {
      // First try the specific fix function
      const { data: specificFix, error: specificError } = await supabase.rpc('fix_specific_someone_notifications')

      if (!specificError && specificFix) {
        const fixedCount = specificFix.filter((item: any) => item.fixed).length
        addTestResult({
          test: 'Fix Someone Notifications',
          status: fixedCount > 0 ? 'success' : 'error',
          message: fixedCount > 0
            ? `Fixed ${fixedCount} notifications with proper user names`
            : 'No notifications could be fixed - missing user profile data',
          details: specificFix
        })
        return
      }

      // Fallback to original fix function
      const { data, error } = await supabase.rpc('fix_existing_someone_notifications')

      if (error) {
        // If function doesn't exist, show instructions
        addTestResult({
          test: 'Fix Someone Notifications',
          status: 'error',
          message: 'Fix function not available. Please run the SQL migration manually.',
          details: {
            error: error.message,
            sqlFile: 'supabase/migrations/20250110_fix_specific_someone_notifications.sql',
            instructions: 'Run this SQL file in your Supabase SQL Editor to fix the specific "Someone" notifications'
          }
        })
        return
      }

      addTestResult({
        test: 'Fix Someone Notifications',
        status: 'success',
        message: `Fixed ${data || 0} notifications with proper user names`,
        details: { fixedCount: data }
      })
    } catch (error: any) {
      console.error('❌ [NotificationTest] Fix someone notifications failed:', error)
      addTestResult({
        test: 'Fix Someone Notifications',
        status: 'error',
        message: `Failed: ${error.message}`,
        details: error
      })
    }
  }

  // Test 9: Diagnose "Someone" Notifications
  const diagnoseSomeoneNotifications = async () => {
    console.log('🧪 [NotificationTest] Diagnosing "Someone" notifications')

    try {
      const { data, error } = await supabase.rpc('diagnose_someone_notifications')

      if (error) {
        addTestResult({
          test: 'Diagnose Someone Notifications',
          status: 'error',
          message: `Diagnostic function not available: ${error.message}`,
          details: error
        })
        return
      }

      addTestResult({
        test: 'Diagnose Someone Notifications',
        status: 'success',
        message: `Analyzed ${data?.length || 0} "Someone" notifications`,
        details: data
      })
    } catch (error: any) {
      console.error('❌ [NotificationTest] Diagnose someone notifications failed:', error)
      addTestResult({
        test: 'Diagnose Someone Notifications',
        status: 'error',
        message: `Failed: ${error.message}`,
        details: error
      })
    }
  }

  // Run all tests
  const runAllTests = async () => {
    setIsRunning(true)
    clearResults()

    console.log('🧪 [NotificationTest] Starting comprehensive notification system test')

    await testDatabaseSchema()
    await testDatabaseNotification()
    await testNotificationRetrieval()
    await testNotificationTriggers()
    await testInvitationResponse()
    await testSomeoneNotifications()
    await diagnoseSomeoneNotifications()

    if (testEmail) {
      await testEmailService()
    }

    setIsRunning(false)
    console.log('🧪 [NotificationTest] All tests completed')
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Notification System Diagnostic
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Comprehensive testing of the Thirstee notification system including database operations, 
              email sending, and real-time updates.
            </p>
            
            {/* Live Notification Bell */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">Live Notification Bell:</span>
              <NotificationBell />
              <span className="text-xs text-muted-foreground">
                This is the actual notification bell component from the app
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="testEmail">Test Email Address</Label>
                <Input
                  id="testEmail"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="testEventTitle">Test Event Title</Label>
                <Input
                  id="testEventTitle"
                  value={testEventTitle}
                  onChange={(e) => setTestEventTitle(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="testMessage">Test Message</Label>
              <Textarea
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              <Button 
                onClick={testDatabaseNotification} 
                variant="outline"
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                Test Database
              </Button>
              <Button
                onClick={testEmailService}
                variant="outline"
                disabled={isRunning || !testEmail}
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Test Email
              </Button>
              <Button
                onClick={testInvitationResponse}
                variant="outline"
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Test Invitations
              </Button>
              <Button
                onClick={fixSomeoneNotifications}
                variant="outline"
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Fix "Someone" Notifications
              </Button>
              <Button
                onClick={diagnoseSomeoneNotifications}
                variant="outline"
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <TestTube className="w-4 h-4" />
                Diagnose "Someone" Issues
              </Button>
              <Button 
                onClick={clearResults} 
                variant="outline"
                className="flex items-center gap-2"
              >
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium">{result.test}</div>
                      <div className="text-sm text-muted-foreground">{result.message}</div>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-blue-500">
                            Show Details
                          </summary>
                          <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
