import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ShareModal } from '@/components/ShareModal'
import { UserAvatar } from '@/components/UserAvatar'
import { useAuth } from '@/lib/auth-context'
import { createEventWithShareableLink } from '@/lib/eventService'
import { getInnerCircle, type InnerCircleMember } from '@/lib/followService'
import { bulkInviteUsers } from '@/lib/memberService'
import { toast } from 'sonner'
import { Loader2, Globe, Lock, Users, Check, Search } from 'lucide-react'

interface QuickEventModalProps {
  onEventCreated?: () => void
  trigger?: React.ReactNode
}

export function QuickEventModal({ onEventCreated, trigger }: QuickEventModalProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(1)
  const [createdEvent, setCreatedEvent] = useState<{ share_url: string; event_code: string } | null>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<InnerCircleMember[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Search Inner Circle members
  const searchInnerCircle = async (query: string) => {
    if (!user || !query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const members = await getInnerCircle()
      const filtered = members.filter(member =>
        member.display_name?.toLowerCase().includes(query.toLowerCase()) ||
        member.user_id.toLowerCase().includes(query.toLowerCase())
      )
      setSearchResults(filtered)
    } catch (error) {
      console.error('Error searching Inner Circle members:', error)
      toast.error('Failed to search your stable')
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() && user) {
        searchInnerCircle(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, user?.id])


  const [formData, setFormData] = useState({
    title: '',
    location: '',
    time: 'now',
    drink_type: 'beer',
    vibe: 'casual',
    notes: '',
    custom_time: '',
    is_public: true,
    invited_users: [] as string[]
  })

  const drinkTypes = [
    { value: 'beer', label: 'Beer', emoji: '🍺' },
    { value: 'wine', label: 'Wine', emoji: '🍷' },
    { value: 'whiskey', label: 'Whiskey', emoji: '🥃' },
    { value: 'cocktails', label: 'Cocktails', emoji: '🍸' },
    { value: 'shots', label: 'Shots', emoji: '🥂' },
    { value: 'mixed', label: 'Mixed', emoji: '🍹' }
  ]

  const vibes = [
    { value: 'casual', label: 'Casual Hang', emoji: '😎' },
    { value: 'party', label: 'Party Mode', emoji: '🎉' },
    { value: 'shots', label: 'Shots Night', emoji: '🥃' },
    { value: 'chill', label: 'Chill Vibes', emoji: '🌙' },
    { value: 'wild', label: 'Wild Night', emoji: '🔥' },
    { value: 'classy', label: 'Classy Evening', emoji: '🥂' }
  ]

  const timeOptions = [
    { value: 'now', label: 'Right Now!', emoji: '🚀' },
    { value: 'tonight', label: 'Later Tonight', emoji: '🌙' },
    { value: 'custom', label: 'Custom Time', emoji: '⏰' }
  ]

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    // Only allow submission on step 3
    if (step !== 3) {
      return
    }

    if (!user) {
      toast.error('Please sign in to create an event')
      return
    }

    setIsSubmitting(true)

    try {
      // Calculate event time
      let eventDateTime = new Date()
      if (formData.time === 'tonight') {
        eventDateTime.setHours(20, 0, 0, 0) // 8 PM tonight
      } else if (formData.time === 'custom' && formData.custom_time) {
        eventDateTime = new Date(formData.custom_time)
      }

      console.log('Creating event:', formData)

      // Create event using the enhanced service
      const eventData = {
        title: formData.title,
        location: formData.location,
        date_time: eventDateTime.toISOString(),
        drink_type: formData.drink_type,
        vibe: formData.vibe,
        notes: formData.notes || undefined,
        is_public: formData.is_public
      }

      console.log('Creating event with data:', eventData)

      const result = await createEventWithShareableLink(eventData)

      console.log('✅ Event created successfully:', result)

      // Invite selected Inner Circle members if any
      if (selectedInvitees.length > 0 && result.event?.id) {
        try {
          await bulkInviteUsers(result.event.id, selectedInvitees)
          console.log('✅ Inner Circle members invited successfully')
        } catch (error) {
          console.error('Error inviting Inner Circle members:', error)
          // Don't fail the whole process, just log the error
        }
      }

      // Show success message and close modal
      const inviteMessage = selectedInvitees.length > 0
        ? `🍺 Hell yeah! Session created and ${selectedInvitees.length} stable members invited!`
        : '🍺 Hell yeah! Session created! Time to raise some hell!'
      toast.success(inviteMessage)

      // Close modal and reset
      setOpen(false)
      setTimeout(resetModal, 300)

      // Call the callback
      onEventCreated?.()
    } catch (error: any) {
      console.error('Error creating event:', error)

      // Provide more specific error messages
      let errorMessage = 'Failed to create event'
      if (error.message?.includes('NetworkError')) {
        errorMessage = 'Network error - please check your internet connection and try again'
      } else if (error.message?.includes('JWT')) {
        errorMessage = 'Authentication error - please sign out and sign back in'
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied - please check your account permissions'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.title.trim() && formData.location.trim()
      case 2:
        return formData.time && formData.drink_type
      case 3:
        return true
      case 4:
        return true
      default:
        return false
    }
  }

  const resetModal = () => {
    setFormData({
      title: '',
      location: '',
      time: 'now',
      drink_type: 'beer',
      vibe: 'casual',
      notes: '',
      custom_time: '',
      is_public: true,
      invited_users: []
    })
    setStep(1)
    setCreatedEvent(null)
    setSelectedInvitees([])
    setSearchQuery('')
    setSearchResults([])
  }



  const handleCloseModal = (newOpen: boolean) => {
    if (newOpen !== open) {
      setOpen(newOpen)
      if (!newOpen) {
        // Reset after a short delay to avoid visual glitch
        setTimeout(resetModal, 300)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (step < 3 && isStepValid()) {
        nextStep()
      } else if (step === 3) {
        handleSubmit()
      }
    }
  }

  const handleTriggerClick = () => {
    setOpen(true)
  }

  return (
    <>
      {/* Trigger Button */}
      {trigger ? (
        <div onClick={handleTriggerClick}>
          {trigger}
        </div>
      ) : (
        <Button
          size="lg"
          className="font-heading font-bold"
          onClick={handleTriggerClick}
        >
          🍺 Start a Session
        </Button>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-foreground">
            Time to Raise Some Hell! 🍺
          </DialogTitle>
          <div className="flex space-x-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">What's the session?</Label>
                <Input
                  id="title"
                  placeholder="Happy Hour Hangout, Stone Cold Sunday, etc."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-sm font-medium">Where's the party?</Label>
                <Input
                  id="location"
                  placeholder="The Local Pub, Downtown Bar, etc."
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="mt-1"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Time & Drinks */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">When's the party?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {timeOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, time: option.value }))}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        formData.time === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-lg">{option.emoji}</div>
                      <div className="text-xs font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
                {formData.time === 'custom' && (
                  <Input
                    type="datetime-local"
                    value={formData.custom_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, custom_time: e.target.value }))}
                    onKeyDown={handleKeyDown}
                    className="mt-2"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">What's your poison?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {drinkTypes.map(drink => (
                    <button
                      key={drink.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, drink_type: drink.value }))}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        formData.drink_type === drink.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-lg">{drink.emoji}</div>
                      <div className="text-xs font-medium">{drink.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Vibe, Privacy & Notes */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">What's the vibe?</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {vibes.map(vibe => (
                    <button
                      key={vibe.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, vibe: vibe.value }))}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        formData.vibe === vibe.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-lg">{vibe.emoji}</div>
                      <div className="text-xs font-medium">{vibe.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Who can see this session?</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_public: true }))}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      formData.is_public
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-lg"><Globe className="w-5 h-5 mx-auto" /></div>
                    <div className="text-xs font-medium">Public</div>
                    <div className="text-xs text-muted-foreground">Everyone can see</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_public: false }))}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      !formData.is_public
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

              <div>
                <Label htmlFor="notes" className="text-sm font-medium">Special notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="BYOB, dress code, bring snacks, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Inner Circle Invitations */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-medium">Invite the Stable</Label>
                </div>

                {/* Search Input */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search your stable members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Search Results */}
                {isSearching ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Searching your stable...</span>
                  </div>
                ) : searchQuery.trim() && searchResults.length === 0 ? (
                  <div className="text-center py-4 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      No stable members found for "{searchQuery}"
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Try a different search term or add more people to your stable!
                    </div>
                  </div>
                ) : searchQuery.trim() && searchResults.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      Found {searchResults.length} members ({selectedInvitees.length} selected)
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {searchResults.map(member => (
                        <button
                          key={member.user_id}
                          type="button"
                          onClick={() => {
                            setSelectedInvitees(prev =>
                              prev.includes(member.user_id)
                                ? prev.filter(id => id !== member.user_id)
                                : [...prev, member.user_id]
                            )
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${
                            selectedInvitees.includes(member.user_id)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <UserAvatar
                            userId={member.user_id}
                            displayName={member.display_name}
                            avatarUrl={member.avatar_url}
                            size="xs"
                          />
                          <span className="text-xs font-medium truncate">
                            {member.display_name || 'Anonymous'}
                          </span>
                          {selectedInvitees.includes(member.user_id) && (
                            <Check className="w-3 h-3 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Start typing to search your stable members
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedInvitees.length > 0 && `${selectedInvitees.length} members selected for invitation`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="px-6 order-2 sm:order-1"
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid()}
                className="flex-1 font-semibold order-1 sm:order-2"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="flex-1 font-semibold order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Gimme a Hell Yeah! 🍺'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      </Dialog>

      {/* Share Modal */}
      {createdEvent && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={formData.title}
          url={createdEvent.share_url}
        />
      )}
    </>
  )
}
