import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { downloadEventICS } from '@/lib/emailService'
import { Calendar, ChevronDown, Download, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface AddToCalendarButtonProps {
  event: {
    title: string
    description?: string | null
    date_time: string
    end_time?: string | null
    duration_type?: string | null
    location?: string | null
    place_nickname?: string | null
  }
  eventUrl?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function AddToCalendarButton({ 
  event, 
  eventUrl, 
  variant = 'outline', 
  size = 'default',
  className = '' 
}: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Calculate end time
  const getEndTime = () => {
    if (event.end_time) {
      return event.end_time
    }
    
    const startTime = new Date(event.date_time)
    
    if (event.duration_type === 'all_night') {
      // All night events end at midnight the next day
      const endTime = new Date(startTime)
      endTime.setDate(endTime.getDate() + 1)
      endTime.setHours(0, 0, 0, 0)
      return endTime.toISOString()
    }
    
    // Default: 3 hours
    const endTime = new Date(startTime.getTime() + (3 * 60 * 60 * 1000))
    return endTime.toISOString()
  }

  const getEventDescription = () => {
    const parts = []
    
    if (event.description) {
      parts.push(event.description)
    }
    
    if (event.place_nickname && event.location && event.place_nickname !== event.location) {
      parts.push(`Location: ${event.place_nickname} (${event.location})`)
    } else if (event.location) {
      parts.push(`Location: ${event.location}`)
    }
    
    if (eventUrl) {
      parts.push(`Event Details: ${eventUrl}`)
    }
    
    parts.push('Created with Thirstee - Tap. Plan. Thirstee.')
    
    return parts.join('\n\n')
  }

  const handleDownloadICS = () => {
    try {
      downloadEventICS({
        title: event.title,
        description: getEventDescription(),
        startTime: event.date_time,
        endTime: getEndTime(),
        location: event.place_nickname || event.location || undefined,
        url: eventUrl
      })
      
      toast.success('📅 Calendar file downloaded!')
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to download calendar file:', error)
      toast.error('Failed to download calendar file')
    }
  }

  const handleGoogleCalendar = () => {
    try {
      const startTime = new Date(event.date_time)
      const endTime = new Date(getEndTime())
      
      const formatGoogleDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }
      
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${formatGoogleDate(startTime)}/${formatGoogleDate(endTime)}`,
        details: getEventDescription(),
        location: event.place_nickname || event.location || '',
        sprop: 'website:thirstee.app'
      })
      
      const googleUrl = `https://calendar.google.com/calendar/render?${params.toString()}`
      window.open(googleUrl, '_blank')
      
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to open Google Calendar:', error)
      toast.error('Failed to open Google Calendar')
    }
  }

  const handleOutlookCalendar = () => {
    try {
      const startTime = new Date(event.date_time)
      const endTime = new Date(getEndTime())
      
      const formatOutlookDate = (date: Date) => {
        return date.toISOString()
      }
      
      const params = new URLSearchParams({
        subject: event.title,
        startdt: formatOutlookDate(startTime),
        enddt: formatOutlookDate(endTime),
        body: getEventDescription(),
        location: event.place_nickname || event.location || ''
      })
      
      const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
      window.open(outlookUrl, '_blank')
      
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to open Outlook Calendar:', error)
      toast.error('Failed to open Outlook Calendar')
    }
  }

  const handleYahooCalendar = () => {
    try {
      const startTime = new Date(event.date_time)
      const endTime = new Date(getEndTime())
      
      const formatYahooDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      }
      
      // Calculate duration in hours
      const durationHours = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60))
      const durationFormatted = durationHours.toString().padStart(2, '0') + '00'
      
      const params = new URLSearchParams({
        v: '60',
        title: event.title,
        st: formatYahooDate(startTime),
        dur: durationFormatted,
        desc: getEventDescription(),
        in_loc: event.place_nickname || event.location || ''
      })
      
      const yahooUrl = `https://calendar.yahoo.com/?${params.toString()}`
      window.open(yahooUrl, '_blank')
      
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to open Yahoo Calendar:', error)
      toast.error('Failed to open Yahoo Calendar')
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Calendar className="w-4 h-4 mr-2" />
          Add to Calendar
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56 bg-[#1A1A1A] border-white/10">
        <DropdownMenuItem 
          onClick={handleGoogleCalendar}
          className="flex items-center gap-2 text-white hover:bg-white/10 cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          Google Calendar
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleOutlookCalendar}
          className="flex items-center gap-2 text-white hover:bg-white/10 cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          Outlook Calendar
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleYahooCalendar}
          className="flex items-center gap-2 text-white hover:bg-white/10 cursor-pointer"
        >
          <ExternalLink className="w-4 h-4" />
          Yahoo Calendar
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleDownloadICS}
          className="flex items-center gap-2 text-white hover:bg-white/10 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Download .ics file
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
