import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Check, Loader2, Crown } from 'lucide-react'

interface JoinEventButtonProps {
  eventId: string
  initialJoined?: boolean
  onJoinChange?: (joined: boolean) => void
  className?: string
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
  showLoginPrompt?: boolean
  isHost?: boolean
}

export function JoinEventButton({
  eventId,
  initialJoined = false,
  onJoinChange,
  className = '',
  size = 'default',
  variant = 'default',
  showLoginPrompt = true,
  isHost = false
}: JoinEventButtonProps) {
  const { user } = useAuth()
  const [isJoined, setIsJoined] = useState(initialJoined)
  const [isLoading, setIsLoading] = useState(false)

  const checkJoinStatus = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error checking join status:', error)
        return
      }

      const joined = data?.status === 'going'
      setIsJoined(joined)
    } catch (error) {
      console.error('Error checking join status:', error)
    }
  }, [user?.id, eventId])

  // Update join status when initialJoined prop changes
  useEffect(() => {
    if (initialJoined !== undefined) {
      setIsJoined(initialJoined)
    }
  }, [initialJoined])

  useEffect(() => {
    // Only check join status if we don't have initialJoined value
    if (user && initialJoined === undefined) {
      checkJoinStatus()
    } else if (!user) {
      setIsJoined(false)
    }
  }, [user?.id, eventId, checkJoinStatus, initialJoined])

  const handleJoinToggle = async () => {
    if (!user) {
      if (showLoginPrompt) {
        // Store the current event URL for redirect after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname)
        toast.error('Please sign in to join events')
      }
      return
    }

    setIsLoading(true)
    try {
      if (isJoined) {
        // Leave event
        const { error } = await supabase
          .from('rsvps')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id)

        if (error) throw error

        setIsJoined(false)
        toast.success('Left the session')
        onJoinChange?.(false)
      } else {
        // Join event
        const { error } = await supabase
          .from('rsvps')
          .upsert({
            event_id: eventId,
            user_id: user.id,
            status: 'going'
          }, {
            onConflict: 'event_id,user_id'
          })

        if (error) throw error

        setIsJoined(true)
        toast.success('Hell yeah! You\'re in! 🍺')
        onJoinChange?.(true)
      }
    } catch (error) {
      console.error('Error updating join status:', error)
      toast.error('Failed to update join status')
    } finally {
      setIsLoading(false)
    }
  }

  if (isHost) {
    return (
      <Button
        variant="secondary"
        size={size}
        className={`${className} bg-primary/10 text-primary border-primary/20 cursor-not-allowed`}
        disabled
      >
        <Crown className="w-4 h-4 mr-2" />
        <span className="font-semibold">You are the host</span>
      </Button>
    )
  }

  if (!user && !showLoginPrompt) {
    return (
      <Button
        variant="outline"
        size={size}
        className={className}
        disabled
      >
        Sign in to Join
      </Button>
    )
  }

  return (
    <Button
      onClick={handleJoinToggle}
      disabled={isLoading}
      variant={isJoined ? 'secondary' : variant}
      size={size}
      className={`${className} ${
        isJoined
          ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 hover:text-green-700'
          : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95'
      } transition-all duration-200`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {isJoined ? 'Leaving...' : 'Joining...'}
        </>
      ) : isJoined ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          <span className="font-semibold">Joined! 🍻</span>
        </>
      ) : (
        <>
          <span className="font-semibold">Join the Party</span>
          <span className="ml-2">🎉</span>
        </>
      )}
    </Button>
  )
}
