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
  profile_visibility?: 'public' | 'crew_only' | 'private'
  show_crews_publicly?: boolean
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
  public_slug?: string | null
  private_slug?: string | null
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
  average_rating?: number
  total_ratings?: number
}

export interface EventWithRsvps {
  id: string
  created_by: string
  title: string
  date_time: string
  is_public: boolean
  drink_type?: string | null
  vibe?: string | null
  notes?: string | null
  latitude?: number | null
  longitude?: number | null
  place_nickname?: string | null
  place_name?: string | null
  location?: string | null
  place_id?: string | null
  rsvps: Array<{
    id: string
    status: RsvpStatus
    user_id: string
  }>
  event_members?: Array<{
    id: string
    status: string
    user_id: string
  }>
  host?: {
    id: string
    display_name: string | null
    avatar_url: string | null
  }
  end_time?: string
  average_rating?: number
  total_ratings?: number
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

export interface EventPhoto {
  id: string
  event_id: string
  uploaded_by: string
  photo_url: string
  storage_path: string
  caption: string | null
  created_at: string
  updated_at: string
  uploader?: {
    display_name: string | null
    avatar_url: string | null
  }
}

export interface EventComment {
  id: string
  event_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user?: {
    display_name: string | null
    avatar_url: string | null
  }
  reactions?: EventCommentReaction[]
}

export interface EventCommentReaction {
  id: string
  comment_id: string
  user_id: string
  reaction: '🍻' | '🙌' | '🤘' | '🥴' | '😂' | '❤️' | '🔥'
  created_at: string
}

export interface EventRating {
  id: string
  event_id: string
  user_id: string
  rating: number
  feedback_text?: string | null
  created_at: string
  updated_at: string
  user?: {
    display_name: string | null
    avatar_url: string | null
  }
}