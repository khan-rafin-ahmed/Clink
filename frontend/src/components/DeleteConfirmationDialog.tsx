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
import { Trash2 } from 'lucide-react'

interface DeleteConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  itemName: string
  itemType: 'event' | 'crew'
  isLoading?: boolean
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  itemType,
  isLoading = false
}: DeleteConfirmationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-[#1A1A1A] border-white/10">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bg-[#2A2A2A] p-4 rounded-lg border border-white/10 my-4">
          <p className="text-white font-medium">{itemName}</p>
          <p className="text-gray-400 text-sm mt-1">
            {itemType === 'event' ? 'Event' : 'Crew'}
          </p>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
          <p className="text-red-400 text-sm font-medium">⚠️ Warning</p>
          <p className="text-red-300 text-sm mt-1">
            This action cannot be undone. {itemType === 'event' 
              ? 'All RSVPs, invitations, and event data will be permanently deleted.'
              : 'All members will be removed and crew data will be permanently deleted.'
            }
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            className="bg-[#2A2A2A] border-white/10 text-white hover:bg-[#3A3A3A]"
            disabled={isDeleting || isLoading}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting || isLoading}
            className="bg-red-600 hover:bg-red-700 text-white border-0"
          >
            {isDeleting || isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </div>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete {itemType === 'event' ? 'Event' : 'Crew'}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
