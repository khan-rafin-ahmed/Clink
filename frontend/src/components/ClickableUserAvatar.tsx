import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserAvatar } from './UserAvatar'
import { getUserProfile } from '@/lib/userService'
import { useAuth } from '@/lib/auth-context'
import { cn, generateUsernameFromDisplayName } from '@/lib/utils'

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
        let fetchedUsername = profile?.username || null

        // Fallback: if no username, generate one from display_name
        if (!fetchedUsername && profile?.display_name) {
          fetchedUsername = generateUsernameFromDisplayName(profile.display_name)
        }

        // Cache the result
        usernameCache.set(userId, fetchedUsername)
        setUsername(fetchedUsername)
      } catch (error) {
        console.error('Error fetching username for avatar click:', error)
        // Try fallback with display name if available
        if (displayName) {
          const fallbackUsername = generateUsernameFromDisplayName(displayName)
          usernameCache.set(userId, fallbackUsername)
          setUsername(fallbackUsername)
        } else {
          usernameCache.set(userId, null)
          setUsername(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsername()
  }, [userId, disabled, user?.id, displayName])

  const handleClick = (e: React.MouseEvent) => {
    // Prevent event bubbling to parent elements
    e.preventDefault()
    e.stopPropagation()

    if (disabled || !userId || isLoading) return

    // If we have a username, use it; otherwise try to create one from display name
    let targetUsername = username
    if (!targetUsername && displayName) {
      targetUsername = generateUsernameFromDisplayName(displayName)
    }

    if (!targetUsername) {
      console.warn('ClickableUserAvatar: No username available for navigation', { userId, displayName })
      return
    }

    // Navigate to user profile and ensure scroll to top (same as CrewDetail View buttons)
    navigate(`/profile/${targetUsername}`)
    // Force scroll to top immediately after navigation
    setTimeout(() => window.scrollTo(0, 0), 0)
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

  // Render clickable avatar - make it clickable if we have username OR displayName
  const isClickable = (username || displayName) && !isLoading

  return (
    <div
      onClick={handleClick}
      className={cn(
        // Clean, unstyled clickable container - no link appearance
        'inline-block transition-all duration-200',
        // Remove any potential text decoration or color changes
        'no-underline text-current',
        isClickable
          ? 'cursor-pointer hover:scale-105 hover:opacity-80'
          : 'cursor-default',
        className
      )}
      role="button"
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as any)
        }
      }}
      style={{ textDecoration: 'none' }} // Ensure no underline
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
