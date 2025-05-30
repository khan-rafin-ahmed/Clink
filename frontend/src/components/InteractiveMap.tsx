import { useState, useCallback } from 'react'
import Map, { Marker, NavigationControl, FullscreenControl } from 'react-map-gl'
import { MapPin, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import 'mapbox-gl/dist/mapbox-gl.css'

interface InteractiveMapProps {
  latitude: number
  longitude: number
  placeName?: string
  className?: string
  height?: number | string
  zoom?: number
  showControls?: boolean
  showDirectionsButton?: boolean
}

export function InteractiveMap({
  latitude,
  longitude,
  placeName,
  className,
  height = 400,
  zoom = 14,
  showControls = true,
  showDirectionsButton = true
}: InteractiveMapProps) {
  const [viewState, setViewState] = useState({
    longitude,
    latitude,
    zoom
  })

  const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
  const MAPBOX_STYLE_URL = import.meta.env.VITE_MAPBOX_STYLE_URL || 'mapbox://styles/mapbox/dark-v11'

  const handleViewStateChange = useCallback((evt: any) => {
    setViewState(evt.viewState)
  }, [])

  const openDirections = () => {
    // Open directions in the user's default map app
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    window.open(url, '_blank')
  }

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg border",
          "text-muted-foreground",
          className
        )}
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="w-8 h-8 mx-auto mb-2" />
          <div className="font-medium mb-1">Interactive Map</div>
          <div className="text-sm">Map configuration required</div>
          {placeName && (
            <div className="text-sm mt-2 font-medium">{placeName}</div>
          )}
          {showDirectionsButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={openDirections}
              className="mt-3"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative rounded-lg overflow-hidden border", className)}>
      <Map
        {...viewState}
        onMove={handleViewStateChange}
        style={{ width: '100%', height }}
        mapStyle={MAPBOX_STYLE_URL}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        attributionControl={false}
        logoPosition="bottom-right"
      >
        {/* Custom marker */}
        <Marker
          longitude={longitude}
          latitude={latitude}
          anchor="bottom"
        >
          <div className="relative">
            {/* Custom pin design matching the app theme */}
            <div className="w-8 h-8 bg-primary rounded-full border-2 border-background shadow-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            {/* Pin shadow */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black/20 rounded-full blur-sm" />
          </div>
        </Marker>

        {/* Map controls */}
        {showControls && (
          <>
            <NavigationControl position="top-right" />
            <FullscreenControl position="top-right" />
          </>
        )}
      </Map>

      {/* Overlay with place name and directions button */}
      {(placeName || showDirectionsButton) && (
        <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {placeName && (
                <div className="font-medium text-foreground truncate">
                  {placeName}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </div>
            </div>
            {showDirectionsButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={openDirections}
                className="ml-3 flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Directions
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for smaller spaces
export function CompactInteractiveMap({
  latitude,
  longitude,
  placeName,
  className
}: Pick<InteractiveMapProps, 'latitude' | 'longitude' | 'placeName' | 'className'>) {
  return (
    <InteractiveMap
      latitude={latitude}
      longitude={longitude}
      placeName={placeName}
      height={250}
      zoom={13}
      showControls={false}
      showDirectionsButton={false}
      className={className}
    />
  )
}
