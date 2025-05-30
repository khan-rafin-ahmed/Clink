import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LocationData } from '@/types'

interface LocationAutocompleteProps {
  value?: LocationData | null
  onChange: (location: LocationData | null) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  error?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Search for a location...",
  label,
  required = false,
  className,
  error
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value?.place_name || '')
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  // Initialize Google Maps Places Autocomplete
  useEffect(() => {
    if (!window.google || !inputRef.current) return

    const options = {
      types: ['establishment', 'geocode'],
      fields: ['formatted_address', 'geometry', 'name', 'place_id']
    }

    autocompleteRef.current = new google.maps.places.Autocomplete(
      inputRef.current,
      options
    )

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()
      if (!place?.geometry?.location) return

      const locationData: LocationData = {
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        place_id: place.place_id || '',
        place_name: place.formatted_address || place.name || '',
        address: place.formatted_address
      }

      setQuery(locationData.place_name)
      onChange(locationData)
    })

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onChange])

  // Handle clear selection
  const handleClear = () => {
    setQuery('')
    onChange(null)
    inputRef.current?.focus()
  }

  return (
    <div className={cn("relative", className)}>
      {label && (
        <Label htmlFor="location-input" className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative mt-1">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id="location-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className={cn(
              "pl-10 pr-10",
              error && "border-destructive focus:border-destructive"
            )}
            required={required}
          />
          {(query || value) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  )
}
