import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { loadGoogleMapsAPI } from '@/lib/googleMapsLoader'
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
    const initializeAutocomplete = async () => {
      try {
        await loadGoogleMapsAPI();

        if (!inputRef.current) return;

        const options = {
          types: ['establishment', 'geocode'],
          fields: ['formatted_address', 'geometry', 'name', 'place_id'],
          componentRestrictions: { country: 'bd' }
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

        // Style the autocomplete dropdown to match our dark theme
        const styleAutocompleteDropdown = () => {
          const pacContainer = document.querySelector('.pac-container') as HTMLElement
          if (pacContainer) {
            pacContainer.style.backgroundColor = '#111827' // bg-gray-900
            pacContainer.style.border = '1px solid #D97706' // border-gold-500
            pacContainer.style.borderRadius = '0.375rem'
            pacContainer.style.zIndex = '9999'

            const pacItems = pacContainer.querySelectorAll('.pac-item')
            pacItems.forEach((item: Element) => {
              const htmlItem = item as HTMLElement
              htmlItem.style.backgroundColor = '#111827' // bg-gray-900
              htmlItem.style.color = '#ffffff' // text-white
              htmlItem.style.borderBottom = '1px solid #374151' // border-gray-700
              htmlItem.style.padding = '8px 16px'

              htmlItem.addEventListener('mouseenter', () => {
                htmlItem.style.backgroundColor = '#1F2937' // hover:bg-gray-800
              })

              htmlItem.addEventListener('mouseleave', () => {
                htmlItem.style.backgroundColor = '#111827' // bg-gray-900
              })
            })

            // Hide "Powered by Google" text
            const poweredBy = pacContainer.querySelector('.pac-logo') as HTMLElement
            if (poweredBy) {
              poweredBy.style.display = 'none'
            }
          }
        }

        // Apply styling after a short delay to ensure dropdown is rendered
        const observer = new MutationObserver(() => {
          styleAutocompleteDropdown()
        })

        observer.observe(document.body, {
          childList: true,
          subtree: true
        })

        return () => {
          observer.disconnect()
          if (autocompleteRef.current) {
            google.maps.event.clearInstanceListeners(autocompleteRef.current)
          }
        }
      } catch (error) {
        console.error('Failed to initialize Google Maps autocomplete:', error)
      }
    }

    initializeAutocomplete()
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

      <div className="mt-2 text-sm italic text-gray-400 opacity-50">
        Powered by Google
      </div>
    </div>
  )
}
