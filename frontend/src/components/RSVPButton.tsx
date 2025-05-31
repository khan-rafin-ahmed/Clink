import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Users, Check } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface RSVPButtonProps {
  eventId: string
  initialAttendees?: Array<{
    id: string
    name: string
    emoji: string
  }>
}

export function RSVPButton({ eventId, initialAttendees = [] }: RSVPButtonProps) {
  const { user } = useAuth()
  const [isAttending, setIsAttending] = useState(false)
  const [attendees, setAttendees] = useState(initialAttendees)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if current user is attending
    if (user) {
      const isUserAttending = attendees.some(attendee => attendee.id === user.id)
      setIsAttending(isUserAttending)
    }
  }, [user, attendees])

  const handleRSVP = async () => {
    if (!user) {
      toast.error('Please sign in to RSVP')
      return
    }

    setIsLoading(true)
    try {
      if (isAttending) {
        // Remove RSVP
        const { error } = await supabase
          .from('rsvps')
          .delete()
          .match({ event_id: eventId, user_id: user.id })

        if (error) throw error

        setAttendees(prev => prev.filter(a => a.id !== user.id))
        setIsAttending(false)
        toast.success('Removed from attendees')
      } else {
        // Add RSVP
        const { error } = await supabase
          .from('rsvps')
          .insert([
            {
              event_id: eventId,
              user_id: user.id,
              status: 'going'
            }
          ])

        if (error) throw error

        // Add user to attendees list
        setAttendees(prev => [...prev, {
          id: user.id,
          name: user.user_metadata?.full_name || 'Anonymous',
          emoji: user.user_metadata?.emoji || '👤'
        }])
        setIsAttending(true)
        toast.success('Added to attendees!')
      }
    } catch (error) {
      toast.error('Failed to update RSVP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleRSVP}
        disabled={isLoading}
        variant={isAttending ? "default" : "outline"}
        className="gap-2"
      >
        {isAttending ? (
          <>
            <Check className="h-4 w-4" />
            I'm In!
          </>
        ) : (
          <>
            <Users className="h-4 w-4" />
            RSVP
          </>
        )}
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            {attendees.length} attending
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-2">
            <h4 className="font-medium">Attendees</h4>
            {attendees.length > 0 ? (
              <div className="space-y-2">
                {attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span>{attendee.emoji}</span>
                    <span>{attendee.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No attendees yet
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}