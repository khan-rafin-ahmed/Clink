import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShareModal } from '@/components/ShareModal'

import { LocationAutocomplete } from '@/components/LocationAutocomplete'
import { UserSearchInvite } from '@/components/shared/UserSearchInvite'
import { useAuth } from '@/lib/auth-context'

import { bulkInviteUsers } from '@/lib/memberService'
import { uploadEventCover } from '@/lib/fileUpload'
import { getDefaultCoverImage } from '@/lib/coverImageUtils'
import { sendEventInvitationsToCrew } from '@/lib/eventInvitationService'
import { toast } from 'sonner'
import { Loader2, Globe, Lock, Users, Upload, X } from 'lucide-react'
import type { Crew, LocationData, UserProfile } from '@/types'
import { supabase } from '@/lib/supabase'

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


  // Individual user invitation state
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([])
  const [selectedCrews, setSelectedCrews] = useState<Crew[]>([])




  const [formData, setFormData] = useState({
    title: '',
    place_nickname: '',
    location: '',
    locationData: null as LocationData | null,
    time: 'now',
    drink_type: 'beer',
    vibe: 'casual',
    notes: '',
    start_time: '',
    end_time: '',
    is_public: true,
    invited_users: [] as string[],
    cover_image: null as File | null,
    cover_image_url: null as string | null
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

  // Individual user invitation handlers
  const handleUserSelect = (user: UserProfile) => {
    if (!selectedUsers.some(selected => selected.user_id === user.user_id)) {
      setSelectedUsers(prev => [...prev, user])
    }
  }

  const handleCrewSelect = (crew: Crew) => {
    if (!selectedCrews.some(selected => selected.id === crew.id)) {
      setSelectedCrews(prev => [...prev, crew])
    }
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.user_id !== userId))
  }

  const handleRemoveCrew = (crewId: string) => {
    setSelectedCrews(prev => prev.filter(crew => crew.id !== crewId))
  }

  // Cover image handling
  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Cover image must be less than 5MB')
        return
      }

      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error('Cover image must be JPEG, PNG, or WebP')
        return
      }

      setFormData(prev => ({ ...prev, cover_image: file }))
    }
  }

  const removeCoverImage = () => {
    setFormData(prev => ({ ...prev, cover_image: null, cover_image_url: null }))
  }

  const timeOptions = [
    { value: 'now', label: 'Right Now', emoji: '🚀' },
    { value: 'custom', label: 'Pick Your Time', emoji: '⏰' }
  ]

  // Add handler for location change
  const handleLocationChange = (locationData: LocationData | null) => {
    setFormData(prev => ({
      ...prev,
      location: locationData?.place_name || '',
      locationData
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || isSubmitting) return

    // Validate required fields
    if (!formData.title.trim()) {
      toast.error('Event title is required')
      return
    }

    // Validate time selection for custom events
    if (formData.time === 'custom') {
      if (!formData.start_time) {
        toast.error('Start time is required')
        return
      }
      if (!formData.end_time) {
        toast.error('End time is required')
        return
      }

      const startTime = new Date(formData.start_time)
      const endTime = new Date(formData.end_time)

      if (endTime <= startTime) {
        toast.error('End time must be after start time')
        return
      }
    }


    setIsSubmitting(true)
    try {
      // Upload cover image if provided
      let coverImageUrl = null
      if (formData.cover_image) {
        try {
          const uploadResult = await uploadEventCover(formData.cover_image, user.id)
          coverImageUrl = uploadResult.url
        } catch (uploadError: any) {
          toast.error(`Failed to upload cover image: ${uploadError.message}`)
          // Continue with event creation using default cover
        }
      }

      // If no custom cover uploaded, use default based on vibe
      if (!coverImageUrl) {
        coverImageUrl = getDefaultCoverImage(formData.vibe)
      }

      const eventData = {
        title: formData.title.trim(),
        place_nickname: formData.place_nickname?.trim() || null,
        location: formData.locationData?.place_name || formData.location.trim(),
        latitude: formData.locationData?.latitude || null,
        longitude: formData.locationData?.longitude || null,
        place_id: formData.locationData?.place_id || null,
        place_name: formData.locationData?.place_name || null,
        // Set duration_type based on user input for DB constraint
        duration_type: formData.time === 'custom' ? 'custom' : 'now',
        date_time: (() => {
          if (formData.time === 'custom' && formData.start_time) {
            return new Date(formData.start_time).toISOString();
          } else {
            // 'now' - Set to current time for immediate LIVE status
            return new Date().toISOString();
          }
        })(),
        end_time: (() => {
          if (formData.time === 'custom' && formData.end_time) {
            return new Date(formData.end_time).toISOString();
          } else {
            // For 'now' events, default to 3 hours from start time
            const startTime = new Date();
            return new Date(startTime.getTime() + (3 * 60 * 60 * 1000)).toISOString();
          }
        })(),
        drink_type: formData.drink_type,
        vibe: formData.vibe,
        notes: formData.notes?.trim() || null,
        is_public: formData.is_public,
        created_by: user.id,
        cover_image_url: coverImageUrl
        // Note: crew_id is not a column in events table, crew relationship is handled via event_members table
      }

      // Create the event first
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

      if (eventError) {
        throw new Error(`Failed to create event: ${eventError.message}`)
      }

      const createdEventId = event.id

      // Handle invitations
      let invitationMessage = ''
      let totalInvited = 0

      // Send individual user invitations
      if (selectedUsers.length > 0) {
        try {
          const userIds = selectedUsers.map(user => user.user_id)
          await bulkInviteUsers(createdEventId, userIds, user!.id)
          totalInvited += selectedUsers.length

          const userInviteMessage = selectedUsers.length === 1
            ? `Invited ${selectedUsers[0].display_name || selectedUsers[0].username}`
            : `Invited ${selectedUsers.length} users`

          invitationMessage += ` ${userInviteMessage}`
        } catch (userInviteError: any) {
          console.error('Error sending user invitations:', userInviteError)
          invitationMessage += ' (Note: Some user invitations could not be sent)'
        }
      }

      // Send crew invitations from selectedCrews
      if (selectedCrews.length > 0) {
        for (const crew of selectedCrews) {
          try {
            const crewInvitationResult = await sendEventInvitationsToCrew(createdEventId, crew.id, user!.id)
            if (crewInvitationResult.success && crewInvitationResult.invitedCount > 0) {
              totalInvited += crewInvitationResult.invitedCount
              const crewMessage = `Invited ${crew.name} crew (${crewInvitationResult.invitedCount} members)`
              invitationMessage += invitationMessage
                ? ` and ${crewMessage.toLowerCase()}`
                : ` ${crewMessage}`
            }
          } catch (crewInviteError: any) {
            console.error(`Error sending invitations to crew ${crew.name}:`, crewInviteError)
            invitationMessage += ` (Note: ${crew.name} crew invitations could not be sent)`
          }
        }
      }

      // Success - close modal and notify
      const successMessage = totalInvited > 0
        ? `Event created successfully!${invitationMessage}`
        : 'Event created successfully! 🍺'

      toast.success(successMessage)
      setOpen(false)
      onEventCreated?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create event')
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
      case 1: {
        const hasTitle = formData.title.trim().length > 0;
        const hasTime = Boolean(formData.time);
        return hasTitle && hasTime;
      }
      case 2:
        return Boolean(formData.drink_type) && Boolean(formData.vibe);
      case 3:
        return true;
      default:
        return false;
    }
  }

  const resetModal = () => {
    setFormData({
      title: '',
      place_nickname: '',
      location: '',
      locationData: null,
      time: 'now',
      drink_type: 'beer',
      vibe: 'casual',
      notes: '',
      start_time: '',
      end_time: '',
      is_public: true,
      invited_users: [],
      cover_image: null,
      cover_image_url: null
    })
    setStep(1)
    setCreatedEvent(null)
    // Reset invitation state
    setSelectedUsers([])
    setSelectedCrews([])
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
        handleSubmit(e)
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

      {/* Enhanced Liquid Glass Modal */}
      <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto mx-4 sm:mx-0 glass-modal border-white/20">
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl font-display font-bold text-foreground text-shadow">
            Time to Raise Some Hell! 🍺
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a drinking session in 60 seconds. Step {step} of 3.
          </DialogDescription>
          <div className="flex space-x-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-3 flex-1 rounded-full ${
                  i <= step
                    ? 'bg-gradient-primary shadow-white'
                    : 'bg-white/20 glass-effect'
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
                <Label htmlFor="place_nickname" className="text-sm font-medium">Place Nickname <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  id="place_nickname"
                  placeholder="Swerve's House, The Rooftop Bar, etc."
                  value={formData.place_nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, place_nickname: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="mt-1"
                />
              </div>

              <div>
                <LocationAutocomplete
                  label="Where's the party?"
                  placeholder="Search for bars, restaurants, venues..."
                  value={formData.locationData}
                  onChange={handleLocationChange}
                 
                />
              </div>

              <div>
                <Label className="text-sm font-medium">When's the party?</Label>
                <Select
                  value={formData.time}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select timing" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#08090A] border-white/10">
                    {timeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value} className="text-white hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <span>{option.emoji}</span>
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.time === 'custom' && (
                  <div className="space-y-3 mt-3">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">Start Time</Label>
                      <Input
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="mt-1"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground">End Time</Label>
                      <Input
                        type="datetime-local"
                        value={formData.end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="mt-1"
                        min={formData.start_time || new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Drinks, Vibe, Cover & Notes */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">What's your poison?</Label>
                <Select
                  value={formData.drink_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, drink_type: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select your drink" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#08090A] border-white/10">
                    {drinkTypes.map(drink => (
                      <SelectItem key={drink.value} value={drink.value} className="text-white hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <span>{drink.emoji}</span>
                          <span>{drink.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">What's the vibe?</Label>
                <Select
                  value={formData.vibe}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vibe: value }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select the vibe" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#08090A] border-white/10">
                    {vibes.map(vibe => (
                      <SelectItem key={vibe.value} value={vibe.value} className="text-white hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <span>{vibe.emoji}</span>
                          <span>{vibe.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cover Image Upload */}
              <div>
                <Label className="text-sm font-medium">Event Cover Image (optional)</Label>
                <div className="mt-2 space-y-3">
                  {/* Preview current cover */}
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border bg-muted">
                    {formData.cover_image ? (
                      <div className="relative w-full h-full">
                        <img
                          src={URL.createObjectURL(formData.cover_image)}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeCoverImage}
                          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <div className="text-2xl opacity-60">
                            {vibes.find((v: any) => v.value === formData.vibe)?.emoji || '✨'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Default {formData.vibe} cover will be used
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload button */}
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleCoverImageChange}
                        className="hidden"
                      />
                      <div className="w-full p-3 border border-border rounded-lg text-center cursor-pointer hover:border-primary/50">
                        <Upload className="w-4 h-4 mx-auto mb-1" />
                        <div className="text-xs font-medium">Upload Cover</div>
                        <div className="text-xs text-muted-foreground">Max 5MB</div>
                      </div>
                    </label>
                    {formData.cover_image && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeCoverImage}
                        className="px-3"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
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
            </div>
          )}

          {/* Step 3: Privacy, Notes & Invitations */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Who can see this session?</Label>
                <Select
                  value={formData.is_public ? 'public' : 'private'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_public: value === 'public' }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select visibility">
                      <div className="flex items-center gap-2">
                        {formData.is_public ? (
                          <>
                            <Globe className="w-4 h-4" />
                            <span>Public</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>Private</span>
                          </>
                        )}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#08090A] border-white/10">
                    <SelectItem value="public" className="text-white hover:bg-white/10">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Public</div>
                          <div className="text-xs text-muted-foreground">Everyone can see</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="private" className="text-white hover:bg-white/10">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <div>
                          <div className="font-medium">Private</div>
                          <div className="text-xs text-muted-foreground">Invite only</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Unified Invitations */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-medium">Invite People (Optional)</Label>
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  Search and invite individual users or entire crews to your session
                </div>

                <UserSearchInvite
                  onUserSelect={handleUserSelect}
                  onCrewSelect={handleCrewSelect}
                  selectedUsers={selectedUsers}
                  selectedCrews={selectedCrews}
                  onRemoveUser={handleRemoveUser}
                  onRemoveCrew={handleRemoveCrew}
                  existingAttendees={[]}
                  loadingAttendees={false}
                  className="border border-border rounded-lg p-3"
                />
              </div>
            </div>
          )}



          {/* Navigation */}
          <div className="flex flex-col sm:flex-row gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={(e) => { e.preventDefault(); prevStep() }}
                className="px-6 order-2 sm:order-1"
              >
                Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                onClick={(e) => { e.preventDefault(); nextStep() }}
                disabled={!isStepValid()}
                className="flex-1 font-semibold order-1 sm:order-2"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={(e) => { e.preventDefault(); handleSubmit(e) }}
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
