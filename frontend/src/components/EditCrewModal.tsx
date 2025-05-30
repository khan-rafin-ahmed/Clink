import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateCrew } from '@/lib/crewService'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Crew } from '@/types'

interface EditCrewModalProps {
  isOpen: boolean
  onClose: () => void
  crew: Crew
  onCrewUpdated: () => void
}

export function EditCrewModal({ isOpen, onClose, crew, onCrewUpdated }: EditCrewModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    description: string
    vibe: Crew['vibe']
    visibility: 'public' | 'private'
  }>({
    name: '',
    description: '',
    vibe: 'casual',
    visibility: 'private'
  })

  // Initialize form data when crew changes
  useEffect(() => {
    if (crew) {
      setFormData({
        name: crew.name || '',
        description: crew.description || '',
        vibe: crew.vibe,
        visibility: crew.visibility || 'private'
      })
    }
  }, [crew])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Crew name is required')
      return
    }

    if (!formData.vibe) {
      toast.error('Please select a vibe')
      return
    }

    setIsLoading(true)
    try {
      await updateCrew(crew.id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        vibe: formData.vibe,
        visibility: formData.visibility
      })

      toast.success('🍺 Crew updated successfully!')
      onCrewUpdated()
      onClose()
    } catch (error: any) {
      console.error('Error updating crew:', error)
      toast.error(error.message || 'Failed to update crew')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-bold">
            Edit Crew
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Crew Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Crew Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter crew name..."
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              maxLength={50}
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What's this crew about?"
              className="bg-gray-900 border-gray-700 text-white placeholder-gray-400 resize-none"
              rows={3}
              maxLength={200}
              disabled={isLoading}
            />
          </div>

          {/* Vibe */}
          <div className="space-y-2">
            <Label className="text-white">Vibe *</Label>
            <Select
              value={formData.vibe}
              onValueChange={(value: Crew['vibe']) => setFormData(prev => ({ ...prev, vibe: value }))}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select crew vibe" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="casual" className="text-white hover:bg-gray-800">🍺 Casual</SelectItem>
                <SelectItem value="party" className="text-white hover:bg-gray-800">🎉 Party</SelectItem>
                <SelectItem value="chill" className="text-white hover:bg-gray-800">😎 Chill</SelectItem>
                <SelectItem value="wild" className="text-white hover:bg-gray-800">🔥 Wild</SelectItem>
                <SelectItem value="classy" className="text-white hover:bg-gray-800">🥂 Classy</SelectItem>
                <SelectItem value="other" className="text-white hover:bg-gray-800">🤷 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label className="text-white">Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value: 'public' | 'private') => setFormData(prev => ({ ...prev, visibility: value }))}
              disabled={isLoading}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="private" className="text-white hover:bg-gray-800">🔒 Private</SelectItem>
                <SelectItem value="public" className="text-white hover:bg-gray-800">🌍 Public</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 border-gray-700 text-white hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim() || !formData.vibe}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Crew'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
