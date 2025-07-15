import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { getGoogleAvatarUrl, getCurrentUserGoogleAvatar } from '@/lib/googleAvatarService'
import { useAuth } from '@/lib/auth-context'

interface UserAvatarProps {
  userId?: string
  displayName?: string | null
  avatarUrl?: string | null
  email?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallback?: boolean
}

const sizeClasses = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
}

const fallbackSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
}

// Hook to get Google avatar URL for any user
function useGoogleAvatar(userId?: string) {
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { user: currentUser } = useAuth()

  useEffect(() => {
    if (!userId) return

    const fetchGoogleAvatar = async () => {
      setLoading(true)
      try {
        let avatarUrl: string | null = null

        // If this is the current user, use the faster method
        if (currentUser && currentUser.id === userId) {
          avatarUrl = await getCurrentUserGoogleAvatar()
        } else {
          // For other users, use the RPC function
          avatarUrl = await getGoogleAvatarUrl(userId)
        }

        setGoogleAvatarUrl(avatarUrl)
      } catch (error) {
        setGoogleAvatarUrl(null)
      } finally {
        setLoading(false)
      }
    }

    fetchGoogleAvatar()
  }, [userId, currentUser?.id])

  return { googleAvatarUrl, loading }
}

export function UserAvatar({
  userId,
  displayName,
  avatarUrl,
  email,
  size = 'md',
  className = '',
  showFallback = true
}: UserAvatarProps) {
  // Get Google avatar as fallback
  const { googleAvatarUrl } = useGoogleAvatar(userId)

  const getFallbackText = () => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase()
    }
    if (email) {
      return email.charAt(0).toUpperCase()
    }
    if (userId) {
      return userId.charAt(0).toUpperCase()
    }
    return '?'
  }

  const getDisplayName = () => {
    if (displayName) return displayName
    if (email) return email.split('@')[0]
    if (userId) return `User ${userId.slice(-4)}`
    return 'Anonymous'
  }

  // Priority: custom avatar > Google avatar > fallback
  const effectiveAvatarUrl = avatarUrl || googleAvatarUrl

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {effectiveAvatarUrl && (
        <AvatarImage
          src={effectiveAvatarUrl}
          alt={getDisplayName()}
          className="object-cover"
        />
      )}
      {showFallback && (
        <AvatarFallback className={cn(
          'bg-primary/10 text-primary font-medium',
          fallbackSizeClasses[size]
        )}>
          {getFallbackText()}
        </AvatarFallback>
      )}
    </Avatar>
  )
}

interface UserAvatarWithNameProps extends UserAvatarProps {
  showName?: boolean
  nameClassName?: string
}

export function UserAvatarWithName({
  showName = true,
  nameClassName = '',
  ...avatarProps
}: UserAvatarWithNameProps) {
  const getDisplayName = () => {
    if (avatarProps.displayName) return avatarProps.displayName
    if (avatarProps.email) return avatarProps.email.split('@')[0]
    if (avatarProps.userId) return `User ${avatarProps.userId.slice(-4)}`
    return 'Anonymous'
  }

  if (!showName) {
    return <UserAvatar {...avatarProps} />
  }

  return (
    <div className="flex items-center gap-2">
      <UserAvatar {...avatarProps} />
      <span className={cn('text-sm font-medium', nameClassName)}>
        {getDisplayName()}
      </span>
    </div>
  )
}
