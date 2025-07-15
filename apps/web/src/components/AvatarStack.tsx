import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ClickableUserAvatar } from './ClickableUserAvatar'
import { cn } from '@/lib/utils'
import type { CrewMember } from '@/types'

interface AvatarStackProps {
  members: CrewMember[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',  // Mobile: 40px equivalent
  md: 'w-10 h-10', // Desktop: 48px equivalent
  lg: 'w-12 h-12'
}

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
}

export function AvatarStack({
  members,
  max = 5,
  size = 'md',
  className
}: AvatarStackProps) {
  const visibleMembers = members.slice(0, max)
  const remainingCount = Math.max(0, members.length - max)

  return (
    <div className={cn("flex items-center", className)}>
      {/* Avatar Stack - Horizontally aligned with slight overlap */}
      <div className="flex -space-x-2">
        {visibleMembers.map((member, index) => (
          <ClickableUserAvatar
            key={member.id}
            userId={member.user_id}
            displayName={member.user?.display_name}
            avatarUrl={member.user?.avatar_url}
            size={size}
            className={cn(
              // Remove any default link styling and add clean hover effects
              "relative transition-all duration-300 hover:scale-110 hover:z-20",
              // Apply proper z-index for stacking
              index === 0 ? "z-10" : index === 1 ? "z-9" : index === 2 ? "z-8" : index === 3 ? "z-7" : "z-6"
            )}
          >
            <Avatar
              className={cn(
                sizeClasses[size],
                "border-2 border-background ring-1 ring-white/20 hover:ring-primary/40 transition-all duration-300 bg-glass backdrop-blur-sm"
              )}
            >
              <AvatarImage src={member.user?.avatar_url || undefined} />
              <AvatarFallback className={cn(
                "bg-gradient-to-br from-primary/20 to-accent-primary/20 text-primary font-bold backdrop-blur-sm",
                textSizeClasses[size]
              )}>
                {member.user?.display_name?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </ClickableUserAvatar>
        ))}

        {/* Remaining count badge */}
        {remainingCount > 0 && (
          <div className={cn(
            sizeClasses[size],
            "border-2 border-background bg-glass backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold relative z-5",
            textSizeClasses[size]
          )}>
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  )
}
