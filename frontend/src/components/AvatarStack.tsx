import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { CrewMember } from '@/types'

interface AvatarStackProps {
  members: CrewMember[]
  max?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10'
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
      {/* Avatar Stack */}
      <div className="flex -space-x-2">
        {visibleMembers.map((member, index) => (
          <Avatar 
            key={member.id} 
            className={cn(
              sizeClasses[size],
              "border-2 border-background ring-1 ring-white/20 hover:ring-primary/40 transition-all duration-300 hover:scale-110 hover:z-10 relative",
              `z-[${10 - index}]` // Higher z-index for earlier avatars
            )}
            style={{ zIndex: 10 - index }}
          >
            <AvatarImage src={member.user?.avatar_url || undefined} />
            <AvatarFallback className={cn(
              "bg-gradient-to-br from-primary/20 to-accent-primary/20 text-primary font-bold backdrop-blur-sm",
              textSizeClasses[size]
            )}>
              {member.user?.display_name?.charAt(0).toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
        ))}
        
        {/* Remaining count badge */}
        {remainingCount > 0 && (
          <div className={cn(
            sizeClasses[size],
            "border-2 border-background bg-muted/80 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground font-bold relative z-0",
            textSizeClasses[size]
          )}>
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  )
}
