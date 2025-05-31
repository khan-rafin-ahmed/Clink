import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { toast } from 'sonner'
import { Loader2, Globe, Lock, Users, Check } from 'lucide-react'
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
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([])
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
      // Auto-select all crew members
      setSelectedInvitees(members.map(member => member.user_id))
    } catch (error) {
      console.error('Error loading crew members:', error)
      setCrewMembers([])
      setSelectedInvitees([])
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
      setSelectedInvitees([])
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

    if (!formData.locationData && !formData.location.trim()) {
      toast.error('Event location is required')
      return
    }

    setIsSubmitting(true)
    try {
      const eventData = {
        title: formData.title.trim(),
        place_nickname: formData.place_nickname?.trim() || null,
        location: formData.locationData?.place_name || formData.location.trim(),
        latitude: formData.locationData?.latitude || null,
        longitude: formData.locationData?.longitude || null,
        place_id: formData.locationData?.place_id || null,
        place_name: formData.locationData?.place_name || null,
        date_time: (() => {
          const now = new Date();
          const tonight = new Date(now);
          tonight.setHours(20, 0, 0, 0); // Set to 8 PM

          if (formData.time === 'custom' && formData.custom_time) {
            return new Date(formData.custom_time).toISOString();
          } else if (formData.time === 'tonight') {
            // 'Later Tonight' should always be tonight at 8 PM, regardless of current time
            // If it's already past 8 PM, set it to a reasonable time later tonight (current time + 1 hour)
            if (now.getHours() >= 20) {
              // If it's already past 8 PM, set to 1 hour from now (but still tonight)
              const laterTonight = new Date(now);
              laterTonight.setHours(laterTonight.getHours() + 1, 0, 0, 0);
              return laterTonight.toISOString();
            } else {
              // If it's before 8 PM, set to 8 PM tonight
              return tonight.toISOString();
            }
          } else { // 'now'
            return now.toISOString();
          }
        })(),
        drink_type: formData.drink_type,
        vibe: formData.vibe,
        notes: formData.notes?.trim() || null,
        is_public: formData.is_public,
        created_by: user.id
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

      // If crew is selected, add all crew members as event members
      if (selectedCrew && crewMembers.length > 0) {
        const eventMembers = crewMembers.map(member => ({
          event_id: createdEventId,
          user_id: member.user_id,
          invited_by: user.id,
          status: 'accepted'
        }))

        const { error: membersError } = await supabase
          .from('event_members')
          .insert(eventMembers)

        if (membersError) {
          // If inserting event members fails, delete the created event to maintain consistency
          await supabase.from('events').delete().eq('id', createdEventId)
          throw new Error(`Failed to add crew members: ${membersError.message}`)
        }
      }

      // Success - close modal and notify
      toast.success('Event created successfully! 🍺')
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
      case 1:
        const hasTitle = formData.title.trim().length > 0;
        const hasLocation = formData.locationData !== null || formData.location.trim().length > 0;
        return hasTitle && hasLocation;
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
      custom_time: '',
      is_public: true,
      invited_users: []
    })
    setStep(1)
    setCreatedEvent(null)
    setSelectedInvitees([])
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
                      onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, time: option.value })) }}
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
                      onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, drink_type: drink.value })) }}
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
                      onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, vibe: vibe.value })) }}
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
                    onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, is_public: true })) }}
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
                    onClick={(e) => { e.preventDefault(); setFormData(prev => ({ ...prev, is_public: false })) }}
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
                        className={`p-3 rounded-lg border text-left transition-colors ${
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
                          className={`p-3 rounded-lg border text-left transition-colors ${
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
                      {crewMembers.length} crew member{crewMembers.length !== 1 ? 's' : ''} will automatically join:
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {crewMembers.map(member => (
                        <div
                          key={member.user_id}
                          className="flex items-center gap-2 p-2 rounded-lg border border-primary bg-primary/10 text-primary"
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
                          <Check className="w-3 h-3 ml-auto" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {selectedInvitees.length > 0 && (
                  <div className="text-center py-2">
                    <div className="text-xs text-muted-foreground">
                      {selectedInvitees.length} member{selectedInvitees.length !== 1 ? 's' : ''} will automatically join the session
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
