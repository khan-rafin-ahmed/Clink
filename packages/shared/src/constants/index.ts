// App constants
export const APP_NAME = 'Thirstee'
export const APP_TAGLINE = 'Tap. Drink. Repeat.'

// Cache TTL values (in milliseconds)
export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,    // 1 minute
  MEDIUM: 5 * 60 * 1000,   // 5 minutes
  LONG: 15 * 60 * 1000,    // 15 minutes
  VERY_LONG: 60 * 60 * 1000 // 1 hour
} as const

// Event status
export const EVENT_STATUS = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  PAST: 'past'
} as const

// RSVP status
export const RSVP_STATUS = {
  GOING: 'going',
  MAYBE: 'maybe',
  NOT_GOING: 'not_going'
} as const

// Member status
export const MEMBER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined'
} as const

// User roles
export const USER_ROLES = {
  ATTENDEE: 'attendee',
  CO_HOST: 'co_host',
  HOST: 'host'
} as const

// Crew roles
export const CREW_ROLES = {
  MEMBER: 'member',
  CO_HOST: 'co_host',
  HOST: 'host'
} as const

// Profile visibility
export const PROFILE_VISIBILITY = {
  PUBLIC: 'public',
  CREW_ONLY: 'crew_only',
  PRIVATE: 'private'
} as const

// Crew visibility
export const CREW_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private'
} as const

// Vibes
export const VIBES = {
  CASUAL: 'casual',
  PARTY: 'party',
  CHILL: 'chill',
  WILD: 'wild',
  CLASSY: 'classy',
  OTHER: 'other'
} as const

// Duration types
export const DURATION_TYPES = {
  SPECIFIC_TIME: 'specific_time',
  ALL_NIGHT: 'all_night'
} as const

// Notification types
export const NOTIFICATION_TYPES = {
  EVENT_INVITATION: 'event_invitation',
  CREW_INVITATION: 'crew_invitation',
  EVENT_REMINDER: 'event_reminder',
  EVENT_UPDATE: 'event_update',
  CREW_UPDATE: 'crew_update',
  FOLLOW_REQUEST: 'follow_request',
  FOLLOW_ACCEPTED: 'follow_accepted'
} as const

// API endpoints
export const API_ENDPOINTS = {
  EVENTS: '/api/events',
  USERS: '/api/users',
  CREWS: '/api/crews',
  NOTIFICATIONS: '/api/notifications'
} as const

// File upload limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_IMAGES_PER_EVENT: 10
} as const

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_BIO_LENGTH: 500,
  MAX_EVENT_TITLE_LENGTH: 100,
  MAX_CREW_NAME_LENGTH: 50,
  MAX_USERNAME_LENGTH: 30,
  MIN_USERNAME_LENGTH: 3
} as const
