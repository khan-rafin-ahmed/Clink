import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createCrew, type CreateCrewData } from '@/lib/crewService'
import { toast } from 'sonner'
import { Loader2, Users, Globe, Lock, PartyPopper, Coffee, Flame, Crown, Star } from 'lucide-react'

interface CreateCrewModalProps {
  onCrewCreated?: () => void
  trigger?: React.ReactNode
}

export function CreateCrewModal({ onCrewCreated, trigger }: CreateCrewModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateCrewData>({
    name: '',
    vibe: 'casual',
    visibility: 'private',
    description: ''
  })

  const vibeOptions = [
    { value: 'casual', label: 'Casual', emoji: '😎', icon: Coffee, description: 'Laid back vibes' },
    { value: 'party', label: 'Party', emoji: '🎉', icon: PartyPopper, description: 'Ready to rage' },
    { value: 'chill', label: 'Chill', emoji: '🧘', icon: Coffee, description: 'Keep it mellow' },
    { value: 'wild', label: 'Wild', emoji: '🔥', icon: Flame, description: 'No limits' },
    { value: 'classy', label: 'Classy', emoji: '🥂', icon: Crown, description: 'Sophisticated' },
    { value: 'other', label: 'Other', emoji: '⭐', icon: Star, description: 'Something else' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Crew name is required')
      return
    }

    setIsSubmitting(true)

    try {
      await createCrew(formData)
      toast.success('🍺 Hell yeah! Crew created successfully!')

      // Reset form and close modal
      setFormData({
        name: '',
        vibe: 'casual',
        visibility: 'private',
        description: ''
      })
      setOpen(false)
      onCrewCreated?.()
    } catch (error: any) {
      console.error('Error creating crew:', error)
      toast.error(error.message || 'Failed to create crew')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold">
            <Users className="w-4 h-4 mr-2" />
            Create Crew
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Create Your Crew 🍺
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Crew Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Crew Name *
            </Label>
            <Input
              id="name"
              placeholder="The Drinking Squad, Beer Buddies, etc."
              value={formData.name}
              onChange={(e) => setFormData((prev: CreateCrewData) => ({ ...prev, name: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="mt-1"
              maxLength={50}
              required
            />
          </div>

          {/* Vibe Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Crew Vibe</Label>
            <div className="grid grid-cols-2 gap-2">
              {vibeOptions.map((option) => {
                const IconComponent = option.icon
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData((prev: CreateCrewData) => ({ ...prev, vibe: option.value as CreateCrewData['vibe'] }))}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      formData.vibe === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-sm">{option.emoji}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Crew Visibility</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((prev: CreateCrewData) => ({ ...prev, visibility: 'public' }))}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  formData.visibility === 'public'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-lg"><Globe className="w-5 h-5 mx-auto" /></div>
                <div className="text-xs font-medium">Public</div>
                <div className="text-xs text-muted-foreground">Anyone can find</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev: CreateCrewData) => ({ ...prev, visibility: 'private' }))}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  formData.visibility === 'private'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-lg"><Lock className="w-5 h-5 mx-auto" /></div>
                <div className="text-xs font-medium">Private</div>
                <div className="text-xs text-muted-foreground">Invite only</div>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Description (optional)
            </Label>
            <Textarea
              id="description"
              placeholder="What's your crew about? Any rules or vibes to share..."
              value={formData.description}
              onChange={(e) => setFormData((prev: CreateCrewData) => ({ ...prev, description: e.target.value }))}
              onKeyDown={handleKeyDown}
              rows={3}
              className="mt-1"
              maxLength={200}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Create Crew
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
