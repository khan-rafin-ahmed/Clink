/**
 * RequireAge Guard Component
 * Wraps routes to enforce age verification before allowing access
 */

import { useState, useEffect, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { checkAgeVerificationStatus, setupAgeVerificationSync, type AgeVerificationStatus } from '@/lib/ageGate'
import { AgeGateModal } from './AgeGateModal'
import { FullPageSkeleton } from './SkeletonLoaders'

interface RequireAgeProps {
  children: ReactNode
}

export function RequireAge({ children }: RequireAgeProps) {
  const { user, loading: authLoading, isInitialized } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [ageStatus, setAgeStatus] = useState<AgeVerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Don't apply age gate to certain public routes
  const isPublicRoute = ['/not-allowed', '/auth/callback'].includes(location.pathname)

  // If this is a public route, render children directly
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Check age verification status
  const checkAgeStatus = async () => {
    try {
      setLoading(true)
      const status = await checkAgeVerificationStatus(user)
      setAgeStatus(status)

      // If user is under age, redirect immediately
      if (status.isUnderAge) {
        navigate('/not-allowed', { replace: true })
        return
      }

      // If user needs verification, show modal
      if (status.needsVerification) {
        setShowModal(true)
      } else {
        setShowModal(false)
      }
    } catch (error) {
      console.error('Error checking age status:', error)
      // On error, show modal to be safe
      setShowModal(true)
    } finally {
      setLoading(false)
    }
  }

  // Initial check when auth is ready
  useEffect(() => {
    if (isInitialized && !authLoading) {
      checkAgeStatus()
    }
  }, [user, isInitialized, authLoading])

  // Set up cross-tab synchronization
  useEffect(() => {
    const cleanup = setupAgeVerificationSync(() => {
      // Re-check age status when localStorage changes in other tabs
      if (isInitialized && !authLoading) {
        checkAgeStatus()
      }
    })

    return cleanup
  }, [isInitialized, authLoading])

  // Handle modal close (when age is confirmed)
  const handleModalClose = () => {
    setShowModal(false)
    // Re-check status to ensure it's updated
    checkAgeStatus()
  }

  // Show loading while auth or age verification is being determined
  if (!isInitialized || authLoading || loading) {
    return <FullPageSkeleton />
  }

  // Show modal if age verification is needed
  if (showModal && ageStatus?.needsVerification) {
    return <AgeGateModal isOpen={true} onClose={handleModalClose} />
  }

  // If user is verified or doesn't need verification, show children
  if (ageStatus?.isVerified || !ageStatus?.needsVerification) {
    return <>{children}</>
  }

  // Fallback to loading state
  return <FullPageSkeleton />
}

/**
 * Hook to get current age verification status
 * Useful for components that need to know the age verification state
 */
export function useAgeVerification() {
  const { user } = useAuth()
  const [ageStatus, setAgeStatus] = useState<AgeVerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkAgeVerificationStatus(user)
        setAgeStatus(status)
      } catch (error) {
        console.error('Error checking age verification:', error)
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [user])

  return {
    ageStatus,
    loading,
    isVerified: ageStatus?.isVerified || false,
    needsVerification: ageStatus?.needsVerification || false,
    isUnderAge: ageStatus?.isUnderAge || false,
    hasProfileAge: ageStatus?.hasProfileAge || false,
    profileAge: ageStatus?.profileAge
  }
}
