// Badge Service
// Simple service for badge CRUD operations using existing patterns

import { supabase } from './supabase'
import { notificationTriggers } from './notificationService'
import type { Badge, UserBadge, BadgeProgress, BadgeCategory, BadgeAchievement } from '@/types/badge'

export class BadgeService {
  // Badge catalog operations
  static async getAllBadges(): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('sort_order')

    if (error) {
      console.error('Error fetching badges:', error)
      throw error
    }

    return data || []
  }

  static async getBadgesByCategory(category: BadgeCategory): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .eq('category', category)
      .order('sort_order')

    if (error) {
      console.error('Error fetching badges by category:', error)
      throw error
    }

    return data || []
  }

  // User badge operations
  static async getUserBadges(userId: string): Promise<UserBadge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (error) {
      console.error('Error fetching user badges:', error)
      throw error
    }

    return data || []
  }

  static async getVisibleUserBadges(userId: string, limit?: number): Promise<UserBadge[]> {
    let query = supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)
      .eq('is_visible_on_profile', true)
      .order('display_order')

    // Apply limit if specified, otherwise get all visible badges
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching visible user badges:', error)
      throw error
    }

    return data || []
  }

  // Get all user badges (both visible and hidden) for profile display
  static async getAllUserBadges(userId: string, limit?: number): Promise<UserBadge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching all user badges:', error)
      throw error
    }

    // Sort badges by tier/rarity, then by earned date, then alphabetically
    const sortedBadges = (data || []).sort((a, b) => {
      // 1. Sort by tier/rarity (highest first)
      const tierOrder = { 'legendary': 4, 'epic': 3, 'rare': 2, 'common': 1 }
      const aTier = tierOrder[a.badge?.color_tier as keyof typeof tierOrder] || 0
      const bTier = tierOrder[b.badge?.color_tier as keyof typeof tierOrder] || 0

      if (aTier !== bTier) {
        return bTier - aTier // Higher tier first
      }

      // 2. Sort by earned date (most recent first)
      const aDate = new Date(a.earned_at).getTime()
      const bDate = new Date(b.earned_at).getTime()

      if (aDate !== bDate) {
        return bDate - aDate // More recent first
      }

      // 3. Sort alphabetically by name (tiebreaker)
      return (a.badge?.name || '').localeCompare(b.badge?.name || '')
    })

    // Apply limit if specified
    return limit ? sortedBadges.slice(0, limit) : sortedBadges
  }

  // Get starter badges for users with no earned badges
  static async getStarterBadges(): Promise<Badge[]> {
    const starterBadgeNames = [
      'First Sip',
      'Party Starter',
      'Crew Member',
      'Comment Commander I',
      'Photo Dropper I',
      'Thirstee OG'
    ]

    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .in('name', starterBadgeNames)
      .order('sort_order')

    if (error) {
      console.error('Error fetching starter badges:', error)
      return []
    }

    return data || []
  }

  static async updateBadgeVisibility(userId: string, badgeId: string, visible: boolean): Promise<void> {
    const { error } = await supabase
      .from('user_badges')
      .update({ is_visible_on_profile: visible })
      .eq('user_id', userId)
      .eq('badge_id', badgeId)

    if (error) {
      console.error('Error updating badge visibility:', error)
      throw error
    }
  }

  static async resetBadgesToDefault(userId: string): Promise<void> {
    // First, hide all badges
    await supabase
      .from('user_badges')
      .update({ is_visible_on_profile: false })
      .eq('user_id', userId)

    // Then show the 4 most recent badges
    const { data: recentBadges } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(4)

    if (recentBadges && recentBadges.length > 0) {
      const badgeIds = recentBadges.map(b => b.id)
      
      const { error } = await supabase
        .from('user_badges')
        .update({ is_visible_on_profile: true })
        .in('id', badgeIds)

      if (error) {
        console.error('Error resetting badges to default:', error)
        throw error
      }
    }
  }

  // Achievement checking with notifications (for new badges earned through activity)
  static async checkAndAwardBadges(userId: string): Promise<BadgeAchievement[]> {
    return this.checkAndAwardBadgesInternal(userId, true)
  }

  // Achievement checking without notifications (for retroactive/migration purposes)
  static async checkAndAwardBadgesSilent(userId: string): Promise<BadgeAchievement[]> {
    return this.checkAndAwardBadgesInternal(userId, false)
  }

  // Internal method that handles both notification and silent badge checking
  private static async checkAndAwardBadgesInternal(userId: string, sendNotifications: boolean): Promise<BadgeAchievement[]> {
    const { data, error } = await supabase
      .rpc('check_and_award_badges', { user_id_param: userId })

    if (error) {
      console.error('Error checking and awarding badges:', error)
      throw error
    }

    const achievements = data || []

    // Send notifications for newly earned badges (only if requested)
    if (sendNotifications && achievements.length > 0) {
      const allBadges = await this.getAllBadges()
      const badgeMap = new Map(allBadges.map(b => [b.id, b]))

      for (const achievement of achievements) {
        const badge = badgeMap.get(achievement.badge_id)
        if (badge) {
          try {
            await notificationTriggers.onBadgeEarned(
              userId,
              badge.name,
              badge.description
            )
          } catch (notificationError) {
            console.error('Error sending badge notification:', notificationError)
            // Don't throw - badge was still earned
          }
        }
      }
    }

    return achievements
  }

  // Progress tracking
  static async getBadgeProgress(userId: string): Promise<BadgeProgress[]> {
    const { data, error } = await supabase
      .from('badge_progress')
      .select(`
        *,
        badge:badges(*)
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching badge progress:', error)
      throw error
    }

    return data || []
  }

  static async updateProgress(userId: string, badgeId: string, progress: number): Promise<void> {
    const { error } = await supabase
      .from('badge_progress')
      .upsert({
        user_id: userId,
        badge_id: badgeId,
        current_progress: progress,
        last_updated: new Date().toISOString()
      })

    if (error) {
      console.error('Error updating badge progress:', error)
      throw error
    }
  }

  // Utility functions
  static async getUserBadgeStats(userId: string) {
    const [userBadges, allBadges] = await Promise.all([
      this.getUserBadges(userId),
      this.getAllBadges()
    ])

    const visibleBadges = userBadges.filter(ub => ub.is_visible_on_profile)
    const recentBadges = userBadges.slice(0, 4)
    
    // Get completed categories
    const earnedCategories = new Set(
      userBadges.map(ub => ub.badge?.category).filter(Boolean)
    )

    return {
      total_earned: userBadges.length,
      total_available: allBadges.length,
      categories_completed: Array.from(earnedCategories),
      recent_badges: recentBadges,
      visible_badges: visibleBadges
    }
  }

  // Get badges user hasn't earned yet (for progress display)
  static async getUnlockedBadges(userId: string): Promise<Badge[]> {
    const userBadges = await this.getUserBadges(userId)
    const allBadges = await this.getAllBadges()
    
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id))
    
    return allBadges.filter(badge => !earnedBadgeIds.has(badge.id))
  }

  // Achievement triggers for common user actions
  static async triggerAchievementCheck(userId: string, action: 'event_join' | 'event_host' | 'crew_join'): Promise<void> {
    try {
      const achievements = await this.checkAndAwardBadges(userId)
      console.log(`Badge check triggered for ${action}:`, achievements.length, 'new badges earned')
    } catch (error) {
      console.error('Error in achievement trigger:', error)
      // Don't throw - this is a background process
    }
  }

  // Manual comprehensive badge check (bypasses incomplete database function)
  static async runComprehensiveBadgeCheck(userId: string): Promise<BadgeAchievement[]> {
    try {
      const allBadges = await this.getAllBadges()
      const userBadges = await this.getUserBadges(userId)
      const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id))

      const newAchievements: BadgeAchievement[] = []

      // Get user activity data
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!userProfile) return []

      // Get detailed event data with joins (both attended and hosted)
      const { data: attendedEvents } = await supabase
        .from('event_members')
        .select(`
          *,
          events (
            id,
            title,
            date_time,
            end_time,
            drink_type,
            created_by
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'going')

      // Get hosted events (hosts are considered participants)
      const { data: hostedEventsDetailed } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', userId)

      // Combine attended and hosted events for participation count
      const allUserEvents = [
        ...(attendedEvents || []),
        ...(hostedEventsDetailed || []).map(event => ({
          events: event,
          user_id: userId,
          status: 'going' // Hosts are always considered "going"
        }))
      ]

      const eventCount = allUserEvents.length

      // Get hosting count
      const { data: hostedEvents } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', userId)

      const hostCount = hostedEvents?.length || 0

      // Get crew count
      const { data: crewMemberships } = await supabase
        .from('crew_members')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'accepted')

      const crewCount = crewMemberships?.length || 0

      // Get co-host roles
      const { data: coHostRoles } = await supabase
        .from('event_members')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'co_host')

      const coHostCount = coHostRoles?.length || 0

      // Process events for complex calculations
      const eventsByDate = new Map<string, any[]>()
      const eventsByDrinkType = new Map<string, number>()
      const eventsByDay = new Map<string, number>()
      let liveEventCount = 0
      let midnightMischiefCount = 0

      allUserEvents?.forEach(eventMember => {
        const event = eventMember.events
        if (!event) return

        const eventDate = new Date(event.date_time)
        const dateKey = eventDate.toISOString().split('T')[0]

        // Group by date for same-day events
        if (!eventsByDate.has(dateKey)) {
          eventsByDate.set(dateKey, [])
        }
        eventsByDate.get(dateKey)!.push(event)

        // Count by drink type
        if (event.drink_type) {
          eventsByDrinkType.set(event.drink_type, (eventsByDrinkType.get(event.drink_type) || 0) + 1)
        }

        // Count by day of week
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        eventsByDay.set(dayName, (eventsByDay.get(dayName) || 0) + 1)

        // Check for live events (ongoing)
        const now = new Date()
        if (eventDate <= now && (!event.end_time || new Date(event.end_time) >= now)) {
          liveEventCount++
        }

        // Check for Midnight Mischief events
        if (event.title && event.title.toLowerCase().includes('midnight mischief')) {
          midnightMischiefCount++
        }
      })

      // Check for same day events
      let sameDayEventsCount = 0
      eventsByDate.forEach(events => {
        if (events.length >= 2) {
          sameDayEventsCount++
        }
      })

      console.log('=== BADGE CHECKING DEBUG ===')
      console.log('Total badges to check:', allBadges.length)
      console.log('Already earned:', earnedBadgeIds.size)
      console.log('Event count:', eventCount)
      console.log('Same day events count:', sameDayEventsCount)
      console.log('Events by drink type:', Object.fromEntries(eventsByDrinkType))
      console.log('Events by day:', Object.fromEntries(eventsByDay))

      // Check each badge
      for (const badge of allBadges) {
        if (earnedBadgeIds.has(badge.id)) {
          console.log(`Skipping ${badge.name} - already earned`)
          continue
        }

        let eligible = false

        // Check badge criteria
        switch (badge.unlock_criteria.type) {
          case 'event_count':
            eligible = eventCount >= Number(badge.unlock_criteria.target)
            break

          case 'host_count':
            eligible = hostCount >= Number(badge.unlock_criteria.target)
            break

          case 'crew_join':
            eligible = crewCount >= Number(badge.unlock_criteria.target)
            break

          case 'days_active':
            const daysSinceCreation = Math.floor((Date.now() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24))
            eligible = daysSinceCreation >= Number(badge.unlock_criteria.target)
            console.log(`Checking age badge ${badge.name}: ${daysSinceCreation} days >= ${badge.unlock_criteria.target} - ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`)
            break

          case 'drink_type':
            const drinkType = badge.unlock_criteria.conditions?.drink
            if (drinkType) {
              const count = eventsByDrinkType.get(drinkType) || 0
              eligible = count >= Number(badge.unlock_criteria.target)
              console.log(`Checking drink badge ${badge.name}: ${drinkType} = ${count}/${badge.unlock_criteria.target} - ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`)
            }
            break

          case 'day_events':
            const dayName = badge.unlock_criteria.conditions?.day
            if (dayName) {
              const count = eventsByDay.get(dayName.toLowerCase()) || 0
              eligible = count >= Number(badge.unlock_criteria.target)
              console.log(`Checking day badge ${badge.name}: ${dayName} = ${count}/${badge.unlock_criteria.target} - ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`)
            }
            break

          case 'live_event':
            eligible = liveEventCount >= Number(badge.unlock_criteria.target)
            break

          case 'same_day_events':
            eligible = sameDayEventsCount >= Number(badge.unlock_criteria.target)
            console.log(`Checking same day badge ${badge.name}: ${sameDayEventsCount} >= ${badge.unlock_criteria.target} - ${eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`)
            break

          case 'event_title':
            eligible = midnightMischiefCount >= 1
            break

          case 'role_promotion':
            eligible = coHostCount >= Number(badge.unlock_criteria.target)
            break

          case 'event_attendees':
            // Check if user has hosted events with 5+ attendees
            if (hostedEvents && hostedEvents.length > 0) {
              for (const event of hostedEvents) {
                const { data: attendees } = await supabase
                  .from('event_members')
                  .select('id')
                  .eq('event_id', event.id)
                  .eq('status', 'going')

                if (attendees && attendees.length >= Number(badge.unlock_criteria.target)) {
                  eligible = true
                  break
                }
              }
            }
            break
        }

        if (eligible) {
          console.log(`✅ ELIGIBLE: ${badge.name} - attempting to award...`)

          // For now, just track eligible badges without inserting
          // We'll use the database function approach instead
          newAchievements.push({
            badge_id: badge.id,
            badge_name: badge.name
          })
          console.log(`✅ MARKED FOR AWARD: ${badge.name}`)
        } else {
          console.log(`❌ NOT ELIGIBLE: ${badge.name}`)
        }
      }

      // Now actually award the eligible badges using the new award_single_badge function
      if (newAchievements.length > 0) {
        console.log(`🏅 Found ${newAchievements.length} eligible badges, attempting to award individually...`)

        let actuallyAwarded = 0

        for (const achievement of newAchievements) {
          try {
            const { data: awarded, error: awardError } = await supabase
              .rpc('award_single_badge', {
                p_user_id: userId,
                p_badge_id: achievement.badge_id
              })

            if (awardError) {
              console.error(`❌ Error awarding ${achievement.badge_name}:`, awardError)
            } else if (awarded) {
              console.log(`✅ Successfully awarded: ${achievement.badge_name}`)
              actuallyAwarded++
            } else {
              console.log(`⚠️ Badge ${achievement.badge_name} already exists or failed to award`)
            }
          } catch (error) {
            console.error(`❌ Exception awarding ${achievement.badge_name}:`, error)
          }
        }

        console.log(`🎉 Total badges actually awarded: ${actuallyAwarded}/${newAchievements.length}`)
      }

      return newAchievements
    } catch (error) {
      console.error('Error in comprehensive badge check:', error)
      throw error
    }
  }

  // Silent version of comprehensive badge check (no console logging, for batch processing)
  static async runComprehensiveBadgeCheckSilent(userId: string): Promise<BadgeAchievement[]> {
    try {
      const allBadges = await this.getAllBadges()
      const userBadges = await this.getUserBadges(userId)
      const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id))

      const newAchievements: BadgeAchievement[] = []

      // Get user activity data
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!userProfile) return []

      // Get detailed event data with joins (both attended and hosted)
      const { data: attendedEvents } = await supabase
        .from('event_members')
        .select(`
          *,
          events (
            id,
            title,
            date_time,
            end_time,
            drink_type,
            created_by
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'going')

      // Get hosted events (hosts are considered participants)
      const { data: hostedEventsDetailed } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', userId)

      // Combine attended and hosted events for participation count
      const allUserEvents = [
        ...(attendedEvents || []),
        ...(hostedEventsDetailed || []).map(event => ({
          events: event,
          user_id: userId,
          status: 'going' // Hosts are always considered "going"
        }))
      ]

      const eventCount = allUserEvents.length

      // Get hosting count
      const { data: hostedEvents } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', userId)

      const hostCount = hostedEvents?.length || 0

      // Get crew count
      const { data: crewMemberships } = await supabase
        .from('crew_members')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'accepted')

      const crewCount = crewMemberships?.length || 0

      // Get co-host roles
      const { data: coHostRoles } = await supabase
        .from('event_members')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'co_host')

      const coHostCount = coHostRoles?.length || 0

      // Process events for complex calculations
      const eventsByDate = new Map<string, any[]>()
      const eventsByDrinkType = new Map<string, number>()
      const eventsByDay = new Map<string, number>()
      let liveEventCount = 0
      let midnightMischiefCount = 0

      allUserEvents?.forEach(eventMember => {
        const event = eventMember.events
        if (!event) return

        const eventDate = new Date(event.date_time)
        const dateKey = eventDate.toISOString().split('T')[0]

        // Group by date for same-day events
        if (!eventsByDate.has(dateKey)) {
          eventsByDate.set(dateKey, [])
        }
        eventsByDate.get(dateKey)!.push(event)

        // Count by drink type
        if (event.drink_type) {
          eventsByDrinkType.set(event.drink_type, (eventsByDrinkType.get(event.drink_type) || 0) + 1)
        }

        // Count by day of week
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        eventsByDay.set(dayName, (eventsByDay.get(dayName) || 0) + 1)

        // Check for live events (ongoing)
        const now = new Date()
        if (eventDate <= now && (!event.end_time || new Date(event.end_time) >= now)) {
          liveEventCount++
        }

        // Check for Midnight Mischief events
        if (event.title && event.title.toLowerCase().includes('midnight mischief')) {
          midnightMischiefCount++
        }
      })

      // Check for same day events
      let sameDayEventsCount = 0
      eventsByDate.forEach(events => {
        if (events.length >= 2) {
          sameDayEventsCount++
        }
      })

      // Check each badge (silent - no logging)
      for (const badge of allBadges) {
        if (earnedBadgeIds.has(badge.id)) continue

        let eligible = false

        // Check badge criteria
        switch (badge.unlock_criteria.type) {
          case 'event_count':
            eligible = eventCount >= Number(badge.unlock_criteria.target)
            break

          case 'host_count':
            eligible = hostCount >= Number(badge.unlock_criteria.target)
            break

          case 'crew_join':
            eligible = crewCount >= Number(badge.unlock_criteria.target)
            break

          case 'days_active':
            const daysSinceCreation = Math.floor((Date.now() - new Date(userProfile.created_at).getTime()) / (1000 * 60 * 60 * 24))
            eligible = daysSinceCreation >= Number(badge.unlock_criteria.target)
            break

          case 'drink_type':
            const drinkType = badge.unlock_criteria.conditions?.drink
            if (drinkType) {
              const count = eventsByDrinkType.get(drinkType) || 0
              eligible = count >= Number(badge.unlock_criteria.target)
            }
            break

          case 'day_events':
            const dayName = badge.unlock_criteria.conditions?.day
            if (dayName) {
              const count = eventsByDay.get(dayName.toLowerCase()) || 0
              eligible = count >= Number(badge.unlock_criteria.target)
            }
            break

          case 'live_event':
            eligible = liveEventCount >= Number(badge.unlock_criteria.target)
            break

          case 'same_day_events':
            eligible = sameDayEventsCount >= Number(badge.unlock_criteria.target)
            break

          case 'event_title':
            eligible = midnightMischiefCount >= 1
            break

          case 'role_promotion':
            eligible = coHostCount >= Number(badge.unlock_criteria.target)
            break

          case 'event_attendees':
            // Check if user has hosted events with 5+ attendees
            if (hostedEvents && hostedEvents.length > 0) {
              for (const event of hostedEvents) {
                const { data: attendees } = await supabase
                  .from('event_members')
                  .select('id')
                  .eq('event_id', event.id)
                  .eq('status', 'going')

                if (attendees && attendees.length >= Number(badge.unlock_criteria.target)) {
                  eligible = true
                  break
                }
              }
            }
            break
        }

        if (eligible) {
          newAchievements.push({
            badge_id: badge.id,
            badge_name: badge.name
          })
        }
      }

      // Award the eligible badges silently
      if (newAchievements.length > 0) {
        for (const achievement of newAchievements) {
          try {
            await supabase
              .rpc('award_single_badge', {
                p_user_id: userId,
                p_badge_id: achievement.badge_id
              })
          } catch (error) {
            // Silent - don't log errors for batch processing
          }
        }
      }

      return newAchievements
    } catch (error) {
      // Silent - don't log errors for batch processing
      return []
    }
  }

  // Debug method to show user activity stats
  static async debugUserActivity(userId: string): Promise<any> {
    try {
      // Get user profile
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Get detailed event data (both attended and hosted)
      const { data: attendedEvents } = await supabase
        .from('event_members')
        .select(`
          *,
          events (
            id,
            title,
            date_time,
            end_time,
            drink_type,
            created_by
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'going')

      // Get hosted events details
      const { data: hostedEventsDetailed } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', userId)

      // Combine for total participation
      const allUserEvents = [
        ...(attendedEvents || []),
        ...(hostedEventsDetailed || []).map(event => ({
          events: event,
          user_id: userId,
          status: 'going'
        }))
      ]

      // Get hosted events
      const { data: hostedEvents } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', userId)

      // Get crew memberships
      const { data: crewMemberships } = await supabase
        .from('crew_members')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'accepted')

      // Process events for analysis
      const eventsByDate = new Map<string, any[]>()
      const eventsByDrinkType = new Map<string, number>()
      const eventsByDay = new Map<string, number>()
      let liveEventCount = 0

      allUserEvents?.forEach(eventMember => {
        const event = eventMember.events
        if (!event) return

        const eventDate = new Date(event.date_time)
        const dateKey = eventDate.toISOString().split('T')[0]

        // Group by date
        if (!eventsByDate.has(dateKey)) {
          eventsByDate.set(dateKey, [])
        }
        eventsByDate.get(dateKey)!.push(event)

        // Count by drink type
        if (event.drink_type) {
          eventsByDrinkType.set(event.drink_type, (eventsByDrinkType.get(event.drink_type) || 0) + 1)
        }

        // Count by day of week
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        eventsByDay.set(dayName, (eventsByDay.get(dayName) || 0) + 1)

        // Check for live events
        const now = new Date()
        if (eventDate <= now && (!event.end_time || new Date(event.end_time) >= now)) {
          liveEventCount++
        }
      })

      // Find same day events
      const sameDayEvents = Array.from(eventsByDate.entries())
        .filter(([, events]) => events.length >= 2)
        .map(([date, events]) => ({ date, count: events.length, events: events.map(e => e.title) }))

      return {
        username: userProfile?.username,
        totalEventsParticipated: allUserEvents?.length || 0, // Combined attended + hosted
        totalEventsAttendedOnly: attendedEvents?.length || 0, // Just attended
        totalEventsHosted: hostedEvents?.length || 0,
        totalCrewsJoined: crewMemberships?.length || 0,
        accountAge: Math.floor((Date.now() - new Date(userProfile?.created_at || 0).getTime()) / (1000 * 60 * 60 * 24)),
        liveEventsAttended: liveEventCount,
        sameDayEvents: sameDayEvents,
        eventsByDrinkType: Object.fromEntries(eventsByDrinkType),
        eventsByDay: Object.fromEntries(eventsByDay),
        recentEvents: allUserEvents?.slice(0, 5).map(em => ({
          title: em.events?.title,
          date: em.events?.date_time,
          drinkType: em.events?.drink_type,
          isHosted: em.events?.created_by === userId
        }))
      }
    } catch (error) {
      console.error('Error in debug user activity:', error)
      throw error
    }
  }

  // Run comprehensive badge check for all users (for migration/testing purposes)
  static async runBadgeCheckForAllUsers(): Promise<{ usersProcessed: number; totalBadgesAwarded: number }> {
    try {
      console.log('🚀 Starting comprehensive badge check for all users...')

      // Get all user IDs
      const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('user_id, username')
        .not('user_id', 'is', null)

      if (usersError) {
        console.error('Error fetching users:', usersError)
        throw usersError
      }

      if (!users || users.length === 0) {
        return { usersProcessed: 0, totalBadgesAwarded: 0 }
      }

      console.log(`📊 Found ${users.length} users to process`)

      let totalBadgesAwarded = 0
      let usersProcessed = 0

      // Process users in smaller batches to avoid overwhelming the database
      const batchSize = 5 // Reduced batch size for comprehensive checking
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize)

        console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(users.length/batchSize)}`)

        const batchPromises = batch.map(async (user) => {
          try {
            console.log(`🔍 Checking badges for user: ${user.username || user.user_id}`)

            // Use the comprehensive badge check (without notifications)
            const achievements = await this.runComprehensiveBadgeCheckSilent(user.user_id)

            console.log(`✅ User ${user.username || user.user_id}: ${achievements.length} badges awarded`)
            return achievements.length
          } catch (error) {
            console.error(`❌ Error checking badges for user ${user.username || user.user_id}:`, error)
            return 0
          }
        })

        const batchResults = await Promise.all(batchPromises)
        const batchTotal = batchResults.reduce((sum, count) => sum + count, 0)
        totalBadgesAwarded += batchTotal
        usersProcessed += batch.length

        console.log(`📈 Batch complete: ${batchTotal} badges awarded to ${batch.length} users`)

        // Longer delay between batches for comprehensive checking
        if (i + batchSize < users.length) {
          console.log('⏳ Waiting 2 seconds before next batch...')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      console.log(`🎉 Comprehensive badge check complete! ${totalBadgesAwarded} total badges awarded to ${usersProcessed} users`)
      return { usersProcessed, totalBadgesAwarded }
    } catch (error) {
      console.error('Error in runBadgeCheckForAllUsers:', error)
      throw error
    }
  }
}
