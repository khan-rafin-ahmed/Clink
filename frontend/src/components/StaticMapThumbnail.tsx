import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StaticMapThumbnailProps {
  latitude: number
  longitude: number
  placeName?: string
  width?: number
  height?: number
  zoom?: number
  className?: string
  showPin?: boolean
  onClick?: () => void
}

export function StaticMapThumbnail({
  latitude,
  longitude,
  placeName,
  width = 300,
  height = 200,
  zoom = 14,
  className,
  showPin = true,
  onClick
}: StaticMapThumbnailProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
  const MAPBOX_STYLE_URL = import.meta.env.VITE_MAPBOX_STYLE_URL

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg border",
          "text-muted-foreground text-sm",
          onClick && "cursor-pointer hover:bg-muted/80 transition-colors",
          className
        )}
        style={{ width, height }}
        onClick={onClick}
      >
        <div className="text-center">
          <MapPin className="w-6 h-6 mx-auto mb-1" />
          <div className="font-medium">Map Preview</div>
          {placeName && (
            <div className="text-xs truncate max-w-[200px]">{placeName}</div>
          )}
        </div>
      </div>
    )
  }

  // Extract style ID from the style URL
  const styleId = MAPBOX_STYLE_URL?.includes('mapbox://styles/') 
    ? MAPBOX_STYLE_URL.replace('mapbox://styles/', '')
    : 'mapbox/streets-v12'

  // Build the static map URL
  const staticMapUrl = `https://api.mapbox.com/styles/v1/${styleId}/static/${
    showPin ? `pin-s+ff6b35(${longitude},${latitude})/` : ''
  }${longitude},${latitude},${zoom}/${width}x${height}@2x?access_token=${MAPBOX_ACCESS_TOKEN}`

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }

  if (imageError) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg border",
          "text-muted-foreground text-sm",
          onClick && "cursor-pointer hover:bg-muted/80 transition-colors",
          className
        )}
        style={{ width, height }}
        onClick={onClick}
      >
        <div className="text-center">
          <MapPin className="w-6 h-6 mx-auto mb-1" />
          <div className="font-medium">Map Unavailable</div>
          {placeName && (
            <div className="text-xs truncate max-w-[200px]">{placeName}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "relative rounded-lg overflow-hidden border bg-muted",
        onClick && "cursor-pointer hover:opacity-90 transition-opacity",
        className
      )}
      style={{ width, height }}
      onClick={onClick}
    >
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-muted"
          style={{ width, height }}
        >
          <div className="text-center text-muted-foreground">
            <MapPin className="w-6 h-6 mx-auto mb-1 animate-pulse" />
            <div className="text-sm">Loading map...</div>
          </div>
        </div>
      )}
      
      <img
        src={staticMapUrl}
        alt={placeName ? `Map of ${placeName}` : 'Event location map'}
        className={cn(
          "w-full h-full object-cover transition-opacity",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      
      {/* Overlay with place name */}
      {placeName && !isLoading && !imageError && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <div className="text-white text-xs font-medium truncate">
            {placeName}
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for small cards
export function StaticMapPin({
  latitude,
  longitude,
  placeName,
  className
}: Pick<StaticMapThumbnailProps, 'latitude' | 'longitude' | 'placeName' | 'className'>) {
  return (
    <StaticMapThumbnail
      latitude={latitude}
      longitude={longitude}
      placeName={placeName}
      width={40}
      height={40}
      zoom={12}
      showPin={false}
      className={cn("rounded-full", className)}
    />
  )
}
