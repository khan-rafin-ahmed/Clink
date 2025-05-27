import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

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

export function UserAvatar({ 
  userId,
  displayName, 
  avatarUrl, 
  email,
  size = 'md',
  className = '',
  showFallback = true
}: UserAvatarProps) {
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

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
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
