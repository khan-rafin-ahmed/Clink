import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { LocationData } from '@/types'

interface InteractiveMapProps {
  location: LocationData
  className?: string
  zoom?: number
  height?: string
}

export function InteractiveMap({
  location,
  className,
  zoom = 15,
  height = '300px'
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)

  useEffect(() => {
    if (!mapRef.current || !window.google) return

    const { latitude, longitude } = location
    const position = { lat: latitude, lng: longitude }

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: position,
        zoom,
        styles: [
          {
            featureType: 'all',
            elementType: 'all',
            stylers: [{ invert_lightness: true }, { saturation: 10 }, { lightness: 30 }, { gamma: 0.5 }, { hue: '#435158' }]
          }
        ]
      })
    }

    // Update marker
    if (markerRef.current) {
      markerRef.current.setPosition(position)
    } else {
      markerRef.current = new google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        animation: google.maps.Animation.DROP
      })
    }

    // Update map center
    mapInstanceRef.current.setCenter(position)
  }, [location, zoom])

  return (
    <div
      ref={mapRef}
      className={cn("w-full rounded-lg overflow-hidden", className)}
      style={{ height }}
    />
  )
}
