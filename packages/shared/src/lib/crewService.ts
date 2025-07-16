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

    // Get member counts for each crew (including user_id to check for creators)
    const { data: memberCounts, error: countError } = await supabase
      .from('crew_members')
      .select('crew_id, user_id')
      .in('crew_id', crewIds)
      .eq('status', 'accepted')

    if (countError) {
      console.warn('Error fetching member counts:', countError)
    }

    // Count members per crew and track creator memberships
    const memberCountMap: Record<string, number> = {}
    const creatorMembershipMap: Record<string, boolean> = {}

    // Initialize maps
    crewsData.forEach(crew => {
      memberCountMap[crew.id] = 0
      creatorMembershipMap[crew.id] = false
    })

    // Process member counts and check for creator memberships
    memberCounts?.forEach(member => {
      memberCountMap[member.crew_id] = (memberCountMap[member.crew_id] || 0) + 1

      // Check if this member is the creator of their crew
      const crew = crewsData.find(c => c.id === member.crew_id)
      if (crew && member.user_id === crew.created_by) {
        creatorMembershipMap[crew.id] = true
      }
    })

    // Add member counts and user info to crews
    const crewsWithCounts = crewsData.map((crew: any) => {
      const memberCount = memberCountMap[crew.id] || 0
      const creatorAlreadyCounted = creatorMembershipMap[crew.id] || false
      // Add 1 for creator only if they're not already counted in crew_members
      const totalMembers = memberCount + (creatorAlreadyCounted ? 0 : 1)

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

    // Check if creator is already in crew_members table to avoid double counting
    const { data: creatorMembership } = await supabase
      .from('crew_members')
      .select('id')
      .eq('crew_id', crewId)
      .eq('user_id', data.created_by)
      .eq('status', 'accepted')
      .maybeSingle()

    // Add 1 for creator only if they're not already counted in crew_members
    const totalMembers = memberCount + (creatorMembership ? 0 : 1)

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

    // Check if creator is already in crew_members table
    const creatorInMembers = members?.find(m => m.user_id === crewData.created_by)

    if (creatorInMembers) {
      // Creator is already in crew_members table, use that entry but mark as creator
      uniqueMemberIds.add(crewData.created_by)
      const userProfile = userProfiles?.find(p => p.user_id === crewData.created_by)
      allMembers.push({
        ...creatorInMembers,
        user_profiles: userProfile,
        is_creator: true,
        role: 'host', // Override role to host for creator
      })
    } else {
      // Creator is NOT in crew_members table, add them manually
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
