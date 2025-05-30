import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GoogleLocationPicker } from '@/components/GoogleLocationPicker'
import { toast } from 'sonner'
import type { LocationData } from '@/types'

interface EventFormProps {
  initialData?: {
    title?: string
    date_time?: string
    location?: string
    place_name?: string
    place_id?: string
    latitude?: number
    longitude?: number
    drink_type?: string
    vibe?: string
    notes?: string
    is_public?: boolean
  }
  onSubmit?: (eventId: string) => void
  onCancel?: () => void
}

export function EventForm({ initialData, onSubmit, onCancel }: EventFormProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(initialData?.title || '')
  const [dateTime, setDateTime] = useState(initialData?.date_time || '')
  const [location, setLocation] = useState<LocationData | null>(initialData ? {
    place_name: initialData.place_name || initialData.location || '',
    place_id: initialData.place_id || '',
    latitude: initialData.latitude || 0,
    longitude: initialData.longitude || 0,
    address: initialData.place_name || initialData.location || ''
  } : null)
  const [drinkType, setDrinkType] = useState(initialData?.drink_type || '')
  const [vibe, setVibe] = useState(initialData?.vibe || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [isPublic, setIsPublic] = useState(initialData?.is_public ?? true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!location) {
      toast.error('Please select a location')
      return
    }

    setLoading(true)

    try {
      const eventData = {
        title,
        date_time: dateTime,
        location: location.place_name,
        place_name: location.place_name,
        place_id: location.place_id,
        latitude: location.latitude,
        longitude: location.longitude,
        drink_type: drinkType,
        vibe,
        notes,
        is_public: isPublic,
        created_by: user.id
      }

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single()

      if (error) throw error

      toast.success('Event created successfully!')
      if (onSubmit) {
        onSubmit(data.id)
      } else {
        navigate(`/event/${data.event_code || data.id}`)
      }
    } catch (error) {
      console.error('Error creating event:', error)
      toast.error('Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's the occasion?"
            required
          />
        </div>

        <div>
          <Label htmlFor="date-time">When's the party?</Label>
          <Input
            id="date-time"
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="location">Where's the party?</Label>
          <GoogleLocationPicker
            value={location}
            onChange={setLocation}
            placeholder="Search for a venue..."
            required
          />
        </div>

        <div>
          <Label htmlFor="drink-type">What's the drink of choice?</Label>
          <Select value={drinkType} onValueChange={setDrinkType}>
            <SelectTrigger>
              <SelectValue placeholder="Select a drink type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beer">Beer</SelectItem>
              <SelectItem value="wine">Wine</SelectItem>
              <SelectItem value="cocktails">Cocktails</SelectItem>
              <SelectItem value="coffee">Coffee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="vibe">What's the vibe?</Label>
          <Select value={vibe} onValueChange={setVibe}>
            <SelectTrigger>
              <SelectValue placeholder="Select a vibe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="party">Party</SelectItem>
              <SelectItem value="chill">Chill</SelectItem>
              <SelectItem value="wild">Wild</SelectItem>
              <SelectItem value="classy">Classy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions or details?"
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is-public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="is-public">Make this event public</Label>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading || !location}
          className="bg-gold-500 hover:bg-gold-600 text-white"
        >
          {loading ? 'Creating...' : 'Create Event'}
        </Button>
      </div>
    </form>
  )
} 