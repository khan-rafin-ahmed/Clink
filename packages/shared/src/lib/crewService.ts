import { supabase } from './supabase'
import type { Crew } from '../types'

/**
 * Platform-agnostic crew service
 * Handles crew data fetching and management across web and mobile
 */

/**
 * Get user's crews (where they are a member)
 */
export async function getUserCrews(userId?: string): Promise<Crew[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const targetUserId = userId || session?.user?.id
    
    if (!targetUserId) {
      return []
    }

    // Get crew IDs where the user is a member
    const { data: membershipData, error: membershipError } = await supabase
      .from('crew_members')
      .select('crew_id')
      .eq('user_id', targetUserId)
      .eq('status', 'accepted')

    if (membershipError) {
      throw membershipError
    }

    if (!membershipData?.length) {
      return []
    }

    const crewIds = membershipData.map(m => m.crew_id)

    // Get crew details
    const { data: crewsData, error: crewsError } = await supabase
      .from('crews')
      .select('*')
      .in('id', crewIds)
      .order('created_at', { ascending: false })

    if (crewsError) {
      throw crewsError
    }

    if (!crewsData?.length) {
      return []
    }

    // Get member counts for each crew
    const { data: memberCounts, error: countError } = await supabase
      .from('crew_members')
      .select('crew_id')
      .in('crew_id', crewIds)
      .eq('status', 'accepted')

    if (countError) {
      console.warn('Error fetching member counts:', countError)
    }

    // Count members per crew
    const memberCountMap: Record<string, number> = {}
    memberCounts?.forEach(member => {
      memberCountMap[member.crew_id] = (memberCountMap[member.crew_id] || 0) + 1
    })

    // Add member counts and user info to crews
    const crewsWithCounts = crewsData.map((crew: any) => {
      const memberCount = memberCountMap[crew.id] || 0
      // Add 1 for creator (creator is always counted as a member)
      const totalMembers = memberCount + 1

      return {
        ...crew,
        member_count: totalMembers,
        is_member: true, // User is always a member of their crews
        is_creator: crew.created_by === targetUserId,
      } as Crew
    })

    return crewsWithCounts
  } catch (error) {
    console.error('❌ Error in getUserCrews:', error)
    throw error
  }
}

/**
 * Get crew by ID with member count and user permissions
 */
export async function getCrewById(crewId: string): Promise<Crew | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id

    const { data, error } = await supabase
      .from('crews')
      .select('*')
      .eq('id', crewId)
      .single()

    if (error) {
      throw error
    }

    if (!data) {
      return null
    }

    // Get member count
    const { data: memberData, error: memberError } = await supabase
      .from('crew_members')
      .select('id')
      .eq('crew_id', crewId)
      .eq('status', 'accepted')

    if (memberError) {
      console.warn('Error fetching member count:', memberError)
    }

    const memberCount = memberData?.length || 0
    // Add 1 for creator (creator is always counted as a member)
    const totalMembers = memberCount + 1

    // Check if current user is a member
    let isMember = false
    if (userId) {
      const { data: userMemberData } = await supabase
        .from('crew_members')
        .select('id')
        .eq('crew_id', crewId)
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .maybeSingle()

      isMember = !!userMemberData || data.created_by === userId
    }

    return {
      ...data,
      member_count: totalMembers,
      is_member: isMember,
      is_creator: data.created_by === userId,
    }
  } catch (error) {
    console.error('❌ Error in getCrewById:', error)
    throw error
  }
}

/**
 * Get crew members
 */
export async function getCrewMembers(crewId: string): Promise<any[]> {
  try {
    // Get crew creator info
    const { data: crewData, error: crewError } = await supabase
      .from('crews')
      .select('created_by, created_at')
      .eq('id', crewId)
      .single()

    if (crewError) throw crewError

    // Get all accepted crew members WITHOUT problematic foreign key joins
    const { data: members, error } = await supabase
      .from('crew_members')
      .select('*')
      .eq('crew_id', crewId)
      .eq('status', 'accepted')
      .order('joined_at', { ascending: true })

    if (error) {
      throw error
    }

    // Get user profiles separately to avoid foreign key issues
    const memberUserIds = members?.map(m => m.user_id) || []
    const allUserIds = [...memberUserIds, crewData.created_by]

    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, nickname, avatar_url, username')
      .in('user_id', allUserIds)

    if (profilesError) {
      console.warn('Error fetching user profiles:', profilesError)
    }

    // Find creator profile
    const creatorProfile = userProfiles?.find(p => p.user_id === crewData.created_by)

    // Combine creator and members using the same logic as web app
    // Create a Set to track unique user IDs to avoid duplicates (same as web app)
    const uniqueMemberIds = new Set<string>()
    const allMembers = []

    // Always include the creator as a member (same as web app)
    if (creatorProfile) {
      uniqueMemberIds.add(crewData.created_by)
      allMembers.push({
        id: `creator-${crewData.created_by}`,
        crew_id: crewId,
        user_id: crewData.created_by,
        role: 'host',
        status: 'accepted',
        joined_at: crewData.created_at,
        user_profiles: creatorProfile,
        is_creator: true,
      })
    }

    // Add other members with their profiles (skip if already added as creator)
    if (members) {
      members.forEach(member => {
        if (!uniqueMemberIds.has(member.user_id)) {
          uniqueMemberIds.add(member.user_id)
          const userProfile = userProfiles?.find(p => p.user_id === member.user_id)
          allMembers.push({
            ...member,
            user_profiles: userProfile,
            is_creator: false,
          })
        }
      })
    }

    return allMembers
  } catch (error) {
    console.error('❌ Error in getCrewMembers:', error)
    throw error
  }
}
