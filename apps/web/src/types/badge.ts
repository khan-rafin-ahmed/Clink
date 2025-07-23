// Badge System Types
// Simple, clean type definitions for the badge system

export type BadgeCategory = 
  | 'event_participation'
  | 'hosting_crew' 
  | 'social_activity'
  | 'streaks_time'
  | 'weekly_sinners'
  | 'drink_devotees'

export type BadgeColorTier = 'bronze' | 'silver' | 'gold' | 'neon'

export interface BadgeUnlockCriteria {
  type: string
  target: number | string
  conditions?: Record<string, any>
}

export interface Badge {
  id: string
  name: string
  description: string
  category: BadgeCategory
  tier: number
  unlock_criteria: BadgeUnlockCriteria
  icon_name: string
  color_tier: BadgeColorTier
  is_hidden: boolean
  is_easter_egg: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  progress_data: Record<string, any>
  is_visible_on_profile: boolean
  display_order: number
  created_at: string
  updated_at: string
  // Joined badge data
  badge?: Badge
}

export interface BadgeProgress {
  id: string
  user_id: string
  badge_id: string
  current_progress: number
  target_progress: number
  progress_data: Record<string, any>
  last_updated: string
  // Joined badge data
  badge?: Badge
}

export interface BadgeAchievement {
  badge_id: string
  badge_name: string
}

// Badge display variants
export type BadgeVariant = 'preview' | 'detailed' | 'dashboard'

// Badge statistics for users
export interface UserBadgeStats {
  total_earned: number
  total_available: number
  categories_completed: BadgeCategory[]
  recent_badges: UserBadge[]
  visible_badges: UserBadge[]
}
