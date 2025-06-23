import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { deleteEvent } from '@/lib/eventService'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
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
      toast.success('🗑️ Session deleted successfully!')
      onOpenChange(false)
      onEventDeleted()
    } catch (error) {
      toast.error('Failed to delete session. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            Delete Session?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            Are you sure you want to delete this session? All RSVPs and event data will be permanently removed and this action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-[#2A2A2A] p-4 rounded-lg border border-white/10 my-4">
          <p className="text-white font-medium">{event.title}</p>
          <p className="text-gray-400 text-sm mt-1">
            Session
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            className="bg-[#2A2A2A] border-white/10 text-white hover:bg-[#3A3A3A]"
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white border-0"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </div>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Session
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
