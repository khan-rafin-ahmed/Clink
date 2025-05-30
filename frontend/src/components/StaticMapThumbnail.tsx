import { useState } from 'react'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LocationData } from '@/types'

interface StaticMapThumbnailProps {
  location: LocationData
  className?: string
  width?: number
  height?: number
  zoom?: number
}

export function StaticMapThumbnail({
  location,
  className,
  width = 300,
  height = 200,
  zoom = 14
}: StaticMapThumbnailProps) {
  const { latitude, longitude } = location
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted rounded-lg border",
          "text-muted-foreground",
          className
        )}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="text-sm">Map configuration required</div>
        </div>
      </div>
    )
  }

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
    `center=${latitude},${longitude}` +
    `&zoom=${zoom}` +
    `&size=${width}x${height}` +
    `&markers=color:red%7C${latitude},${longitude}` +
    `&key=${apiKey}` +
    `&style=feature:all|element:all|invert_lightness:true|saturation:10|lightness:30|gamma:0.5|hue:0x435158`

  return (
    <img
      src={mapUrl}
      alt={`Map showing ${location.place_name}`}
      className={cn("rounded-lg", className)}
      width={width}
      height={height}
    />
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
      className={cn("rounded-full", className)}
    />
  )
}
