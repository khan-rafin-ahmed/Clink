/**
 * Utility functions for handling event cover images
 */

export type EventVibe = 'casual' | 'party' | 'shots' | 'chill' | 'wild' | 'classy' | 'other'

/**
 * Maps event vibes to their corresponding default cover image paths
 */
export const VIBE_COVER_IMAGES: Record<EventVibe, string> = {
  casual: '/assets/covers/Casual Hang.webp',
  party: '/assets/covers/Party Mode.webp',
  shots: '/assets/covers/Shots Night.webp',
  chill: '/assets/covers/Chill Vibes.webp',
  wild: '/assets/covers/Wild Night.webp',
  classy: '/assets/covers/Classy Evening.webp',
  other: '/assets/covers/default-event-cover.webp'
}

/**
 * Gets the default cover image URL for a given vibe
 * @param vibe - The event vibe
 * @returns The cover image URL
 */
export function getDefaultCoverImage(vibe?: string): string {
  if (!vibe || !(vibe in VIBE_COVER_IMAGES)) {
    return VIBE_COVER_IMAGES.other
  }
  return VIBE_COVER_IMAGES[vibe as EventVibe]
}

/**
 * Determines the cover image URL to use for an event
 * Priority: custom uploaded image > default vibe image > fallback
 * @param customCoverUrl - Custom uploaded cover image URL
 * @param vibe - Event vibe
 * @returns The cover image URL to use
 */
export function getEventCoverImage(customCoverUrl?: string | null, vibe?: string | null): string {
  if (customCoverUrl) {
    return customCoverUrl
  }
  return getDefaultCoverImage(vibe || undefined)
}

/**
 * Generates CSS gradient backgrounds as fallback for missing images
 * @param vibe - Event vibe
 * @returns CSS gradient class string
 */
export function getVibeFallbackGradient(vibe?: string | null): string {
  const gradients: Record<EventVibe, string> = {
    casual: 'from-green-500/20 to-blue-500/20',
    party: 'from-red-500/20 to-pink-500/20',
    shots: 'from-amber-600/20 to-orange-500/20',
    chill: 'from-blue-500/20 to-purple-500/20',
    wild: 'from-purple-600/20 to-red-500/20',
    classy: 'from-amber-500/20 to-yellow-500/20',
    other: 'from-gray-500/20 to-slate-500/20'
  }

  if (!vibe || !(vibe in gradients)) {
    return gradients.other
  }
  return gradients[vibe as EventVibe]
}

/**
 * Gets the emoji associated with each vibe for overlay display
 * @param vibe - Event vibe
 * @returns Emoji string
 */
export function getVibeEmoji(vibe?: string | null): string {
  const emojis: Record<EventVibe, string> = {
    casual: '😎',
    party: '🎉',
    shots: '🥃',
    chill: '🌙',
    wild: '🔥',
    classy: '🥂',
    other: '✨'
  }

  if (!vibe || !(vibe in emojis)) {
    return emojis.other
  }
  return emojis[vibe as EventVibe]
}
