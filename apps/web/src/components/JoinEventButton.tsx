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
  const [isHovered, setIsHovered] = useState(false)
  const [isTouched, setIsTouched] = useState(false) // For mobile touch states

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

  const handleJoinToggle = async (e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent any default behavior and ensure the event is handled
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!user) {
      // Store the current event URL for redirect after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname)

      if (showLoginPrompt) {
        toast.error('Please sign in to join events')
        // Redirect to login page
        window.location.href = '/login'
      }
      return
    }

    setIsLoading(true)
    try {
      if (isJoined) {
        // Leave event using RPC function to handle both rsvps and event_members
        const { data, error } = await supabase
          .rpc('leave_event', {
            p_event_id: eventId,
            p_user_id: user.id
          })

        if (error) throw error

        const result = data?.[0]
        if (result?.success) {
          setIsJoined(false)
          toast.success('Left the session')
          onJoinChange?.(false)
        } else {
          throw new Error(result?.message || 'Failed to leave event')
        }
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
      // Reset touch/hover states after action completes
      setIsHovered(false)
      setIsTouched(false)
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

  // Show sign-in prompt for unauthenticated users
  if (!user) {
    return (
      <Button
        onClick={handleJoinToggle}
        variant="outline"
        size={size}
        className={`${className} bg-transparent border border-[#00FFA3] text-[#00FFA3] rounded-full px-5 py-2
                   hover:shadow-[0_0_8px_#00FFA3] transition-all ease-in-out duration-150
                   active:scale-95 touch-manipulation min-h-[44px] min-w-[120px] select-none join-event-button`}
      >
        <span className="font-bold">Sign in to Join</span>
        <span className="ml-2">🎉</span>
      </Button>
    )
  }

  // Handle touch events for mobile devices
  const handleTouchStart = () => {
    setIsTouched(true)
    if (isJoined) {
      setIsHovered(true) // Show "Leave Event" on touch
    }
  }

  const handleTouchEnd = () => {
    setIsTouched(false)
    // Keep hover state for a moment to allow user to see the "Leave Event" text
    if (isJoined) {
      setTimeout(() => setIsHovered(false), 100)
    }
  }

  // Handle mouse events for desktop
  const handleMouseEnter = () => {
    if (!isTouched) { // Only set hover if not currently being touched
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isTouched) { // Only clear hover if not currently being touched
      setIsHovered(false)
    }
  }

  return (
    <Button
      onClick={handleJoinToggle}
      disabled={isLoading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      size={size}
      className={`${className} join-event-button ${
        isJoined
          ? `bg-[#0E0E10] border border-[#00FFA3]/30 text-[#00FFA3] rounded-full px-5 py-2
             hover:text-[#FF5E78] transition-all ease-in-out duration-150 cursor-pointer
             active:text-[#FF5E78] active:scale-95 touch-manipulation
             min-h-[44px] min-w-[120px] select-none`
          : `bg-transparent border border-[#00FFA3] text-[#00FFA3] rounded-full px-5 py-2
             hover:shadow-[0_0_8px_#00FFA3] transition-all ease-in-out duration-150
             active:scale-95 touch-manipulation
             min-h-[44px] min-w-[120px] select-none`
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {isJoined ? 'Leaving...' : 'Joining...'}
        </>
      ) : isJoined ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          <span className="font-semibold">
            {isHovered || isTouched ? 'Leave Event' : 'Joined! 🍻'}
          </span>
        </>
      ) : (
        <>
          <span className="font-bold">Join the Party</span>
          <span className="ml-2">🎉</span>
        </>
      )}
    </Button>
  )
}
