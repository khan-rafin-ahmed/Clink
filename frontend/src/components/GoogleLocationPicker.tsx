import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { googlePlacesService } from '@/lib/googlePlacesService'
import type { LocationData } from '@/types'

interface GoogleLocationPickerProps {
  value?: LocationData | null
  onChange: (location: LocationData | null) => void
  onSelect?: (location: LocationData) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  error?: string
}

export function GoogleLocationPicker({
  value,
  onChange,
  onSelect,
  placeholder = "Search for a location...",
  label,
  required = false,
  className,
  error
}: GoogleLocationPickerProps) {
  const [query, setQuery] = useState(value?.place_name || '')
  const inputRef = useRef<HTMLInputElement>(null)
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([])

  const fetchPredictions = async (input: string) => {
    if (input.length < 3) {
      setPredictions([])
      return
    }

    try {
      const preds = await googlePlacesService.getPredictions(input, {
        componentRestrictions: { country: 'bd' },
        types: ['establishment', 'geocode']
      })
      setPredictions(preds)
    } catch (error) {
      console.error('Error fetching predictions:', error)
      setPredictions([])
    }
  }

  const handleSelectPrediction = async (pred: google.maps.places.AutocompletePrediction) => {
    if (!pred.place_id) return

    try {
      const locationData = await googlePlacesService.getPlaceDetails(pred.place_id)
      if (locationData) {
        setQuery(locationData.place_name)
        onChange(locationData)
        onSelect?.(locationData)
        setPredictions([]) // Clear predictions after selection
      }
    } catch (error) {
      console.error('Error getting place details:', error)
    }
  }

  // Handle clear selection
  const handleClear = () => {
    setQuery('');
    onChange(null);
    setPredictions([]); // Clear predictions on clear
    inputRef.current?.focus();
  };

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
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              fetchPredictions(val);
            }}
            placeholder={placeholder}
            className={cn(
              "pl-10 pr-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-400",
              "focus:border-gold-500 focus:ring-gold-500/20",
              error && "border-destructive focus:border-destructive"
            )}
            required={required}
          />
          {predictions.length > 0 && (
             <ul className="absolute z-10 bg-gray-900 border border-gold-500 rounded-md w-full mt-1 max-h-60 overflow-auto">
               {predictions.map(pred => (
                 <li
                   key={pred.place_id}
                   className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-800 text-white"
                   onClick={() => handleSelectPrediction(pred)}
                 >
                   <MapPin className="w-4 h-4 mr-2" />
                   <span>
                     <strong>{pred.structured_formatting.main_text}</strong>{' '}
                     <small className="opacity-75">{pred.structured_formatting.secondary_text}</small>
                   </span>
                 </li>
               ))}
               <li className="px-4 py-2 text-xs text-gray-400 text-center">Powered by Google</li>
             </ul>
           )}
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