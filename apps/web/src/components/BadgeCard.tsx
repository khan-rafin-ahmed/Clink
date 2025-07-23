// BadgeCard Component
// Reusable badge display card using existing design system

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { BadgeIcon } from './BadgeIcon'
import { cn } from '@/lib/utils'
import type { Badge as BadgeType, UserBadge, BadgeProgress, BadgeVariant } from '@/types/badge'

interface BadgeCardProps {
  badge: BadgeType
  userBadge?: UserBadge
  progress?: BadgeProgress
  variant?: BadgeVariant
  expandable?: boolean
  showVisibilityToggle?: boolean
  onToggleVisibility?: (badgeId: string, visible: boolean) => void
  className?: string
}

export function BadgeCard({
  badge,
  userBadge,
  progress,
  variant = 'detailed',
  expandable = false,
  showVisibilityToggle = false,
  onToggleVisibility,
  className
}: BadgeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isEarned = !!userBadge
  const isVisible = userBadge?.is_visible_on_profile ?? false

  const handleVisibilityToggle = (checked: boolean) => {
    if (onToggleVisibility && isEarned) {
      onToggleVisibility(badge.id, checked)
    }
  }

  const handleCardClick = () => {
    if (expandable) {
      setIsExpanded(!isExpanded)
    }
  }

  // Progress calculation for locked badges
  const progressPercentage = progress 
    ? Math.min((progress.current_progress / progress.target_progress) * 100, 100)
    : 0

  return (
    <Card 
      className={cn(
        'glass-card hover:border-primary/30 transition-all duration-300',
        expandable && 'cursor-pointer hover:scale-[1.02]',
        !isEarned && 'opacity-75',
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Badge Icon */}
          <BadgeIcon 
            badge={badge}
            size={variant === 'preview' ? 'sm' : 'md'}
            isLocked={!isEarned}
            showTooltip={variant === 'preview'}
          />

          {/* Badge Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm sm:text-base">
                  {badge.name}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                  {badge.description}
                </p>
              </div>

              {/* Visibility Toggle */}
              {showVisibilityToggle && isEarned && (
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs text-muted-foreground">Show</span>
                  <Switch
                    checked={isVisible}
                    onCheckedChange={handleVisibilityToggle}
                  />
                </div>
              )}
            </div>

            {/* Tier Badge */}
            {badge.tier > 1 && (
              <Badge 
                variant="outline" 
                size="sm" 
                className="mt-2 text-xs"
              >
                Tier {badge.tier}
              </Badge>
            )}

            {/* Earned Date */}
            {isEarned && userBadge && (
              <p className="text-xs text-muted-foreground mt-2">
                Earned {new Date(userBadge.earned_at).toLocaleDateString()}
              </p>
            )}

            {/* Progress Bar for Locked Badges */}
            {!isEarned && progress && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progress.current_progress}/{progress.target_progress}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Expanded Details */}
            {expandable && isExpanded && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div>
                    <span className="font-medium">Category:</span> {badge.category.replace('_', ' ')}
                  </div>
                  <div>
                    <span className="font-medium">Tier:</span> {badge.color_tier}
                  </div>
                  {badge.is_hidden && (
                    <Badge variant="secondary" size="sm">Hidden Badge</Badge>
                  )}
                  {badge.is_easter_egg && (
                    <Badge variant="accent" size="sm">Easter Egg</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
