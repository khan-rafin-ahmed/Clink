import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { sendFollowRequest, unfollowUser, getFollowStatus, type Follow } from '@/lib/followService'
import { toast } from 'sonner'
import { UserPlus, UserCheck, Clock, Loader2, UserMinus } from 'lucide-react'

interface FollowButtonProps {
  userId: string
  className?: string
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline' | 'secondary'
}

export function FollowButton({
  userId,
  className = '',
  size = 'default',
  variant = 'default'
}: FollowButtonProps) {
  const { user } = useAuth()
  const [followStatus, setFollowStatus] = useState<Follow | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (user && userId && user.id !== userId) {
      checkFollowStatus()
    } else {
      setIsCheckingStatus(false)
    }
  }, [user?.id, userId])

  const checkFollowStatus = async () => {
    try {
      setIsCheckingStatus(true)
      const status = await getFollowStatus(userId)
      setFollowStatus(status)
    } catch (error) {
      console.error('Error checking follow status:', error)
      // If tables don't exist yet, just continue without status
      setFollowStatus(null)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleFollowAction = async () => {
    if (!user) {
      toast.error('Please sign in to follow users')
      return
    }

    setIsLoading(true)
    try {
      if (!followStatus) {
        // Send follow request
        await sendFollowRequest(userId)
        setFollowStatus({
          id: 'temp',
          follower_id: user.id,
          following_id: userId,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        toast.success('Inner Circle request sent! 🎉')
      } else {
        // Unfollow
        await unfollowUser(userId)
        setFollowStatus(null)
        toast.success('Removed from Inner Circle')
      }
    } catch (error) {
      console.error('Error updating follow status:', error)
      toast.error('Database tables not set up yet. Please run the SQL migration first!')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show button for own profile or when not logged in
  if (!user || user.id === userId) {
    return null
  }

  if (isCheckingStatus) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {followStatus ? 'Removing...' : 'Sending...'}
        </>
      )
    }

    if (!followStatus) {
      return (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Add to Circle
        </>
      )
    }

    switch (followStatus.status) {
      case 'pending':
        return (
          <>
            <Clock className="w-4 h-4 mr-2" />
            Pending Request
          </>
        )
      case 'accepted':
        if (isHovered) {
          return (
            <>
              <UserMinus className="w-4 h-4 mr-2" />
              Remove from Circle
            </>
          )
        }
        return (
          <>
            <UserCheck className="w-4 h-4 mr-2" />
            In Your Circle
          </>
        )
      case 'rejected':
        return (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Add to Circle
          </>
        )
      default:
        return (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Add to Circle
          </>
        )
    }
  }

  const getButtonVariant = () => {
    if (followStatus?.status === 'accepted') {
      return isHovered ? 'destructive' : 'secondary'
    }
    if (followStatus?.status === 'pending') {
      return 'outline'
    }
    return variant
  }

  const getButtonClassName = () => {
    let baseClass = className

    if (followStatus?.status === 'accepted') {
      if (isHovered) {
        baseClass += ' bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20'
      } else {
        baseClass += ' bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20'
      }
    } else if (followStatus?.status === 'pending') {
      baseClass += ' bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20'
    }

    return baseClass
  }

  return (
    <Button
      onClick={handleFollowAction}
      disabled={isLoading}
      variant={getButtonVariant()}
      size={size}
      className={getButtonClassName()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {getButtonContent()}
    </Button>
  )
}
