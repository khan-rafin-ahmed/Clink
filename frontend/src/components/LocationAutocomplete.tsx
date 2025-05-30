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
    let observer: MutationObserver | null = null;

    const initializeAutocomplete = async () => {
      try {
        console.log('Starting to load Google Maps API...')
        await loadGoogleMapsAPI();
        console.log('Google Maps API loaded successfully')

        if (!inputRef.current) {
          console.log('Input ref not available')
          return
        }

        const options = {
          types: ['establishment', 'geocode'],
          fields: ['formatted_address', 'geometry', 'name', 'place_id']
          // Temporarily removing country restriction to test
          // componentRestrictions: { country: 'bd' }
        }

        console.log('Creating autocomplete with options:', options)
        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current,
          options
        )
        console.log('Autocomplete created successfully')

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace()
          console.log('Place changed:', place)

          if (!place?.geometry?.location) {
            console.log('No geometry or location found')
            return
          }

          const locationData: LocationData = {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng(),
            place_id: place.place_id || '',
            place_name: place.formatted_address || place.name || '',
            address: place.formatted_address
          }

          console.log('Location data created:', locationData)
          setQuery(locationData.place_name)
          onChange(locationData)
        })

        // Style the autocomplete dropdown to match our dark theme
        const styleAutocompleteDropdown = () => {
          const pacContainer = document.querySelector('.pac-container') as HTMLElement
          if (pacContainer) {
            // Container styling
            pacContainer.style.setProperty('background-color', '#111827', 'important')
            pacContainer.style.setProperty('border', '1px solid #D97706', 'important')
            pacContainer.style.setProperty('border-radius', '0.375rem', 'important')
            pacContainer.style.setProperty('z-index', '9999', 'important')
            pacContainer.style.setProperty('margin-top', '4px', 'important')
            pacContainer.style.setProperty('box-shadow', '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 'important')

            // Style all items WITHOUT breaking Google's event listeners
            const pacItems = pacContainer.querySelectorAll('.pac-item')
            pacItems.forEach((item: Element) => {
              const htmlItem = item as HTMLElement

              // Force dark styling
              htmlItem.style.setProperty('background-color', '#111827', 'important')
              htmlItem.style.setProperty('color', '#ffffff', 'important')
              htmlItem.style.setProperty('border-bottom', '1px solid #374151', 'important')
              htmlItem.style.setProperty('padding', '12px 16px', 'important')
              htmlItem.style.setProperty('cursor', 'pointer', 'important')

              // Style all text elements inside
              const textElements = htmlItem.querySelectorAll('span, .pac-item-query, .pac-matched')
              textElements.forEach((textEl: Element) => {
                (textEl as HTMLElement).style.setProperty('color', '#ffffff', 'important')
              })

              // Add hover effects WITHOUT cloning (to preserve Google's event listeners)
              htmlItem.addEventListener('mouseenter', () => {
                htmlItem.style.setProperty('background-color', '#1F2937', 'important')
              })

              htmlItem.addEventListener('mouseleave', () => {
                htmlItem.style.setProperty('background-color', '#111827', 'important')
              })
            })

            // Hide all Google branding more aggressively
            const brandingSelectors = [
              '.pac-logo',
              '.pac-icon',
              '[src*="google"]',
              '[alt*="google"]',
              '[title*="google"]',
              '.pac-item:last-child'
            ]

            brandingSelectors.forEach(selector => {
              const elements = pacContainer.querySelectorAll(selector)
              elements.forEach((el: Element) => {
                (el as HTMLElement).style.setProperty('display', 'none', 'important')
              })
            })

            // Check for "Powered by Google" text and hide it
            const allText = pacContainer.querySelectorAll('*')
            allText.forEach((el: Element) => {
              if (el.textContent?.includes('Powered by Google')) {
                (el as HTMLElement).style.setProperty('display', 'none', 'important')
              }
            })
          }
        }

        // Inject CSS for Google Maps styling
        const injectGoogleMapsCSS = () => {
          const existingStyle = document.getElementById('google-maps-dark-theme')
          if (!existingStyle) {
            const style = document.createElement('style')
            style.id = 'google-maps-dark-theme'
            style.textContent = `
              .pac-container {
                background-color: #111827 !important;
                border: 1px solid #D97706 !important;
                border-radius: 0.375rem !important;
                z-index: 9999 !important;
                margin-top: 4px !important;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
              }
              .pac-item {
                background-color: #111827 !important;
                color: #ffffff !important;
                border-bottom: 1px solid #374151 !important;
                padding: 12px 16px !important;
                cursor: pointer !important;
              }
              .pac-item:hover {
                background-color: #1F2937 !important;
              }
              .pac-item span,
              .pac-item-query,
              .pac-matched {
                color: #ffffff !important;
              }
              .pac-logo,
              .pac-icon,
              [src*="google"],
              [alt*="google"],
              [title*="google"],
              .pac-item:last-child {
                display: none !important;
              }
            `
            document.head.appendChild(style)
            console.log('Google Maps CSS injected')
          }
        }

        // Inject CSS immediately
        injectGoogleMapsCSS()

        // Apply styling immediately and on mutations
        setTimeout(styleAutocompleteDropdown, 100)

        observer = new MutationObserver(() => {
          setTimeout(styleAutocompleteDropdown, 50)
        })

        observer.observe(document.body, {
          childList: true,
          subtree: true
        })
      } catch (error) {
        console.error('Failed to initialize Google Maps autocomplete:', error)
      }
    }

    initializeAutocomplete()

    // Return cleanup function
    return () => {
      if (observer) {
        observer.disconnect()
      }
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
