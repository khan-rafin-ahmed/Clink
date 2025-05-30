export type RsvpStatus = 'going' | 'maybe' | 'not_going'
export type MemberStatus = 'pending' | 'accepted' | 'declined'

export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  favorite_drink: string | null
  tagline: string | null
  join_date: string | null
  created_at: string
  updated_at: string
}

export interface UserFollow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  follower?: UserProfile
  following?: UserProfile
}

export interface EventMember {
  id: string
  event_id: string
  user_id: string
  invited_by: string
  status: MemberStatus
  created_at: string
  updated_at: string
  user?: UserProfile
}

export interface Event {
  id: string
  title: string
  place_nickname?: string | null
  date_time: string
  location: string
  latitude?: number | null
  longitude?: number | null
  place_id?: string | null
  place_name?: string | null
  notes: string | null
  drink_type?: string
  vibe?: string
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  event_code?: string
  rsvps?: {
    id: string
    status: RsvpStatus
    user_id: string
    users: {
      email: string
    } | null
  }[]
  event_members?: EventMember[]
}

export interface LocationData {
  latitude: number
  longitude: number
  place_id: string
  place_name: string
  address?: string
}

export interface CreateEventDto {
  title: string
  date_time: string
  location: string
  latitude?: number | null
  longitude?: number | null
  place_id?: string | null
  place_name?: string | null
  notes: string | null
  drink_type?: string
  vibe?: string
  is_public: boolean
  created_by: string
}

export interface Crew {
  id: string
  name: string
  vibe: 'casual' | 'party' | 'chill' | 'wild' | 'classy' | 'other'
  visibility: 'public' | 'private'
  description?: string
  created_by: string
  created_at: string
  updated_at: string
  member_count?: number
  is_member?: boolean
  is_creator?: boolean
}

export interface CrewMember {
  id: string
  crew_id: string
  user_id: string
  status: 'pending' | 'accepted' | 'declined'
  invited_by?: string
  joined_at: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    display_name: string | null
    avatar_url: string | null
    email?: string
  }
}

export interface CreateCrewData {
  name: string
  vibe: 'casual' | 'party' | 'chill' | 'wild' | 'classy' | 'other'
  visibility: 'public' | 'private'
  description?: string
}