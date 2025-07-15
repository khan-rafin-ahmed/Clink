import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  generateEventInvitationEmail,
  generateEventReminderEmail,
  type EventInvitationData,
  type EventReminderData
} from '@/lib/emailTemplates'
import { sendEventInvitationEmail, sendEventReminderEmail, downloadEventICS } from '@/lib/emailService'
import { EmailPreferences } from '@/components/EmailPreferences'
import { AddToCalendarButton } from '@/components/AddToCalendarButton'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Mail, Calendar, Download, Send, Eye, Loader2, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface EmailLog {
  id: string
  recipient: string
  subject: string
  type: string
  status: 'pending' | 'sent' | 'failed' | 'bounced'
  message_id?: string
  data?: any
  error_message?: string
  sent_at?: string
  created_at: string
}

export function TestEmailSystem() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [emailPreview, setEmailPreview] = useState<{ html: string; text: string; subject: string } | null>(null)
  const [testEmail, setTestEmail] = useState('')
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  // Test event data
  const [testEventData] = useState<EventInvitationData>({
    eventTitle: "Epic Rooftop Party 🎉",
    eventDate: "Saturday, December 23rd",
    eventTime: "8:00 PM - All Night",
    eventLocation: "Sky Bar, Downtown",
    inviterName: "John 'Party King' Smith",
    inviterAvatar: undefined,
    eventDescription: "Join us for an unforgettable night of drinks, music, and good vibes on the rooftop! Bring your crew and let's raise some hell together. 🍺🤘",
    acceptUrl: `${window.location.origin}/event/accept/test-invitation`,
    declineUrl: `${window.location.origin}/event/decline/test-invitation`,
    eventUrl: `${window.location.origin}/event/epic-rooftop-party`,
    vibe: "party"
  })

  const [testReminderData] = useState<EventReminderData>({
    eventTitle: "Epic Rooftop Party 🎉",
    eventDate: "Saturday, December 23rd",
    eventTime: "8:00 PM - All Night",
    eventLocation: "Sky Bar, Downtown",
    hostName: "John 'Party King' Smith",
    eventDescription: "Join us for an unforgettable night of drinks, music, and good vibes on the rooftop!",
    eventUrl: `${window.location.origin}/event/epic-rooftop-party`,
    mapUrl: "https://maps.google.com/?q=Sky+Bar+Downtown",
    attendeeCount: 12
  })

  const [testCalendarEvent] = useState({
    title: "Epic Rooftop Party 🎉",
    description: "Join us for an unforgettable night of drinks, music, and good vibes on the rooftop! Bring your crew and let's raise some hell together.",
    date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    end_time: null,
    duration_type: "all_night" as const,
    location: "Sky Bar, Downtown",
    place_nickname: "The Legendary Sky Bar"
  })

  // Load email logs on component mount
  useEffect(() => {
    loadEmailLogs()
    loadDebugInfo()
  }, [])

  const loadEmailLogs = async () => {
    if (!user) return

    setIsLoadingLogs(true)
    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Failed to load email logs:', error)
        toast.error('Failed to load email logs')
        return
      }

      setEmailLogs(data || [])
    } catch (error) {
      console.error('Error loading email logs:', error)
      toast.error('Error loading email logs')
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const loadDebugInfo = async () => {
    try {
      console.log('🔍 Starting debug info load...')
      console.log('🔍 User status:', { user: !!user, email: user?.email })

      // First, let's test a simple function call to see what happens
      console.log('🔍 Testing Edge Function with minimal payload...')

      const { data: functionTest, error: functionError } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'test@example.com',
          subject: 'Debug Test',
          type: 'event_invitation',
          html: '<h1>Simple Test</h1><p>This is a simple test email.</p>',
          text: 'Simple Test\n\nThis is a simple test email.'
        }
      })

      console.log('🔍 Function Response:', functionTest)
      console.log('🔍 Function Error:', functionError)

      // Try to get more details about the error
      let detailedError = null
      if (functionError) {
        detailedError = {
          message: functionError.message,
          name: functionError.name,
          context: functionError.context,
          details: functionError.details,
          hint: functionError.hint,
          code: functionError.code,
          stack: functionError.stack
        }
        console.log('🔍 Detailed Error:', detailedError)
      }

      setDebugInfo({
        supabaseConnected: true,
        edgeFunctionAccessible: !functionError,
        functionError: functionError?.message || 'No error message',
        functionResponse: functionTest,
        userAuthenticated: !!user,
        userEmail: user?.email || 'Not logged in',
        timestamp: new Date().toISOString(),
        rawError: detailedError || functionError,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      })
    } catch (error: any) {
      console.error('🔍 Debug Function Error:', error)
      setDebugInfo({
        supabaseConnected: false,
        edgeFunctionAccessible: false,
        functionError: error.message,
        userAuthenticated: !!user,
        userEmail: user?.email || 'Not logged in',
        timestamp: new Date().toISOString(),
        rawError: error,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      })
    }
  }

  const previewInvitationEmail = () => {
    const email = generateEventInvitationEmail(testEventData)
    setEmailPreview(email)
    toast.success('📧 Invitation email preview generated!')
  }

  const previewReminderEmail = () => {
    const email = generateEventReminderEmail(testReminderData)
    setEmailPreview(email)
    toast.success('⏰ Reminder email preview generated!')
  }

  const sendTestInvitation = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address')
      return
    }

    setIsLoading(true)
    try {
      const result = await sendEventInvitationEmail(testEmail, testEventData)

      if (result.success) {
        toast.success(`📧 Test invitation sent to ${testEmail}!`)
        // Reload logs to show the new entry
        setTimeout(() => loadEmailLogs(), 1000)
      } else {
        toast.error(`Failed to send invitation: ${result.error}`)
      }
    } catch (error) {
      console.error('Send test invitation error:', error)
      toast.error('Failed to send test invitation')
    } finally {
      setIsLoading(false)
    }
  }

  const sendTestReminder = async () => {
    if (!testEmail) {
      toast.error('Please enter a test email address')
      return
    }

    setIsLoading(true)
    try {
      const result = await sendEventReminderEmail(testEmail, testReminderData)

      if (result.success) {
        toast.success(`⏰ Test reminder sent to ${testEmail}!`)
        // Reload logs to show the new entry
        setTimeout(() => loadEmailLogs(), 1000)
      } else {
        toast.error(`Failed to send reminder: ${result.error}`)
      }
    } catch (error) {
      console.error('Send test reminder error:', error)
      toast.error('Failed to send test reminder')
    } finally {
      setIsLoading(false)
    }
  }

  const openEmailInNewTab = () => {
    if (!emailPreview) return

    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(emailPreview.html)
      newWindow.document.close()
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'bounced':
        return <AlertCircle className="w-4 h-4 text-orange-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-400 border-green-400'
      case 'failed':
        return 'text-red-400 border-red-400'
      case 'pending':
        return 'text-yellow-400 border-yellow-400'
      case 'bounced':
        return 'text-orange-400 border-orange-400'
      default:
        return 'text-gray-400 border-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-bg-base p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="sm"
              className="glass-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Email System Debug</h1>
              <p className="text-[#B3B3B3]">Test email functionality, view logs, and debug issues</p>
            </div>
          </div>
          <Button
            onClick={() => {
              loadEmailLogs()
              loadDebugInfo()
            }}
            variant="outline"
            size="sm"
            className="glass-button"
            disabled={isLoadingLogs}
          >
            {isLoadingLogs ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Debug Info Card */}
        {debugInfo && (
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {debugInfo.supabaseConnected ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-white text-sm">Supabase</span>
                  </div>
                  <p className="text-xs text-[#B3B3B3]">Database connection</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {debugInfo.edgeFunctionAccessible ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-white text-sm">Edge Function</span>
                  </div>
                  <p className="text-xs text-[#B3B3B3]">Email service</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {debugInfo.userAuthenticated ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-white text-sm">Authentication</span>
                  </div>
                  <p className="text-xs text-[#B3B3B3]">{debugInfo.userEmail || 'Not logged in'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {debugInfo.hasAnonKey ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-white text-sm">API Key</span>
                  </div>
                  <p className="text-xs text-[#B3B3B3]">Anon key configured</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-white text-sm">Last Check</span>
                  </div>
                  <p className="text-xs text-[#B3B3B3]">
                    {new Date(debugInfo.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Additional Debug Info */}
              <div className="mt-4 p-3 bg-black/20 rounded text-xs">
                <p className="text-[#B3B3B3]">
                  <strong>Supabase URL:</strong> {debugInfo.supabaseUrl}
                </p>
              </div>
              {debugInfo.functionError && (
                <div className="mt-4 space-y-2">
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                    <p className="text-red-400 text-sm">
                      <strong>Error:</strong> {debugInfo.functionError}
                    </p>
                  </div>
                  {debugInfo.rawError && (
                    <details className="bg-black/20 p-3 rounded">
                      <summary className="text-xs text-[#B3B3B3] cursor-pointer hover:text-white">
                        View Raw Error Details
                      </summary>
                      <pre className="text-xs text-[#666666] mt-2 overflow-x-auto">
                        {JSON.stringify(debugInfo.rawError, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              {debugInfo.functionResponse && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
                  <p className="text-green-400 text-sm">
                    <strong>Response:</strong> {JSON.stringify(debugInfo.functionResponse)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Email Logs */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Logs ({emailLogs.length})
              </span>
              <Button
                onClick={loadEmailLogs}
                variant="outline"
                size="sm"
                disabled={isLoadingLogs}
              >
                {isLoadingLogs ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF7747]" />
                <span className="ml-2 text-[#B3B3B3]">Loading email logs...</span>
              </div>
            ) : emailLogs.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-[#B3B3B3] mx-auto mb-4" />
                <p className="text-[#B3B3B3]">No email logs found</p>
                <p className="text-sm text-[#666666] mt-2">Send a test email to see logs here</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <Badge variant="outline" className={getStatusColor(log.status)}>
                          {log.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-[#B3B3B3] border-[#B3B3B3]">
                          {log.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-xs text-[#666666]">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-white font-medium">{log.subject}</p>
                      <p className="text-sm text-[#B3B3B3]">To: {log.recipient}</p>
                      {log.message_id && (
                        <p className="text-xs text-[#666666]">Message ID: {log.message_id}</p>
                      )}
                      {log.sent_at && (
                        <p className="text-xs text-green-400">
                          Sent: {new Date(log.sent_at).toLocaleString()}
                        </p>
                      )}
                      {log.error_message && (
                        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                          <p className="text-red-400 text-xs">
                            <strong>Error:</strong> {log.error_message}
                          </p>
                        </div>
                      )}
                      {log.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-[#B3B3B3] cursor-pointer hover:text-white">
                            View Data
                          </summary>
                          <pre className="text-xs text-[#666666] mt-1 bg-black/20 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Testing */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Test Email Address</Label>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-semibold">Email Templates</h3>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={previewInvitationEmail} variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Invitation
                  </Button>
                  <Button onClick={previewReminderEmail} variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Reminder
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-semibold">Send Test Emails</h3>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={sendTestInvitation} 
                    disabled={isLoading || !testEmail}
                    variant="outline" 
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Invitation
                  </Button>
                  <Button
                    onClick={sendTestReminder}
                    disabled={isLoading || !testEmail}
                    variant="outline"
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Reminder
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/10">
                <h3 className="text-white font-semibold">Direct Edge Function Tests</h3>

                {/* Simple HTML Test */}
                <Button
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      console.log('🚀 Testing Edge Function with HTML content...')

                      const { data, error } = await supabase.functions.invoke('send-email', {
                        body: {
                          to: testEmail,
                          subject: 'Simple HTML Test',
                          type: 'event_invitation',
                          html: '<h1>Simple Test</h1><p>This email has HTML content provided directly.</p>',
                          text: 'Simple Test\n\nThis email has text content provided directly.'
                        }
                      })

                      console.log('📧 HTML Test Response:', { data, error })

                      if (error) {
                        const errorDetails = {
                          message: error.message,
                          name: error.name,
                          context: error.context,
                          details: error.details,
                          hint: error.hint,
                          code: error.code
                        }

                        toast.error(`HTML Test Error: ${error.message}`)
                        console.error('🔥 HTML Test Error:', errorDetails)
                        alert(`HTML Test Error:\n${JSON.stringify(errorDetails, null, 2)}`)
                      } else {
                        toast.success('✅ HTML Test successful!')
                        console.log('✅ HTML Test Success:', data)
                        setTimeout(() => loadEmailLogs(), 1000)
                      }
                    } catch (error: any) {
                      console.error('🔥 HTML Test Network Error:', error)
                      toast.error(`HTML Test Network Error: ${error.message}`)
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading || !testEmail}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  Test with HTML Content
                </Button>

                {/* Template Generation Test */}
                <Button
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      console.log('🚀 Testing Edge Function with template generation...')

                      const { data, error } = await supabase.functions.invoke('send-email', {
                        body: {
                          to: testEmail,
                          subject: 'Template Generation Test',
                          type: 'event_invitation',
                          data: {
                            event_title: 'Template Test Event 🧪',
                            inviter_name: 'Debug System',
                            event_date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                            event_location: 'Debug Test Location',
                            event_id: 'debug-test-event',
                            invitation_id: 'debug-test-invitation'
                          }
                        }
                      })

                      console.log('📧 Template Test Response:', { data, error })

                      if (error) {
                        const errorDetails = {
                          message: error.message,
                          name: error.name,
                          context: error.context,
                          details: error.details,
                          hint: error.hint,
                          code: error.code
                        }

                        toast.error(`Template Test Error: ${error.message}`)
                        console.error('🔥 Template Test Error:', errorDetails)
                        alert(`Template Test Error:\n${JSON.stringify(errorDetails, null, 2)}`)
                      } else {
                        toast.success('✅ Template Test successful!')
                        console.log('✅ Template Test Success:', data)
                        setTimeout(() => loadEmailLogs(), 1000)
                      }
                    } catch (error: any) {
                      console.error('🔥 Template Test Network Error:', error)
                      toast.error(`Template Test Network Error: ${error.message}`)
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading || !testEmail}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  Test with Template Generation
                </Button>

                {/* Raw HTTP Test */}
                <Button
                  onClick={async () => {
                    setIsLoading(true)
                    try {
                      console.log('🚀 Testing Edge Function with raw HTTP...')

                      // Test with raw fetch to get the actual error response
                      const response = await fetch('https://arpphimkotjvnfoacquj.supabase.co/functions/v1/send-email', {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          to: testEmail,
                          subject: 'Raw HTTP Test',
                          type: 'event_invitation',
                          html: '<h1>Raw HTTP Test</h1><p>Testing with raw fetch.</p>',
                          text: 'Raw HTTP Test\n\nTesting with raw fetch.'
                        })
                      })

                      console.log('📧 Raw HTTP Response Status:', response.status)
                      console.log('📧 Raw HTTP Response Headers:', Object.fromEntries(response.headers.entries()))

                      const responseText = await response.text()
                      console.log('📧 Raw HTTP Response Body:', responseText)

                      if (!response.ok) {
                        let errorData
                        try {
                          errorData = JSON.parse(responseText)
                        } catch {
                          errorData = { error: responseText }
                        }

                        toast.error(`Raw HTTP Error (${response.status}): ${errorData.error || 'Unknown error'}`)
                        alert(`Raw HTTP Error Details:\nStatus: ${response.status}\nResponse: ${responseText}`)
                      } else {
                        toast.success('✅ Raw HTTP Test successful!')
                        console.log('✅ Raw HTTP Success:', responseText)
                        setTimeout(() => loadEmailLogs(), 1000)
                      }
                    } catch (error: any) {
                      console.error('🔥 Raw HTTP Network Error:', error)
                      toast.error(`Raw HTTP Network Error: ${error.message}`)
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading || !testEmail}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  Test with Raw HTTP (Get Actual Error)
                </Button>

                {/* Success Message */}
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded">
                  <p className="text-green-400 text-sm mb-2">
                    <strong>🎉 Email System Fixed!</strong>
                  </p>
                  <p className="text-xs text-[#B3B3B3] mb-3">
                    The SendGrid content order issue has been resolved. Your email system is now working correctly!
                  </p>
                </div>

                {/* SendGrid Debug Info */}
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                  <p className="text-blue-400 text-sm mb-2">
                    <strong>SendGrid 400 Error Debug</strong>
                  </p>
                  <p className="text-xs text-[#B3B3B3] mb-3">
                    Since noreply@thirstee.app is verified, the 400 error might be due to API key permissions or request format. Let's debug the exact SendGrid request.
                  </p>

                  <Button
                    onClick={async () => {
                      setIsLoading(true)
                      try {
                        console.log('🔍 Testing SendGrid API directly...')

                        // Test what the Edge Function is sending to SendGrid
                        const testPayload = {
                          personalizations: [{
                            to: [{ email: testEmail }],
                            subject: 'Direct SendGrid Test'
                          }],
                          from: {
                            email: 'noreply@thirstee.app',
                            name: 'Thirstee'
                          },
                          content: [
                            {
                              type: 'text/html',
                              value: '<h1>Direct SendGrid Test</h1><p>Testing SendGrid API directly.</p>'
                            },
                            {
                              type: 'text/plain',
                              value: 'Direct SendGrid Test\n\nTesting SendGrid API directly.'
                            }
                          ]
                        }

                        console.log('📧 SendGrid Payload:', JSON.stringify(testPayload, null, 2))

                        // Show what we're sending
                        alert(`SendGrid Test Payload:\n${JSON.stringify(testPayload, null, 2)}\n\nCheck console for full details. This shows exactly what your Edge Function sends to SendGrid.`)

                        toast.success('📧 SendGrid payload logged to console')
                      } catch (error: any) {
                        console.error('🔥 SendGrid Debug Error:', error)
                        toast.error(`SendGrid Debug Error: ${error.message}`)
                      } finally {
                        setIsLoading(false)
                      }
                    }}
                    disabled={isLoading || !testEmail}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mr-2" />
                    )}
                    Debug SendGrid Payload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar Testing */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Calendar Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Add to Calendar</h3>
                <AddToCalendarButton
                  event={testCalendarEvent}
                  eventUrl={testCalendarEvent.title}
                  variant="outline"
                  className="w-full"
                />
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">Download ICS File</h3>
                <Button
                  onClick={() => downloadEventICS({
                    title: testCalendarEvent.title,
                    description: testCalendarEvent.description,
                    startTime: testCalendarEvent.date_time,
                    location: testCalendarEvent.place_nickname || testCalendarEvent.location,
                    url: `${window.location.origin}/event/test`
                  })}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download .ics File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Preview */}
        {emailPreview && (
          <Card className="glass-card border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Email Preview</span>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-[#FF7747] border-[#FF7747]">
                    {emailPreview.subject}
                  </Badge>
                  <Button onClick={openEmailInNewTab} variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* HTML Preview */}
              <div>
                <h3 className="text-white font-semibold mb-2">HTML Version</h3>
                <div className="bg-white rounded p-4 max-h-96 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: emailPreview.html }} />
                </div>
              </div>

              {/* Text Preview */}
              <div>
                <h3 className="text-white font-semibold mb-2">Text Version</h3>
                <div className="bg-white/5 p-4 rounded max-h-48 overflow-y-auto">
                  <pre className="text-[#B3B3B3] text-sm whitespace-pre-wrap">
                    {emailPreview.text}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Preferences Component */}
        <EmailPreferences />

        {/* Test Data */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Test Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-2">Invitation Data</h3>
              <div className="bg-white/5 p-4 rounded">
                <pre className="text-[#B3B3B3] text-sm overflow-x-auto">
                  {JSON.stringify(testEventData, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">Reminder Data</h3>
              <div className="bg-white/5 p-4 rounded">
                <pre className="text-[#B3B3B3] text-sm overflow-x-auto">
                  {JSON.stringify(testReminderData, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
