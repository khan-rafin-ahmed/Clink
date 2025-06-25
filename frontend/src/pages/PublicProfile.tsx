import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useSmartNavigation } from '@/hooks/useSmartNavigation'
import { getUserProfileByUsername } from '@/lib/userService'
import { getUserCrews } from '@/lib/crewService'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ProfileInfoCard } from '@/components/ProfileInfoCard'
import { ActivityTabs } from '@/components/ActivityTabs'
import { StatCard } from '@/components/StatCard'
import { NextEventBanner } from '@/components/NextEventBanner'
import { Simple404 } from '@/components/Simple404'
import { useUserStats } from '@/hooks/useUserStats'
import { supabase } from '@/lib/supabase'
import { filterEventsByDate } from '@/lib/eventUtils'
import type { UserProfile, Crew, Event } from '@/types'

// Helper function to get drink emoji and label
const getDrinkInfo = (drink: string | null | undefined) => {
  if (!drink) {
    return {
      emoji: '🍹',
      label: 'No favorite yet'
    }
  }

  const drinkMap: Record<string, { emoji: string; label: string }> = {
    beer: { emoji: '🍺', label: 'Beer' },
    wine: { emoji: '🍷', label: 'Wine' },
    cocktails: { emoji: '🍸', label: 'Cocktails' },
    whiskey: { emoji: '🥃', label: 'Whiskey' },
    vodka: { emoji: '🍸', label: 'Vodka' },
    rum: { emoji: '🍹', label: 'Rum' },
    gin: { emoji: '🍸', label: 'Gin' },
    tequila: { emoji: '🥃', label: 'Tequila' },
    champagne: { emoji: '🥂', label: 'Champagne' },
    sake: { emoji: '🍶', label: 'Sake' },
    other: { emoji: '🍻', label: 'Other' }
  }

  return drinkMap[drink.toLowerCase()] || { emoji: '🍻', label: drink }
}

export function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuth()
  const { goBackSmart } = useSmartNavigation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [crews, setCrews] = useState<Crew[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Use the same stats hook as UserProfile
  const stats = useUserStats(profile?.user_id || '')

  useEffect(() => {
    if (!username) {
      setError(true)
      setLoading(false)
      return
    }
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    if (!username) return

    try {
      const profileData = await getUserProfileByUsername(username)

      if (!profileData) {
        setError(true)
        return
      }

      // Simple privacy check
      if (profileData.profile_visibility === 'private' && currentUser?.id !== profileData.user_id) {
        setError(true)
        return
      }

      setProfile(profileData)

      // Load crews if public
      if (profileData.show_crews_publicly) {
        const userCrews = await getUserCrews(profileData.user_id)
        setCrews(userCrews || [])
      }

      // Load user events (public events only for other users)
      await loadUserEvents(profileData.user_id)
    } catch (error) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const loadUserEvents = async (userId: string) => {
    try {
      // For public profiles, only load public events
      const { data: eventsData, error } = await supabase
        .from('events')
        .select(`
          *,
          rsvps!inner(user_id, status),
          event_members!inner(user_id, status)
        `)
        .or(`created_by.eq.${userId},rsvps.user_id.eq.${userId},event_members.user_id.eq.${userId}`)
        .eq('is_public', true)
        .order('date_time', { ascending: false })

      if (error) throw error
      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error loading user events:', error)
      setEvents([])
    }
  }

  const getDisplayName = (profile: UserProfile): string => {
    return profile.display_name || 'Thirstee User'
  }

  const getAvatarFallback = (profile: UserProfile): string => {
    return profile.display_name?.charAt(0)?.toUpperCase() || 'U'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <img
            src="/thirstee-logo.svg"
            alt="Thirstee"
            className="h-16 w-auto mx-auto mb-4"
          />
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return <Simple404 username={username} />
  }

  if (!profile) {
    return null
  }

  const isOwnProfile = currentUser?.id === profile.user_id
  const displayName = getDisplayName(profile)
  const avatarFallback = getAvatarFallback(profile)

  // Filter events into upcoming and past
  const { upcoming: upcomingEvents, past: pastEvents } = filterEventsByDate(events)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between py-6">
          <Button variant="outline" size="sm" onClick={goBackSmart}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {isOwnProfile && (
            <Link to="/profile/edit">
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </Link>
          )}
        </div>

        {/* Hero Section - Same layout as UserProfile but without action buttons */}
        <div className="space-y-6">
          {/* Profile Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            <div className="flex">
              <div className="w-full">
                <ProfileInfoCard
                  userProfile={profile}
                  displayName={displayName}
                  avatarFallback={avatarFallback}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Next Event Banner - Only show for own profile */}
          {isOwnProfile && (
            <div>
              <NextEventBanner
                userId={profile.user_id}
                className="glass-modal rounded-3xl"
              />
            </div>
          )}

          {/* Stats Section */}
          <div className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                count={stats?.totalEvents}
                label="Sessions"
                loading={!stats}
              />
              <StatCard
                count={stats?.totalRSVPs}
                label="RSVPs"
                loading={!stats}
              />
              <StatCard
                count={crews.length}
                label="Crews"
                loading={!profile}
              />
              {(() => {
                const drinkInfo = getDrinkInfo(profile?.favorite_drink)
                return (
                  <StatCard
                    icon={drinkInfo.emoji}
                    label={drinkInfo.label}
                    className={!profile?.favorite_drink ? 'text-[#999999]' : ''}
                    loading={!profile}
                  />
                )
              })()}
            </div>
          </div>
        </div>

        {/* Activity Tabs - Same as UserProfile */}
        <div className="mt-8">
          <ActivityTabs
            upcomingEvents={upcomingEvents}
            pastEvents={pastEvents}
            userCrews={crews}
            showCrews={profile.show_crews_publicly}
            isOwnProfile={isOwnProfile}
            onEventEdit={() => {}} // No editing for public profiles
            onEventDelete={() => {}} // No deleting for public profiles
            onCrewEdit={() => {}} // No editing for public profiles
            onCrewDelete={() => {}} // No deleting for public profiles
          />
        </div>
      </div>
    </div>
  )
}
