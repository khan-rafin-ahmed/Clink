import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LocationData } from '@/types'

interface GoogleLocationPickerProps {
  value?: LocationData | null
  onChange: (location: LocationData | null) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  error?: string
}

export function GoogleLocationPicker({
  value,
  onChange,
  placeholder = "Search for a location...",
  label,
  required = false,
  className,
  error
}: GoogleLocationPickerProps) {
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

    // Style the autocomplete dropdown
    const styleElement = document.createElement('style')
    styleElement.textContent = `
      .pac-container {
        background-color: #111827 !important;
        border: 1px solid #D4AF37 !important;
        border-radius: 0.5rem !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif !important;
        margin-top: 0.5rem !important;
        padding: 0.5rem 0 !important;
      }
      .pac-item {
        color: white !important;
        padding: 0.75rem 1rem !important;
        cursor: pointer !important;
        transition: background-color 0.2s !important;
      }
      .pac-item:hover {
        background-color: #1F2937 !important;
      }
      .pac-item-query {
        color: white !important;
        font-size: 0.875rem !important;
      }
      .pac-icon {
        filter: invert(1) !important;
      }
      .pac-matched {
        color: #D4AF37 !important;
      }
      .pac-container:after {
        content: "Powered by Google" !important;
        color: #9CA3AF !important;
        font-size: 0.75rem !important;
        font-style: italic !important;
        opacity: 0.5 !important;
        position: absolute !important;
        bottom: 0.5rem !important;
        right: 1rem !important;
      }
    `
    document.head.appendChild(styleElement)

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
      document.head.removeChild(styleElement)
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
              "pl-10 pr-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-400",
              "focus:border-gold-500 focus:ring-gold-500/20",
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
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-800 text-gray-400 hover:text-white"
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