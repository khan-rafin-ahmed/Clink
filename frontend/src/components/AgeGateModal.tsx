/**
 * Age Gate Modal Component
 * Displays age verification modal for Thirstee app
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { setAgeVerification, clearAgeVerification } from '@/lib/ageGate'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

interface AgeGateModalProps {
  isOpen: boolean
  onClose?: () => void
}

export function AgeGateModal({ isOpen, onClose }: AgeGateModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleConfirmAge = async () => {
    setIsProcessing(true)
    try {
      // Set age verification in localStorage
      setAgeVerification()
      
      // Close modal and allow access
      if (onClose) {
        onClose()
      }
      
      toast.success('Welcome to Thirstee! 🍻')
    } catch (error) {
      console.error('Error confirming age:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDenyAge = async () => {
    setIsProcessing(true)
    try {
      // Clear any existing verification
      clearAgeVerification()
      
      // Sign out user if they're logged in
      await signOut()
      
      // Redirect to not-allowed page
      navigate('/not-allowed', { replace: true })
    } catch (error) {
      console.error('Error handling age denial:', error)
      // Still redirect even if signout fails
      navigate('/not-allowed', { replace: true })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogOverlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-sm translate-x-[-50%] translate-y-[-50%] gap-6 border border-border bg-card p-8 shadow-2xl duration-200 sm:rounded-2xl">
        <div className="flex flex-col space-y-6 text-center">
          {/* Logo/Icon */}
          <div className="mx-auto">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-3xl">
              🍻
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-foreground">
              Are you 18 or older?
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You must be at least 18 years old to use Thirstee. This app is designed for adults attending drinking events.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col space-y-3">
            <Button
              onClick={handleConfirmAge}
              disabled={isProcessing}
              className="w-full bg-gradient-primary hover:opacity-90 text-black font-semibold py-3 text-base"
              aria-label="I am 18 or older"
            >
              {isProcessing ? 'Processing...' : 'Yes, I am 18+'}
            </Button>

            <Button
              onClick={handleDenyAge}
              disabled={isProcessing}
              variant="outline"
              className="w-full border-2 border-red-500/50 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500 text-red-400 hover:text-red-300 py-3 text-base font-medium transition-all duration-200"
              aria-label="I am under 18"
            >
              {isProcessing ? 'Processing...' : "No, I'm under 18"}
            </Button>
          </div>

          {/* Legal disclaimer */}
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            By clicking "Yes, I am 18+", you confirm that you are of legal drinking age in your jurisdiction and agree to use this app responsibly.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Simplified Age Gate Modal for testing
 */
export function SimpleAgeGateModal({ isOpen, onConfirm, onDeny }: {
  isOpen: boolean
  onConfirm: () => void
  onDeny: () => void
}) {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogOverlay className="fixed inset-0 bg-black/70 z-50" />
      <DialogContent className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] bg-white p-6 shadow-lg sm:rounded-2xl">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Are you 18 or older?</h2>
          <p className="text-gray-600">You must be at least 18 to use Thirstee.</p>
          <div className="flex justify-between space-x-3">
            <Button
              onClick={onDeny}
              variant="outline"
              className="flex-1 border-2 border-red-500/50 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500 text-red-600 hover:text-red-500 font-medium transition-all duration-200"
              aria-label="I am under 18"
            >
              No, I'm under 18
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold transition-all duration-200"
              aria-label="I am 18 or older"
            >
              Yes, I am 18+
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
