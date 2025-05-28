import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { joinCrewByInviteCode, getCrewById, type Crew } from '@/lib/crewService'
import { toast } from 'sonner'
import { 
  Users, 
  Globe, 
  Lock, 
  Coffee, 
  PartyPopper, 
  Flame, 
  Crown, 
  Star,
  Loader2,
  ArrowLeft
} from 'lucide-react'

export function CrewJoin() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [crew, setCrew] = useState<Crew | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const vibeIcons = {
    casual: Coffee,
    party: PartyPopper,
    chill: Coffee,
    wild: Flame,
    classy: Crown,
    other: Star
  }

  useEffect(() => {
    if (!inviteCode) {
      setError('Invalid invite link')
      setIsLoading(false)
      return
    }

    // For now, we'll try to join and see what crew it is
    // In a real app, you might want to preview the crew first
    setIsLoading(false)
  }, [inviteCode])

  const handleJoinCrew = async () => {
    if (!user) {
      toast.error('Please sign in to join a crew')
      navigate('/login')
      return
    }

    if (!inviteCode) {
      toast.error('Invalid invite code')
      return
    }

    setIsJoining(true)
    try {
      const joinedCrew = await joinCrewByInviteCode(inviteCode)
      toast.success(`🍻 Hell yeah! You joined "${joinedCrew.name}"!`)
      navigate('/profile') // Redirect to profile to see crews
    } catch (error: any) {
      console.error('Error joining crew:', error)
      toast.error(error.message || 'Failed to join crew')
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading invite...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">Invalid Invite</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/profile')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display">Join the Crew! 🍺</CardTitle>
          <p className="text-muted-foreground">
            You've been invited to join a crew. Ready to raise hell together?
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Invite Code:</p>
            <code className="bg-muted px-3 py-1 rounded text-sm font-mono">
              {inviteCode}
            </code>
          </div>

          {!user ? (
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Sign in to join this crew
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/profile')}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={() => navigate('/login')}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
                >
                  Sign In
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/profile')}
                className="flex-1"
                disabled={isJoining}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleJoinCrew}
                disabled={isJoining}
                className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Join Crew
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
