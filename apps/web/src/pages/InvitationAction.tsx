import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuth } from '@/lib/auth-context'
import { processEmailInvitationToken } from '@/lib/eventInvitationService'
import { supabase } from '@/lib/supabase'
import { cacheService } from '@/lib/cacheService'
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
  requires_auth?: boolean
  event_id?: string
  invitation_id?: string
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

  // Handle case where user is already logged in but invitation processing failed
  useEffect(() => {
    if (user && !loading && result?.requires_auth) {
      // User is now authenticated, retry processing
      console.log('🔄 User authenticated, retrying invitation processing')
      processInvitationToken()
    }
  }, [user, loading, result?.requires_auth])



  const processInvitationToken = async () => {
    try {
      setLoading(true)

      // Determine invitation type and action
      let invitationType: 'event' | 'crew'
      let invitationAction: 'accept' | 'decline'

      if (type && action) {
        // URL structure: /invitation/:type/:action/:token
        invitationType = type as 'event' | 'crew'
        invitationAction = action as 'accept' | 'decline'
      } else {
        // URL structure: /invitation/:token - determine from token prefix
        if (token?.startsWith('event_accept_')) {
          invitationType = 'event'
          invitationAction = 'accept'
        } else if (token?.startsWith('event_decline_')) {
          invitationType = 'event'
          invitationAction = 'decline'
        } else if (token?.startsWith('crew_accept_')) {
          invitationType = 'crew'
          invitationAction = 'accept'
        } else if (token?.startsWith('crew_decline_')) {
          invitationType = 'crew'
          invitationAction = 'decline'
        } else {
          throw new Error('Unable to determine invitation type from token')
        }
      }

      // Use our unified service for processing
      const result = await processEmailInvitationToken(
        token!,
        invitationType,
        invitationAction,
        user?.id
      )

      setResult({
        success: result.success,
        message: result.message,
        action: result.data?.action,
        event_title: result.data?.event_title,
        event_id: result.data?.event_id,
        redirect_url: result.data?.redirect_url,
        requires_auth: result.data?.requires_auth,
        error: result.success ? undefined : result.message
      })

      // Show success/error toast
      if (result.success) {
        toast.success(result.message)

        // CRITICAL: Update notification cache after successful email response
        // This ensures the notification shows the correct response state when user returns to app
        if (user?.id && result.data?.action) {
          console.log('🔄 [InvitationAction] Updating notification cache after email response')
          await updateNotificationCacheAfterEmailResponse(
            user.id,
            result.data.action,
            result.data.event_id || result.data.crew_id,
            invitationType
          )
        }

        // Auto-redirect after successful action
        if (result.data?.redirect_url) {
          setTimeout(() => {
            navigate(result.data.redirect_url)
          }, 2000) // 2 second delay to show success message
        }
      } else {
        // Handle specific error cases
        if (result.data?.requires_auth) {
          toast.error('Please log in to respond to this invitation')
          // Store redirect URL in sessionStorage for auth system
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
          // Redirect to login
          navigate('/login')
        } else {
          toast.error(result.message || 'Failed to process invitation')
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

  // Helper function to update notification cache after email response
  const updateNotificationCacheAfterEmailResponse = async (
    userId: string,
    action: string,
    entityId: string,
    type: 'event' | 'crew'
  ) => {
    try {
      console.log('📝 [InvitationAction] Updating notification cache:', { userId, action, entityId, type })

      // Get current notifications from cache or database
      const cacheKey = `user_notifications_${userId}`
      let notifications = cacheService.get(cacheKey)

      if (!notifications) {
        // Load from database if not in cache
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50)

        notifications = data || []
      }

      // Find and update the relevant invitation notification
      const updatedNotifications = notifications.map((notification: any) => {
        const isTargetNotification =
          notification.type === `${type}_invitation` &&
          (notification.data?.event_id === entityId ||
           notification.data?.crew_id === entityId)

        if (isTargetNotification) {
          console.log('✅ [InvitationAction] Found matching notification to update:', notification.id)
          return {
            ...notification,
            data: {
              ...notification.data,
              user_response: action,
              responded_at: new Date().toISOString(),
              response_method: 'email'
            },
            read: true
          }
        }
        return notification
      })

      // Update cache with modified notifications
      cacheService.set(cacheKey, updatedNotifications, 60 * 1000) // 60 second TTL

      // Also update unread count cache
      const unreadCacheKey = `unread_count_${userId}`
      const currentUnreadCount = cacheService.get(unreadCacheKey) || 0
      if (currentUnreadCount > 0) {
        cacheService.set(unreadCacheKey, Math.max(0, currentUnreadCount - 1), 60 * 1000)
      }

      console.log('✅ [InvitationAction] Notification cache updated successfully')
    } catch (error) {
      console.error('❌ [InvitationAction] Failed to update notification cache:', error)
      // Don't throw - this is a nice-to-have optimization
    }
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
