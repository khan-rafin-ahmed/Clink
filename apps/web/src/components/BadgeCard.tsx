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

  // Get tier-based hover glow color
  const getTierGlowColor = (colorTier: string) => {
    const glowColors = {
      bronze: 'hover:shadow-[0_0_20px_rgba(205,127,50,0.3)]',
      silver: 'hover:shadow-[0_0_20px_rgba(192,192,192,0.3)]',
      gold: 'hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]',
      neon: 'hover:shadow-[0_0_20px_rgba(0,255,163,0.3)]'
    }
    return glowColors[colorTier as keyof typeof glowColors] || glowColors.neon
  }

  return (
    <Card
      className={cn(
        'glass-card backdrop-blur-sm rounded-lg transition-all duration-300 border border-white/10',
        expandable && 'cursor-pointer hover:scale-[1.02]',
        !isEarned && 'opacity-75',
        variant === 'dashboard' && getTierGlowColor(badge.color_tier),
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="px-4 py-4 sm:p-4">
        <div className="flex items-start gap-4">
          {/* Badge Icon - 64x64 */}
          <div className="flex-shrink-0">
            <BadgeIcon
              badge={badge}
              size="lg"
              isLocked={!isEarned}
              showTooltip={variant === 'preview'}
              className="w-16 h-16"
            />
          </div>

          {/* Text Block */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title */}
            <h3 className="text-lg font-semibold text-white leading-tight">
              {badge.name}
            </h3>

            {/* Subtitle */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {badge.description}
            </p>

            {/* Bottom Section - Progress/Date + Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                {isEarned ? (
                  <div className="text-xs text-muted-foreground">
                    Earned {userBadge ? new Date(userBadge.earned_at).toLocaleDateString() : ''}
                  </div>
                ) : progress ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-muted-foreground">
                        {progress.current_progress}/{progress.target_progress}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="bg-[#00FFA3] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Visibility Toggle */}
              {showVisibilityToggle && isEarned && (
                <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Show</span>
                  <div className="relative">
                    <Switch
                      checked={isVisible}
                      onCheckedChange={handleVisibilityToggle}
                      className="data-[state=checked]:bg-[#00FFA3] data-[state=unchecked]:bg-white/20 h-4 w-7 sm:h-6 sm:w-11 !min-h-0 !min-w-0 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3 sm:[&>span]:h-5 sm:[&>span]:w-5 sm:[&>span]:data-[state=checked]:translate-x-5"
                    />
                  </div>
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



            {/* Progress Bar for Locked Badges */}
            {!isEarned && progress && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span>
                  <span>{progress.current_progress}/{progress.target_progress}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-[#00FFA3] h-2 rounded-full transition-all duration-300"
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
                    <span className="font-medium">Tier:</span> {badge.tier}
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
