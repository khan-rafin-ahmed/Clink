import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserAvatar } from './UserAvatar'
import { getUserProfile } from '@/lib/userService'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

// Simple cache for usernames to avoid repeated API calls
const usernameCache = new Map<string, string | null>()

interface ClickableUserAvatarProps {
  userId?: string
  displayName?: string | null
  avatarUrl?: string | null
  email?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallback?: boolean
  children?: React.ReactNode
  disabled?: boolean // Allow disabling click functionality
}

export function ClickableUserAvatar({
  userId,
  displayName,
  avatarUrl,
  email,
  size = 'md',
  className = '',
  showFallback = true,
  children,
  disabled = false
}: ClickableUserAvatarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [username, setUsername] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch username when userId is available
  useEffect(() => {
    if (!userId || disabled) return

    // Don't make avatars clickable for the current user's own avatar
    if (user?.id === userId) {
      setUsername(null)
      return
    }

    // Check cache first
    if (usernameCache.has(userId)) {
      setUsername(usernameCache.get(userId) || null)
      return
    }

    const fetchUsername = async () => {
      try {
        setIsLoading(true)
        const profile = await getUserProfile(userId)
        const fetchedUsername = profile?.username || null

        // Cache the result
        usernameCache.set(userId, fetchedUsername)
        setUsername(fetchedUsername)
      } catch (error) {
        console.error('Error fetching username for avatar click:', error)
        usernameCache.set(userId, null)
        setUsername(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsername()
  }, [userId, disabled, user?.id])

  const handleClick = (e: React.MouseEvent) => {
    // Prevent event bubbling to parent elements
    e.preventDefault()
    e.stopPropagation()

    if (disabled || !userId || !username || isLoading) return

    // Navigate to user profile
    navigate(`/profile/${username}`)
  }

  // If disabled, no userId, or current user's own avatar, render non-clickable avatar
  if (disabled || !userId || user?.id === userId) {
    return children || (
      <UserAvatar
        userId={userId}
        displayName={displayName}
        avatarUrl={avatarUrl}
        email={email}
        size={size}
        className={className}
        showFallback={showFallback}
      />
    )
  }

  // Render clickable avatar
  return (
    <div
      onClick={handleClick}
      className={cn(
        'transition-all duration-200',
        username && !isLoading
          ? 'cursor-pointer hover:scale-105 hover:opacity-80'
          : 'cursor-default',
        className
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as any)
        }
      }}
    >
      {children || (
        <UserAvatar
          userId={userId}
          displayName={displayName}
          avatarUrl={avatarUrl}
          email={email}
          size={size}
          showFallback={showFallback}
        />
      )}
    </div>
  )
}
