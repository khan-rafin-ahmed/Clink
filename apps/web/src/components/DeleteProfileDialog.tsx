import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import { deleteUserAccount } from '@/lib/deleteUserService'
import { toast } from 'sonner'
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react'

interface DeleteProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccountDeleted: () => void
}

export function DeleteProfileDialog({ open, onOpenChange, onAccountDeleted }: DeleteProfileDialogProps) {
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmationText, setConfirmationText] = useState('')
  const [step, setStep] = useState(1) // 1: Warning, 2: Confirmation

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const isConfirmationValid = confirmationText.toLowerCase() === 'delete'

  const handleDelete = async () => {
    if (!user || !isConfirmationValid) return

    try {
      setIsDeleting(true)
      await deleteUserAccount(user.id)
      toast.success('Your account has been permanently deleted. 👋')
      onOpenChange(false)
      onAccountDeleted()
    } catch (error: any) {
      console.error('Account deletion error:', error)
      toast.error(error.message || 'Failed to delete account. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      onOpenChange(false)
      // Reset state when closing
      setStep(1)
      setConfirmationText('')
    }
  }

  const nextStep = () => {
    setStep(2)
  }

  const prevStep = () => {
    setStep(1)
    setConfirmationText('')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                Delete Your Account? 🚨
              </DialogTitle>
              <DialogDescription className="space-y-4 text-base">
                <p className="font-medium text-foreground">
                  Hey {displayName}, are you sure you want to delete your Thirstee account?
                </p>
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-3">
                  <p className="font-medium text-destructive">⚠️ This action will permanently delete:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>• Your profile, bio, and all personal information</li>
                    <li>• All events you've created (attendees will be notified)</li>
                    <li>• Your RSVPs to other events</li>
                    <li>• Your crew memberships and created crews</li>
                    <li>• All your photos, comments, and ratings</li>
                    <li>• Your account login access</li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>This cannot be undone.</strong> Once deleted, you'll need to create a new account to use Thirstee again.
                </p>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={nextStep}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Continue to Delete
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                Final Confirmation
              </DialogTitle>
              <DialogDescription className="space-y-4 text-base">
                <p>
                  To confirm account deletion, please type <strong className="text-destructive">DELETE</strong> in the box below:
                </p>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="confirmation" className="text-sm font-medium">
                  Type "DELETE" to confirm:
                </Label>
                <Input
                  id="confirmation"
                  type="text"
                  placeholder="DELETE"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  disabled={isDeleting}
                  className="font-mono"
                  autoComplete="off"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={isDeleting}
              >
                Back
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting || !isConfirmationValid}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting Account...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete My Account Forever
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
