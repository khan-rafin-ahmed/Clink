import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Wine,
  Beer,
  Martini,
  Coffee,
  Home,
  User,
  Settings,
  Plus,
  TrendingUp,
  Clock
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const runCommand = (command: () => void) => {
    onOpenChange(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search events, locations, or navigate..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/discover'))}>
            <Search className="mr-2 h-4 w-4" />
            <span>Discover Events</span>
          </CommandItem>
          {user && (
            <>
              <CommandItem onSelect={() => runCommand(() => navigate('/profile'))}>
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate('/profile/edit'))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Quick Actions */}
        {user && (
          <>
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => runCommand(() => {
                // This would trigger the QuickEventModal
                const event = new CustomEvent('open-quick-event-modal')
                window.dispatchEvent(event)
              })}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Create New Event</span>
                <span className="ml-auto text-xs text-muted-foreground">⌘N</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Event Filters */}
        <CommandGroup heading="Event Filters">
          <CommandItem onSelect={() => runCommand(() => navigate('/discover?filter=today'))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Events Today</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/discover?filter=tomorrow'))}>
            <Clock className="mr-2 h-4 w-4" />
            <span>Events Tomorrow</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/discover?filter=weekend'))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Weekend Events</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/discover?sort=trending'))}>
            <TrendingUp className="mr-2 h-4 w-4" />
            <span>Trending Events</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/discover?sort=popular'))}>
            <Users className="mr-2 h-4 w-4" />
            <span>Popular Events</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Drink Type Filters */}
        <CommandGroup heading="Drink Types">
          <CommandItem onSelect={() => runCommand(() => navigate('/discover?drink=beer'))}>
            <Beer className="mr-2 h-4 w-4" />
            <span>Beer Events</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/discover?drink=wine'))}>
            <Wine className="mr-2 h-4 w-4" />
            <span>Wine Events</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/discover?drink=cocktails'))}>
            <Martini className="mr-2 h-4 w-4" />
            <span>Cocktail Events</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/discover?drink=whiskey'))}>
            <Coffee className="mr-2 h-4 w-4" />
            <span>Whiskey Events</span>
          </CommandItem>
        </CommandGroup>

        {/* Location-based suggestions could go here */}
        {searchQuery && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Search Results">
              <CommandItem onSelect={() => runCommand(() => navigate(`/discover?search=${encodeURIComponent(searchQuery)}`))}>
                <Search className="mr-2 h-4 w-4" />
                <span>Search for "{searchQuery}"</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => navigate(`/discover?location=${encodeURIComponent(searchQuery)}`))}>
                <MapPin className="mr-2 h-4 w-4" />
                <span>Events near "{searchQuery}"</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}

// Command Menu Trigger Button
export function CommandMenuTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <Button
      variant="outline"
      className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64"
      onClick={onOpen}
    >
      <Search className="mr-2 h-4 w-4" />
      <span className="hidden lg:inline-flex">Search events...</span>
      <span className="inline-flex lg:hidden">Search...</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  )
}

// Hook for using command menu
export function useCommandMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleOpenQuickEvent = () => {
      // Handle quick event creation
      console.log('Quick event modal should open')
    }

    window.addEventListener('open-quick-event-modal', handleOpenQuickEvent)
    return () => window.removeEventListener('open-quick-event-modal', handleOpenQuickEvent)
  }, [])

  return {
    open,
    setOpen,
    toggle: () => setOpen(!open)
  }
}
