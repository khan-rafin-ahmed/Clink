import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  generateTokenizedUrls,
  validateInvitationToken,
  markTokenAsUsed,
  cleanupExpiredTokens
} from '@/lib/invitationTokenService'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { 
  TestTube, 
  Link, 
  CheckCircle, 
  XCircle, 
  Trash2,
  Loader2
} from 'lucide-react'

export function TestInvitationTokens() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  
  // Test data
  const [invitationType, setInvitationType] = useState<'event' | 'crew'>('event')
  const [invitationId, setInvitationId] = useState('')
  const [testToken, setTestToken] = useState('')

  const handleGenerateTokens = async () => {
    if (!user || !invitationId) {
      toast.error('Please provide invitation ID')
      return
    }

    setLoading(true)
    try {
      console.log('🔍 Generating tokens with:', {
        invitationType,
        invitationId,
        userId: user.id
      })

      const urls = await generateTokenizedUrls(
        invitationType,
        invitationId,
        user.id
      )
      
      setResults({
        type: 'generate',
        data: urls
      })
      
      toast.success('Tokens generated successfully!')
    } catch (error: any) {
      console.error('Error generating tokens:', error)
      toast.error(error.message || 'Failed to generate tokens')
    } finally {
      setLoading(false)
    }
  }

  const handleValidateToken = async () => {
    if (!testToken) {
      toast.error('Please provide a token to validate')
      return
    }

    setLoading(true)
    try {
      const result = await validateInvitationToken(testToken)
      
      setResults({
        type: 'validate',
        data: result
      })
      
      if (result.valid) {
        toast.success('Token is valid!')
      } else {
        toast.error(result.error || 'Token is invalid')
      }
    } catch (error: any) {
      console.error('Error validating token:', error)
      toast.error(error.message || 'Failed to validate token')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsUsed = async () => {
    if (!testToken) {
      toast.error('Please provide a token to mark as used')
      return
    }

    setLoading(true)
    try {
      await markTokenAsUsed(testToken)
      toast.success('Token marked as used!')
      
      // Re-validate to show updated status
      await handleValidateToken()
    } catch (error: any) {
      console.error('Error marking token as used:', error)
      toast.error(error.message || 'Failed to mark token as used')
    } finally {
      setLoading(false)
    }
  }

  const handleCleanupExpired = async () => {
    setLoading(true)
    try {
      const deletedCount = await cleanupExpiredTokens()
      
      setResults({
        type: 'cleanup',
        data: { deletedCount }
      })
      
      toast.success(`Cleaned up ${deletedCount} expired tokens`)
    } catch (error: any) {
      console.error('Error cleaning up tokens:', error)
      toast.error(error.message || 'Failed to cleanup expired tokens')
    } finally {
      setLoading(false)
    }
  }

  const handleTestDatabaseFunction = async () => {
    if (!testToken) {
      toast.error('Please provide a token to test')
      return
    }

    setLoading(true)
    try {
      const functionName = invitationType === 'event' 
        ? 'process_event_invitation_token' 
        : 'process_crew_invitation_token'
      
      const { data, error } = await supabase.rpc(functionName, {
        p_token: testToken,
        p_user_id: user?.id || null
      })

      if (error) throw error

      setResults({
        type: 'database',
        data
      })

      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.error || 'Database function failed')
      }
    } catch (error: any) {
      console.error('Error testing database function:', error)
      toast.error(error.message || 'Failed to test database function')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Invitation Token System Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!user && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-400">Please log in to test the invitation token system.</p>
              </div>
            )}

            {user && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invitation Type</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={invitationType === 'event' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setInvitationType('event')}
                      >
                        Event
                      </Button>
                      <Button
                        variant={invitationType === 'crew' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setInvitationType('crew')}
                      >
                        Crew
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invitationId">Invitation ID (UUID)</Label>
                    <Input
                      id="invitationId"
                      value={invitationId}
                      onChange={(e) => setInvitationId(e.target.value)}
                      placeholder="Enter invitation ID to generate tokens for"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testToken">Test Token</Label>
                  <Textarea
                    id="testToken"
                    value={testToken}
                    onChange={(e) => setTestToken(e.target.value)}
                    placeholder="Paste a token here to validate or test"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    onClick={handleGenerateTokens}
                    disabled={loading || !invitationId}
                    size="sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
                    Generate
                  </Button>

                  <Button
                    onClick={handleValidateToken}
                    disabled={loading || !testToken}
                    variant="outline"
                    size="sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Validate
                  </Button>

                  <Button
                    onClick={handleMarkAsUsed}
                    disabled={loading || !testToken}
                    variant="outline"
                    size="sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Mark Used
                  </Button>

                  <Button
                    onClick={handleCleanupExpired}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Cleanup
                  </Button>
                </div>

                <Button
                  onClick={handleTestDatabaseFunction}
                  disabled={loading || !testToken}
                  className="w-full"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Test Database Function
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {results && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">{results.type}</Badge>
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-black/20 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(results.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
