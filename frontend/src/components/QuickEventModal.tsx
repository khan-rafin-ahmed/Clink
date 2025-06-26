import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ShareModal } from '@/components/ShareModal'
import { UserAvatar } from '@/components/UserAvatar'
import { LocationAutocomplete } from '@/components/LocationAutocomplete'
import { useAuth } from '@/lib/auth-context'
import { getUserCrews } from '@/lib/crewService'
import { getCrewMembers } from '@/lib/crewService'
import { uploadEventCover } from '@/lib/fileUpload'
import { getDefaultCoverImage } from '@/lib/coverImageUtils'
import { sendEventInvitationsToCrew } from '@/lib/eventInvitationService'
import { toast } from 'sonner'
import { Loader2, Globe, Lock, Users, Upload, X } from 'lucide-react'
import type { Crew, CrewMember, LocationData } from '@/types'
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
  const [userCrews, setUserCrews] = useState<Crew[]>([])
  const [selectedCrew, setSelectedCrew] = useState<string>('')
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([])
  const [loadingCrews, setLoadingCrews] = useState(false)

  // Load user crews
  const loadUserCrews = async () => {
    if (!user) return

    setLoadingCrews(true)
    try {
      const crews = await getUserCrews()
      setUserCrews(crews)
    } catch (error) {
      console.error('Error loading crews:', error)
    } finally {
      setLoadingCrews(false)
    }
  }

  // Load crew members when crew is selected
  const loadCrewMembers = async (crewId: string) => {
    try {
      const members = await getCrewMembers(crewId)
      setCrewMembers(members)
    } catch (error) {
      console.error('Error loading crew members:', error)
      setCrewMembers([])
    }
  }

  // Load crews when modal opens
  useEffect(() => {
    if (open && user) {
      loadUserCrews()
    }
  }, [open, user?.id])

  // Load crew members when crew is selected
  useEffect(() => {
    if (selectedCrew) {
      loadCrewMembers(selectedCrew)
    } else {
      setCrewMembers([])
    }
  }, [selectedCrew])


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
        // Explicitly set duration_type to satisfy database constraint
        duration_type: 'specific_time',
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

      // If crew is selected, send invitations to crew members instead of auto-adding
      let invitationMessage = ''
      if (selectedCrew && crewMembers.length > 0) {
        try {
          console.log('🧪 Sending crew invitations with correct data:', {
            eventId: createdEventId,
            crewId: selectedCrew,
            crewIdType: typeof selectedCrew,
            crewMembers: crewMembers.length
          })

          const invitationResult = await sendEventInvitationsToCrew(createdEventId, selectedCrew, user!.id)

          if (invitationResult.success && invitationResult.invitedCount > 0) {
            invitationMessage = ` ${invitationResult.message}`
          } else if (!invitationResult.success) {
            // Log error but don't fail event creation
            console.error('Failed to send crew invitations:', invitationResult.message)
            invitationMessage = ' (Note: Some invitations may not have been sent)'
          }
        } catch (invitationError: any) {
          // Log error but don't fail event creation
          console.error('Error sending crew invitations:', invitationError)
          invitationMessage = ' (Note: Crew invitations could not be sent)'
        }
      }

      // Success - close modal and notify
      const successMessage = selectedCrew && crewMembers.length > 0
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
        return hasTitle;
      }
      case 2:
        return formData.time && formData.drink_type;
      case 3:
        return true;
      case 4:
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
    setSelectedCrew('')
    setCrewMembers([])
    setUserCrews([])
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
                    ? 'bg-gradient-primary shadow-amber'
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
                      onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, time: option.value })) }}
                      className={`p-3 rounded-lg border text-center ${
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

              <div>
                <Label className="text-sm font-medium">What's your poison?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                  {drinkTypes.map(drink => (
                    <button
                      key={drink.value}
                      type="button"
                      onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, drink_type: drink.value })) }}
                      className={`p-3 rounded-lg border text-center ${
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
                      onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, vibe: vibe.value })) }}
                      className={`p-3 rounded-lg border text-center ${
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
                <Label className="text-sm font-medium">Who can see this session?</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, is_public: true })) }}
                    className={`p-3 rounded-lg border text-center ${
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
                    onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, is_public: false })) }}
                    className={`p-3 rounded-lg border text-center ${
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

              {/* Crew Invitations */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-medium">Invite Your Crew</Label>
                </div>

                {/* Crew Selection */}
                {loadingCrews ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Loading your crews...</span>
                  </div>
                ) : userCrews.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setSelectedCrew('') }}
                        className={`p-3 rounded-lg border text-left ${
                          selectedCrew === ''
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-sm font-medium">No crew - invite individually</div>
                        <div className="text-xs text-muted-foreground">Select specific people to invite</div>
                      </button>
                      {userCrews.map(crew => (
                        <button
                          key={crew.id}
                          type="button"
                          onClick={(e) => { e.preventDefault(); setSelectedCrew(crew.id) }}
                          className={`p-3 rounded-lg border text-left ${
                            selectedCrew === crew.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-sm font-medium">{crew.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {crew.member_count} member{crew.member_count !== 1 ? 's' : ''} • {crew.vibe} vibe
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      No crews found
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Create a crew first to easily invite your regular drinking buddies!
                    </div>
                  </div>
                )}

                {/* Selected Crew Members */}
                {selectedCrew && crewMembers.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {crewMembers.length} crew member{crewMembers.length !== 1 ? 's' : ''} will receive invitations:
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {crewMembers.map(member => (
                        <div
                          key={member.user_id}
                          className="flex items-center gap-2 p-2 rounded-lg border border-amber-500 bg-amber-500/10 text-amber-400"
                        >
                          <UserAvatar
                            userId={member.user_id}
                            displayName={member.user?.display_name}
                            avatarUrl={member.user?.avatar_url}
                            size="xs"
                          />
                          <span className="text-xs font-medium truncate">
                            {member.user?.display_name || 'Anonymous'}
                          </span>
                          <span className="text-xs ml-auto">📨</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {selectedCrew && crewMembers.length > 0 && (
                  <div className="text-center py-2">
                    <div className="text-xs text-muted-foreground">
                      📨 Invitations will be sent to {crewMembers.length} crew member{crewMembers.length !== 1 ? 's' : ''}
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
