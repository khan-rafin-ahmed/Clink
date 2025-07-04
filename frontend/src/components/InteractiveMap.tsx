import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { loadGoogleMapsAPI } from '@/lib/googleMapsLoader'
import type { LocationData } from '@/types'

interface InteractiveMapProps {
  location: LocationData
  height?: number
  zoom?: number
  className?: string
  onLocationChange?: (location: LocationData) => void
}

export function InteractiveMap({
  location,
  height = 200,
  zoom = 14,
  className,
  onLocationChange
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)

  useEffect(() => {
    const initializeMap = async () => {
      try {
        await loadGoogleMapsAPI();

        if (!mapRef.current) return;

        const center = { lat: location.latitude, lng: location.longitude }

    const mapOptions: google.maps.MapOptions = {
      center,
      zoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'all',
          elementType: 'all',
          stylers: [
            { invert_lightness: true },
            { saturation: 10 },
            { lightness: 30 },
            { gamma: 0.5 },
            { hue: '#435158' }
          ]
        }
      ]
    }

    const map = new google.maps.Map(mapRef.current, mapOptions)

    const markerOptions: google.maps.MarkerOptions = {
      position: center,
      map,
      draggable: !!onLocationChange,
      animation: google.maps.Animation.DROP
    }

    const marker = new google.maps.Marker(markerOptions)

    if (onLocationChange) {
      marker.addListener('dragend', () => {
        const position = marker.getPosition()
        if (position) {
          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: position }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
              onLocationChange({
                latitude: position.lat(),
                longitude: position.lng(),
                place_id: results[0].place_id || '',
                place_name: results[0].formatted_address || '',
                address: results[0].formatted_address
              })
            }
          })
        }
      })
    }

        mapInstanceRef.current = map
        markerRef.current = marker
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
      }
    }

    initializeMap();

    return () => {
      if (markerRef.current) {
        google.maps.event.clearInstanceListeners(markerRef.current)
        markerRef.current.setMap(null)
      }
    }
  }, [location, zoom, onLocationChange])

  return (
    <div
      ref={mapRef}
      className={cn("w-full rounded-xl overflow-hidden border border-border/30 backdrop-blur-sm", className)}
      style={{ height }}
    />
  )
}
