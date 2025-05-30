import { useState } from 'react'
import { MapPin } from 'lucide-react'
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
  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center}&zoom=${zoom}&size=${size}&markers=color:red%7C${center}&key=${apiKey}`

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <img
        src={mapUrl}
        alt={`Map of ${location.place_name}`}
        width={width}
        height={height}
        className="w-full h-full object-cover"
      />
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
      className={cn("rounded-full", className)}
    />
  )
}
