import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2, X } from 'lucide-react'
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

interface MapboxFeature {
  id: string
  place_name: string
  center: [number, number]
  properties: {
    address?: string
  }
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
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Get Mapbox token from environment
  const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN

  // Remove debug logs since Mapbox is working
  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN) {
      console.warn('Mapbox access token is missing')
    }
  }, [])

  // Debounced search function
  const searchPlaces = async (searchQuery: string) => {
    if (!searchQuery.trim() || !MAPBOX_ACCESS_TOKEN) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchQuery
      )}.json?access_token=${MAPBOX_ACCESS_TOKEN}&types=poi,address,place&limit=5`
      
      const response = await fetch(url, { signal: abortControllerRef.current.signal })

      if (!response.ok) {
        throw new Error(`Failed to fetch suggestions: ${response.statusText}`)
      }

      const data = await response.json()
      setSuggestions(data.features || [])
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching location suggestions:', error)
        setSuggestions([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    setSelectedIndex(-1)
    setIsOpen(true)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for debounced search
    timeoutRef.current = setTimeout(() => {
      searchPlaces(newQuery)
    }, 300)
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (feature: MapboxFeature) => {
    const locationData: LocationData = {
      latitude: feature.center[1],
      longitude: feature.center[0],
      place_id: feature.id,
      place_name: feature.place_name,
      address: feature.properties?.address
    }

    setQuery(feature.place_name)
    setIsOpen(false)
    setSuggestions([])
    setSelectedIndex(-1)
    onChange(locationData)
  }

  // Handle clear selection
  const handleClear = () => {
    setQuery('')
    setIsOpen(false)
    setSuggestions([])
    setSelectedIndex(-1)
    onChange(null)
    inputRef.current?.focus()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

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
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
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
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* Suggestions dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className={cn(
                  "w-full px-3 py-2 text-left hover:bg-muted transition-colors",
                  "flex items-start gap-2 border-b border-border last:border-b-0",
                  selectedIndex === index && "bg-muted"
                )}
              >
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {suggestion.place_name.split(',')[0]}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {suggestion.place_name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}
    </div>
  )
}
