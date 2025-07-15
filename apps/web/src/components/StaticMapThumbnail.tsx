import { cn } from '@/lib/utils'
import type { LocationData } from '@/types'

interface StaticMapThumbnailProps {
  location: LocationData
  width?: number
  height?: number
  zoom?: number
  className?: string
}

export function StaticMapThumbnail({
  location,
  width = 300,
  height = 200,
  zoom = 14,
  className
}: StaticMapThumbnailProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const center = `${location.latitude},${location.longitude}`
  const size = `${width}x${height}`

  // Check if API key is configured
  if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    return (
      <div className={cn("relative overflow-hidden rounded-lg border border-border/50 bg-muted flex items-center justify-center", className)}>
        <div className="text-center p-4">
          <div className="text-muted-foreground text-sm">
            📍 Map Preview
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {location.place_name}
          </div>
        </div>
      </div>
    )
  }

  // Custom dark style for better integration with the app theme
  const style = 'style=feature:all|element:geometry|color:0x212121&style=feature:all|element:labels.icon|visibility:off&style=feature:all|element:labels.text.fill|color:0x757575&style=feature:all|element:labels.text.stroke|color:0x212121&style=feature:administrative|element:geometry|color:0x757575&style=feature:administrative.country|element:labels.text.fill|color:0x9e9e9e&style=feature:administrative.locality|element:labels.text.fill|color:0xbdbdbd&style=feature:poi|element:labels.text.fill|color:0x757575&style=feature:poi.park|element:geometry|color:0x181818&style=feature:poi.park|element:labels.text.fill|color:0x616161&style=feature:road|element:geometry.fill|color:0x2c2c2c&style=feature:road|element:labels.text.fill|color:0x8a8a8a&style=feature:road.arterial|element:geometry|color:0x373737&style=feature:road.highway|element:geometry|color:0x3c3c3c&style=feature:road.highway.controlled_access|element:geometry|color:0x4e4e4e&style=feature:road.local|element:labels.text.fill|color:0x616161&style=feature:transit|element:labels.text.fill|color:0x757575&style=feature:water|element:geometry|color:0x000000&style=feature:water|element:labels.text.fill|color:0x3d3d3d'

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=${zoom}&size=${size}&markers=color:0xFFD700%7C${center}&${style}&key=${apiKey}`

  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-border/50", className)}>
      <img
        src={mapUrl}
        alt={`Map of ${location.place_name}`}
        width={width}
        height={height}
        className="w-full h-full object-cover"
      />
      {/* Custom overlay to hide Google logo */}
      <div className="absolute bottom-0 right-0 w-16 h-6 bg-gradient-to-l from-black/80 to-transparent" />
    </div>
  )
}

// Compact version for smaller spaces
export function CompactStaticMapThumbnail({
  location,
  className
}: Pick<StaticMapThumbnailProps, 'location' | 'className'>) {
  return (
    <StaticMapThumbnail
      location={location}
      width={40}
      height={40}
      zoom={12}
      className={cn("rounded-full border-2 border-primary/20", className)}
    />
  )
}
