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
import { deleteEvent } from '@/lib/eventService'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Event } from '@/types'

interface DeleteEventDialogProps {
  event: Event
  open: boolean
  onOpenChange: (open: boolean) => void
  onEventDeleted: () => void
}

export function DeleteEventDialog({ event, open, onOpenChange, onEventDeleted }: DeleteEventDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      await deleteEvent(event.id)
      toast.success('Session deleted successfully! 🗑️')
      onOpenChange(false)
      onEventDeleted()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete session. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Delete Session? 🗑️
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete <strong>"{event.title}"</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All RSVPs and event data will be permanently removed.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Session'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
