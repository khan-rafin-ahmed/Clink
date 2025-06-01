import { useState, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { createCrew, inviteUserToCrew, searchUsersForInvite } from '@/lib/crewService'
import type { CreateCrewData } from '@/types'
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

  // Member invitation state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const vibeOptions = [
    { value: 'casual', label: 'Casual', emoji: '😎', icon: Coffee, description: 'Laid back vibes' },
    { value: 'party', label: 'Party', emoji: '🎉', icon: PartyPopper, description: 'Ready to rage' },
    { value: 'chill', label: 'Chill', emoji: '🧘', icon: Coffee, description: 'Keep it mellow' },
    { value: 'wild', label: 'Wild', emoji: '🔥', icon: Flame, description: 'No limits' },
    { value: 'classy', label: 'Classy', emoji: '🥂', icon: Crown, description: 'Sophisticated' },
    { value: 'other', label: 'Other', emoji: '⭐', icon: Star, description: 'Something else' }
  ]

  // Search for users to invite
  const handleSearchUsers = useCallback(async (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchUsersForInvite(query)
        setSearchResults(results)
      } catch (error) {
        console.error('Error searching users:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [])

  // Toggle member selection
  const toggleMemberSelection = (userId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedMembers(newSelected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Crew name is required')
      return
    }

    setIsSubmitting(true)

    try {
      // Create the crew first
      const newCrew = await createCrew(formData)

      // Invite selected members if any
      if (selectedMembers.size > 0) {
        const invitePromises = Array.from(selectedMembers).map(userId =>
          inviteUserToCrew(newCrew.id, userId)
        )

        try {
          await Promise.all(invitePromises)
          toast.success(`🍺 Crew created and ${selectedMembers.size} invite${selectedMembers.size > 1 ? 's' : ''} sent!`)
        } catch (inviteError) {
          console.error('Error sending invites:', inviteError)
          toast.success('🍺 Crew created! Some invites may have failed.')
        }
      } else {
        toast.success('🍺 Hell yeah! Crew created successfully!')
      }

      // Reset form and close modal
      setFormData({
        name: '',
        vibe: 'casual',
        visibility: 'private',
        description: ''
      })
      setSearchQuery('')
      setSearchResults([])
      setSelectedMembers(new Set())
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

          {/* Invite Members */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Invite Members (Optional)
            </Label>
            <div className="space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Input
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    handleSearchUsers(e.target.value)
                  }}
                  className="pr-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg p-2 max-h-32 overflow-y-auto">
                  {searchResults.map((user) => (
                    <div
                      key={user.user_id}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        selectedMembers.has(user.user_id)
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleMemberSelection(user.user_id)}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {user.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.display_name || 'Unknown User'}
                        </p>
                      </div>
                      {selectedMembers.has(user.user_id) && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Members Count */}
              {selectedMembers.size > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedMembers.size} member{selectedMembers.size > 1 ? 's' : ''} will be invited
                </p>
              )}
            </div>
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
