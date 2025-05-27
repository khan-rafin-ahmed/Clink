import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { isInInnerCircle } from '@/lib/followService'
import { Users } from 'lucide-react'

interface InnerCircleBadgeProps {
  userId: string
  className?: string
  variant?: 'inline' | 'corner'
}

export function InnerCircleBadge({ userId, className = '', variant = 'inline' }: InnerCircleBadgeProps) {
  const { user } = useAuth()
  const [isInCircle, setIsInCircle] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user && userId && user.id !== userId) {
      checkInnerCircleStatus()
    } else {
      setIsLoading(false)
    }
  }, [user?.id, userId])

  const checkInnerCircleStatus = async () => {
    try {
      const inCircle = await isInInnerCircle(userId)
      setIsInCircle(inCircle)
    } catch (error) {
      console.error('Error checking Inner Circle status:', error)
      setIsInCircle(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show badge if loading, not logged in, or not in circle
  if (isLoading || !user || !isInCircle || user.id === userId) {
    return null
  }

  if (variant === 'corner') {
    return (
      <div className={`absolute top-2 right-2 z-10 ${className}`}>
        <Badge
          variant="secondary"
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400 shadow-lg text-xs px-2 py-1"
        >
          <Users className="w-3 h-3 mr-1" />
          Inner Circle
        </Badge>
      </div>
    )
  }

  return (
    <Badge
      variant="secondary"
      className={`bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400 text-xs px-2 py-1 ${className}`}
      title="In Your Inner Circle"
    >
      <Users className="w-3 h-3" />
    </Badge>
  )
}
