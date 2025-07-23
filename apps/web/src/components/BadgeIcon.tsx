// BadgeIcon Component
// Simple, reusable badge icon using existing design system

import { cn } from '@/lib/utils'
import type { Badge, BadgeColorTier } from '@/types/badge'
import * as Icons from 'lucide-react'

interface BadgeIconProps {
  badge: Badge
  size?: 'sm' | 'md' | 'lg' | 'xl'
  isLocked?: boolean
  showTooltip?: boolean
  className?: string
}

export function BadgeIcon({ 
  badge, 
  size = 'md', 
  isLocked = false,
  showTooltip = false,
  className 
}: BadgeIconProps) {
  // Size mappings
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  }

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 40
  }

  // Color tier mappings using existing design system
  const colorClasses: Record<BadgeColorTier, string> = {
    bronze: 'bg-[#CD7F32]/20 border-[#CD7F32]/40 text-[#CD7F32]',
    silver: 'bg-[#C0C0C0]/20 border-[#C0C0C0]/40 text-[#C0C0C0]',
    gold: 'bg-[#FFD700]/20 border-[#FFD700]/40 text-[#FFD700]',
    neon: 'bg-[#00FFA3]/20 border-[#00FFA3]/40 text-[#00FFA3]'
  }

  // Locked state styling
  const lockedClasses = 'bg-white/5 border-white/20 text-white/40 opacity-40'

  // Get the icon component dynamically
  const getIcon = (iconName: string) => {
    // Convert icon name to PascalCase for Lucide icons
    const iconKey = iconName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
    
    // Fallback icons for common badge types
    const iconMap: Record<string, keyof typeof Icons> = {
      'glass-cheers': 'Wine',
      'calendar-check': 'CalendarCheck',
      'party-popper': 'PartyPopper',
      'user-plus': 'UserPlus',
      'message-circle': 'MessageCircle',
      'glass-water': 'Wine',
      'help-circle': 'HelpCircle'
    }

    const finalIconKey = (iconMap[iconName] || iconKey) as keyof typeof Icons
    const IconComponent = Icons[finalIconKey] || Icons.Award

    return IconComponent
  }

  const IconComponent = getIcon(badge.icon_name)

  return (
    <div
      className={cn(
        'rounded-xl border-2 backdrop-blur-sm transition-all duration-300',
        'flex items-center justify-center',
        sizeClasses[size],
        isLocked ? lockedClasses : colorClasses[badge.color_tier],
        !isLocked && 'hover:scale-105 hover:shadow-lg',
        className
      )}
      title={showTooltip ? `${badge.name}: ${badge.description}` : undefined}
    >
      <IconComponent size={iconSizes[size]} />
    </div>
  )
}
