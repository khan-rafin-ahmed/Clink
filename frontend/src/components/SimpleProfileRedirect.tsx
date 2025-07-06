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
  return <ProfileRedirectSkeleton />
}
