import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Calendar, 
  Users, 
  ArrowRight,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface InvitationActionProps {}

interface ActionResult {
  success: boolean
  action?: 'accepted' | 'declined'
  message: string
  event_title?: string
  event_slug?: string
  crew_name?: string
  crew_id?: string
  redirect_url?: string
  error?: string
}

export function InvitationAction({}: InvitationActionProps) {
  const params = useParams<{
    type?: 'event' | 'crew'
    action?: 'accept' | 'decline'
    token: string
  }>()

  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<ActionResult | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  // Handle both URL structures: /invitation/:type/:action/:token and /invitation/:token
  const token = params.token
  const type = params.type
  const action = params.action

  useEffect(() => {
    if (!token) {
      setResult({
        success: false,
        message: 'Invalid invitation link',
        error: 'Missing token'
      })
      setLoading(false)
      return
    }

    // Always try to process the token, even if user is null initially
    // The database function will handle the authentication check
    processInvitationToken()
  }, [token]) // Remove user dependency to avoid re-running when auth loads

  // Handle user authentication changes (when user logs in)
  useEffect(() => {
    if (user && result?.requires_auth) {
      // User just logged in and we have a pending auth-required result
      // Retry processing the token
      processInvitationToken()
    }
  }, [user, result?.requires_auth])

  const processInvitationToken = async () => {
    try {
      setLoading(true)

      // If type and action are provided in URL, use the specific function
      // Otherwise, determine from token prefix
      let functionName: string
      let tokenType: string

      if (type && action) {
        // URL structure: /invitation/:type/:action/:token
        if (type === 'event') {
          functionName = 'process_event_invitation_token'
          tokenType = 'event'
        } else if (type === 'crew') {
          functionName = 'process_crew_invitation_token'
          tokenType = 'crew'
        } else {
          throw new Error('Invalid invitation type')
        }
      } else {
        // URL structure: /invitation/:token - determine type from token prefix
        if (token?.startsWith('event_')) {
          functionName = 'process_event_invitation_token'
          tokenType = 'event'
        } else if (token?.startsWith('crew_')) {
          functionName = 'process_crew_invitation_token'
          tokenType = 'crew'
        } else {
          throw new Error('Unable to determine invitation type from token')
        }
      }

      const { data, error } = await supabase.rpc(functionName, {
        p_token: token,
        p_user_id: user?.id || null
      })

      if (error) {
        throw error
      }

      setResult(data)

      // Show success/error toast
      if (data.success) {
        toast.success(data.message)

        // Auto-redirect after successful action
        if (data.redirect_url) {
          setTimeout(() => {
            navigate(data.redirect_url)
          }, 2000) // 2 second delay to show success message
        }
      } else {
        // Handle specific error cases
        if (data.requires_auth) {
          // Store the invitation details for after login
          if (data.event_title) {
            localStorage.setItem('pending_invitation', JSON.stringify({
              token,
              event_title: data.event_title,
              invitation_id: data.invitation_id
            }))
          }

          toast.error('Please log in to respond to this invitation')
          // Redirect to login with return URL
          navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`)
        } else {
          toast.error(data.error || 'Failed to process invitation')
        }
      }

    } catch (error: any) {
      setResult({
        success: false,
        message: 'Failed to process invitation',
        error: error.message
      })
      toast.error('Failed to process invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleRedirect = async () => {
    if (!result?.redirect_url) return
    
    setRedirecting(true)
    
    // Small delay for better UX
    setTimeout(() => {
      navigate(result.redirect_url!)
    }, 1000)
  }

  const handleGoHome = () => {
    navigate('/events')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/80">
        <Card className="w-full max-w-md mx-4 glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground mt-4">Processing invitation...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/80">
        <Card className="w-full max-w-md mx-4 glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
            <p className="text-muted-foreground">Something went wrong</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/80 p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {result.success ? (
              result.action === 'accepted' ? (
                <CheckCircle className="w-16 h-16 text-green-500" />
              ) : (
                <XCircle className="w-16 h-16 text-orange-500" />
              )
            ) : (
              <AlertCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          
          <CardTitle className="text-xl">
            {result.success ? (
              result.action === 'accepted' ? (
                (type === 'event' || token?.startsWith('event_')) ? 'Event Joined!' : 'Crew Joined!'
              ) : (
                (type === 'event' || token?.startsWith('event_')) ? 'Event Declined' : 'Crew Invitation Declined'
              )
            ) : (
              'Invitation Error'
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              {result.message}
            </p>
            
            {(result.event_title || result.crew_name) && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-center gap-2 text-sm">
                  {type === 'event' ? (
                    <Calendar className="w-4 h-4" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    {result.event_title || result.crew_name}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {result.success && result.redirect_url && (
              <Button 
                onClick={handleRedirect}
                disabled={redirecting}
                className="w-full"
              >
                {redirecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    {(type === 'event' || token?.startsWith('event_')) ? 'View Event' : 'View Crew'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleGoHome}
              className="w-full"
            >
              {result.success ? 'Browse Events' : 'Go Back'}
            </Button>
          </div>

          {!result.success && result.error && (
            <div className="text-xs text-muted-foreground text-center">
              Error: {result.error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
