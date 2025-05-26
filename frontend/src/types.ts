export type RsvpStatus = 'going' | 'maybe' | 'not_going'
export type MemberStatus = 'pending' | 'accepted' | 'declined'

export interface UserProfile {
  id: string
  user_id: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
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
  date_time: string
  location: string
  notes: string | null
  drink_type?: string
  vibe?: string
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
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

export interface CreateEventDto {
  title: string
  date_time: string
  location: string
  notes: string | null
  drink_type?: string
  vibe?: string
  is_public: boolean
  created_by: string
}