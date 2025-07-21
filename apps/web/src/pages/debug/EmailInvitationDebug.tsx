import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ArrowLeft, Bug, Mail, Database, CheckCircle, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface TokenInfo {
  token: string
  invitation_type: string
  action: string
  user_id: string
  expires_at: string
  used: boolean
  created_at: string
  status: 'VALID' | 'EXPIRED' | 'USED'
}

interface TestResult {
  success: boolean
  message: string
  error?: string
  error_code?: string
  debug_info?: any
}

export function EmailInvitationDebug() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [testToken, setTestToken] = useState('')
  const [tokens, setTokens] = useState<TokenInfo[]>([])
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)])
  }

  // Load recent tokens
  useEffect(() => {
    loadRecentTokens()
  }, [])

  const loadRecentTokens = async () => {
    try {
      addLog('Loading recent invitation tokens...')
      
      const { data, error } = await supabase
        .from('invitation_tokens')
        .select('*')
        .eq('invitation_type', 'event')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      const tokensWithStatus = data.map(token => ({
        ...token,
        status: token.expires_at < new Date().toISOString() ? 'EXPIRED' :
                token.used ? 'USED' : 'VALID'
      })) as TokenInfo[]

      setTokens(tokensWithStatus)
      addLog(`Loaded ${tokensWithStatus.length} tokens`)
      
      // Auto-select first valid token
      const validToken = tokensWithStatus.find(t => t.status === 'VALID')
      if (validToken && !testToken) {
        setTestToken(validToken.token)
        addLog(`Auto-selected valid token: ${validToken.token.substring(0, 20)}...`)
      }

    } catch (error: any) {
      addLog(`Error loading tokens: ${error.message}`)
      toast.error('Failed to load tokens')
    }
  }

  const testTokenProcessing = async () => {
    if (!testToken) {
      toast.error('Please enter a token to test')
      return
    }

    setLoading(true)
    setTestResult(null)
    addLog(`Testing token: ${testToken.substring(0, 20)}...`)

    try {
      const { data, error } = await supabase
        .rpc('process_event_invitation_token', {
          p_token: testToken,
          p_user_id: user?.id
        })

      if (error) {
        addLog(`RPC Error: ${error.message}`)
        setTestResult({
          success: false,
          message: error.message,
          error: error.details || error.hint
        })
      } else {
        addLog(`RPC Success: ${JSON.stringify(data)}`)
        setTestResult(data)
      }

    } catch (error: any) {
      addLog(`Exception: ${error.message}`)
      setTestResult({
        success: false,
        message: 'Exception occurred',
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  const createTestInvitation = async () => {
    if (!user) return

    setLoading(true)
    addLog('Creating test invitation...')

    try {
      // First create a test event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          title: 'Debug Test Event',
          date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          location: 'Debug Location',
          created_by: user.id,
          visibility: 'private'
        })
        .select()
        .single()

      if (eventError) throw eventError

      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('event_members')
        .insert({
          event_id: event.id,
          user_id: user.id,
          invited_by: user.id,
          status: 'pending'
        })
        .select()
        .single()

      if (inviteError) throw inviteError

      // Create token
      const token = `event_accept_${Date.now()}_${Math.random().toString(36).substring(2)}`
      const { error: tokenError } = await supabase
        .from('invitation_tokens')
        .insert({
          token,
          invitation_type: 'event',
          invitation_id: invitation.id,
          action: 'accept',
          user_id: user.id,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        })

      if (tokenError) throw tokenError

      setTestToken(token)
      addLog(`Created test invitation with token: ${token.substring(0, 20)}...`)
      toast.success('Test invitation created!')
      
      // Reload tokens
      await loadRecentTokens()

    } catch (error: any) {
      addLog(`Error creating test invitation: ${error.message}`)
      toast.error('Failed to create test invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08090A] text-white p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/debug')}
            className="text-white/70 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Debug
          </Button>
          <div className="flex items-center gap-2">
            <Bug className="w-6 h-6 text-[#00FFA3]" />
            <h1 className="text-2xl font-bold">Email Invitation Debug</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Panel */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Token Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="token">Test Token</Label>
                <Input
                  id="token"
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  placeholder="Enter invitation token..."
                  className="bg-white/5 border-white/20"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testTokenProcessing}
                  disabled={loading || !testToken}
                  className="flex-1"
                >
                  {loading ? 'Testing...' : 'Test Token'}
                </Button>
                <Button
                  onClick={createTestInvitation}
                  disabled={loading}
                  variant="outline"
                >
                  Create Test
                </Button>
              </div>

              {/* Test Result */}
              {testResult && (
                <Card className={`${testResult.success ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      {testResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className="font-medium">
                        {testResult.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{testResult.message}</p>
                    {testResult.error && (
                      <p className="text-xs text-red-300">Error: {testResult.error}</p>
                    )}
                    {testResult.error_code && (
                      <p className="text-xs text-red-300">Code: {testResult.error_code}</p>
                    )}
                    {testResult.debug_info && (
                      <pre className="text-xs mt-2 p-2 bg-black/20 rounded overflow-auto">
                        {JSON.stringify(testResult.debug_info, null, 2)}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Recent Tokens */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Recent Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-auto">
                {tokens.map((token) => (
                  <div
                    key={token.token}
                    className="p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => setTestToken(token.token)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={
                        token.status === 'VALID' ? 'default' :
                        token.status === 'EXPIRED' ? 'destructive' : 'secondary'
                      }>
                        {token.status}
                      </Badge>
                      <span className="text-xs text-white/60">
                        {token.action.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-mono">
                      {token.token.substring(0, 30)}...
                    </p>
                    <p className="text-xs text-white/60">
                      Created: {new Date(token.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
                {tokens.length === 0 && (
                  <p className="text-white/60 text-center py-4">
                    No tokens found
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Debug Logs */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black/20 rounded-lg p-4 max-h-64 overflow-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono text-white/80 mb-1">
                  {log}
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-white/60 text-sm">No logs yet...</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
