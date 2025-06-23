import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export function EmailDebugPage() {
  const { user } = useAuth()
  const [testEmail, setTestEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(message)
  }

  const testDirectEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address')
      return
    }

    setIsLoading(true)
    addLog('🧪 Testing direct email send...')

    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail,
          subject: '🧪 Thirstee Email Test',
          type: 'crew_invitation',
          data: {
            crewName: 'Test Crew',
            inviterName: 'Test User',
            crewDescription: 'This is a test email',
            memberCount: 1,
            acceptUrl: 'https://thirstee.app'
          }
        }
      })

      if (error) {
        addLog(`❌ Email function error: ${error.message}`)
        toast.error('Email test failed')
      } else {
        addLog(`✅ Email function success: ${JSON.stringify(data)}`)
        toast.success('Email test sent!')
      }
    } catch (error: any) {
      addLog(`❌ Email test exception: ${error.message}`)
      toast.error('Email test failed')
    } finally {
      setIsLoading(false)
    }
  }

  const testCrewInvitation = async () => {
    if (!user) {
      toast.error('Please log in first')
      return
    }

    setIsLoading(true)
    addLog('🧪 Testing crew invitation flow...')

    try {
      // Get user's crews
      const { data: crews, error: crewsError } = await supabase
        .from('crews')
        .select('*')
        .eq('created_by', user.id)
        .limit(1)

      if (crewsError || !crews || crews.length === 0) {
        addLog('❌ No crews found. Create a crew first.')
        toast.error('No crews found')
        setIsLoading(false)
        return
      }

      const crew = crews[0]
      addLog(`📋 Found crew: ${crew.name} (${crew.id})`)

      // Test crew invitation
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: testEmail || user.email,
          subject: `🤘 You're invited to join ${crew.name}`,
          type: 'crew_invitation',
          data: {
            crewName: crew.name,
            inviterName: 'Debug Test',
            crewDescription: crew.description || 'Test crew invitation',
            memberCount: 1,
            acceptUrl: `${window.location.origin}/crew/${crew.id}`
          }
        }
      })

      if (error) {
        addLog(`❌ Crew invitation error: ${error.message}`)
        toast.error('Crew invitation test failed')
      } else {
        addLog(`✅ Crew invitation success: ${JSON.stringify(data)}`)
        toast.success('Crew invitation test sent!')
      }
    } catch (error: any) {
      addLog(`❌ Crew invitation exception: ${error.message}`)
      toast.error('Crew invitation test failed')
    } finally {
      setIsLoading(false)
    }
  }

  const testEventInvitation = async () => {
    if (!user) {
      toast.error('Please log in first')
      return
    }

    setIsLoading(true)
    addLog('🧪 Testing event invitation flow...')

    try {
      // Get user's events and crews
      const [eventsResult, crewsResult] = await Promise.all([
        supabase.from('events').select('*').eq('created_by', user.id).limit(1),
        supabase.from('crews').select('*').eq('created_by', user.id).limit(1)
      ])

      if (eventsResult.error || !eventsResult.data || eventsResult.data.length === 0) {
        addLog('❌ No events found. Create an event first.')
        toast.error('No events found')
        setIsLoading(false)
        return
      }

      if (crewsResult.error || !crewsResult.data || crewsResult.data.length === 0) {
        addLog('❌ No crews found. Create a crew first.')
        toast.error('No crews found')
        setIsLoading(false)
        return
      }

      const event = eventsResult.data[0]
      const crew = crewsResult.data[0]

      addLog(`📋 Found event: ${event.title} (${event.id})`)
      addLog(`📋 Found crew: ${crew.name} (${crew.id})`)

      // Test RPC function
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('send_event_invitations_to_crew', {
          p_event_id: event.id,
          p_crew_id: crew.id,
          p_inviter_id: user.id
        })

      if (rpcError) {
        addLog(`❌ RPC error: ${rpcError.message}`)
        toast.error('Event invitation RPC failed')
      } else {
        addLog(`✅ RPC success: ${JSON.stringify(rpcData)}`)
        toast.success('Event invitation RPC worked!')
      }
    } catch (error: any) {
      addLog(`❌ Event invitation exception: ${error.message}`)
      toast.error('Event invitation test failed')
    } finally {
      setIsLoading(false)
    }
  }

  const checkEmailLogs = async () => {
    setIsLoading(true)
    addLog('📊 Checking email logs...')

    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        addLog(`❌ Email logs error: ${error.message}`)
      } else {
        addLog(`📊 Found ${data.length} email logs:`)
        data.forEach((log, index) => {
          addLog(`${index + 1}. ${log.status} - ${log.subject} to ${log.recipient} (${log.created_at})`)
        })
      }
    } catch (error: any) {
      addLog(`❌ Email logs exception: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkUserEmails = async () => {
    if (!user) {
      toast.error('Please log in first')
      return
    }

    setIsLoading(true)
    addLog('📧 Checking user emails in database...')

    try {
      // Check emails in user_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, email')
        .limit(10)

      if (profilesError) {
        addLog(`❌ User profiles error: ${profilesError.message}`)
      } else {
        addLog(`📊 Found ${profiles.length} user profiles:`)
        profiles.forEach((profile, index) => {
          addLog(`${index + 1}. ${profile.display_name} - ${profile.email || 'NO EMAIL'} (${profile.user_id})`)
        })
      }

      // Check current user's crew members
      const { data: crews, error: crewsError } = await supabase
        .from('crews')
        .select('id, name')
        .eq('created_by', user.id)

      if (crewsError) {
        addLog(`❌ Crews error: ${crewsError.message}`)
      } else if (crews.length > 0) {
        const crew = crews[0]
        addLog(`🏴‍☠️ Checking crew members for: ${crew.name}`)

        // Get crew members first
        const { data: crewMembers, error: membersError } = await supabase
          .from('crew_members')
          .select('user_id, status')
          .eq('crew_id', crew.id)

        if (membersError) {
          addLog(`❌ Crew members error: ${membersError.message}`)
        } else {
          addLog(`👥 Found ${crewMembers.length} crew members`)

          // Get user profiles for crew members
          if (crewMembers.length > 0) {
            const userIds = crewMembers.map(cm => cm.user_id)
            const { data: memberProfiles, error: profilesError } = await supabase
              .from('user_profiles')
              .select('user_id, display_name, email')
              .in('user_id', userIds)

            if (profilesError) {
              addLog(`❌ Member profiles error: ${profilesError.message}`)
            } else {
              crewMembers.forEach((member, index) => {
                const profile = memberProfiles?.find(p => p.user_id === member.user_id)
                addLog(`${index + 1}. ${profile?.display_name || 'Unknown'} - ${profile?.email || 'NO EMAIL'} (${member.status})`)
              })
            }
          }
        }
      }
    } catch (error: any) {
      addLog(`❌ User emails check exception: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Email System Debug</CardTitle>
          <CardDescription>
            Test the email system to identify issues with crew and event invitations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={testDirectEmail} disabled={isLoading}>
              Test Direct Email
            </Button>
            <Button onClick={testCrewInvitation} disabled={isLoading}>
              Test Crew Invitation
            </Button>
            <Button onClick={testEventInvitation} disabled={isLoading}>
              Test Event Invitation
            </Button>
            <Button onClick={checkEmailLogs} disabled={isLoading}>
              Check Email Logs
            </Button>
            <Button onClick={checkUserEmails} disabled={isLoading}>
              Check User Emails
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={clearLogs}>
              Clear Logs
            </Button>
          </div>

          <div className="bg-black p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="text-green-400 font-mono mb-2">Debug Logs:</h3>
            {logs.length === 0 ? (
              <p className="text-gray-400 font-mono">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <p key={index} className="text-green-400 font-mono text-sm">
                  {log}
                </p>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
