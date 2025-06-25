import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { useSmartNavigation } from '@/hooks/useSmartNavigation'
import { getUserProfileByUsername } from '@/lib/userService'
import { getUserCrews } from '@/lib/crewService'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Users, Calendar } from 'lucide-react'
import { UserStats } from '@/components/UserStats'
import { CrewCard } from '@/components/CrewCard'
import { Simple404 } from '@/components/Simple404'
import type { UserProfile, Crew } from '@/types'

export function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuth()
  const { goBackSmart } = useSmartNavigation()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [crews, setCrews] = useState<Crew[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

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
    } catch (error) {
      setError(true)
    } finally {
      setLoading(false)
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={goBackSmart}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>

          {isOwnProfile && (
            <Link to="/profile/edit">
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
            </Link>
          )}
        </div>

        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {getAvatarFallback(profile)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl font-display font-bold text-foreground mb-2">
                  {getDisplayName(profile)}
                </h1>

                {profile.tagline && (
                  <p className="text-lg text-primary font-medium italic mb-3">
                    "{profile.tagline}"
                  </p>
                )}

                {profile.bio && (
                  <p className="text-muted-foreground mb-4 max-w-md">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {profile.favorite_drink && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      🍺 {profile.favorite_drink}
                    </Badge>
                  )}



                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Stats */}
        <UserStats className="max-w-2xl mx-auto mb-8" refreshTrigger={0} userId={profile.user_id} />

        {/* Crews Section */}
        {profile.show_crews_publicly && crews.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Crews ({crews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {crews.map((crew) => (
                  <CrewCard
                    key={crew.id}
                    crew={crew}
                    onCrewUpdated={() => {}}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy Notice */}
        {profile.profile_visibility !== 'public' && (
          <Card className="mt-8 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <Lock className="h-4 w-4" />
                <span className="text-sm">
                  {profile.profile_visibility === 'crew_only'
                    ? 'This profile is only visible to crew members'
                    : 'This profile has limited visibility'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
