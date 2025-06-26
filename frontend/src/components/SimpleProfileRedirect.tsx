import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { getUserProfile } from '@/lib/userService'
import { ProfileRedirectSkeleton } from '@/components/SkeletonLoaders'

export function SimpleProfileRedirect() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      navigate('/login')
      return
    }

    // Get username and redirect
    getUserProfile(user.id).then(profile => {
      if (profile?.username) {
        navigate(`/profile/${profile.username}`, { replace: true })
      } else {
        navigate('/profile/edit', { replace: true })
      }
    }).catch(() => {
      navigate('/profile/edit', { replace: true })
    })
  }, [user, loading, navigate])

  // Show glassmorphism skeleton loader while redirecting
  return (
    <div className="relative">
      <ProfileRedirectSkeleton />

      {/* Subtle loading indicator overlay */}
      <div className="fixed top-4 right-4 z-50">
        <div className="glass-modal rounded-full px-4 py-2 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading profile...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
