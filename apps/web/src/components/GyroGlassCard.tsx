/**
 * Gyro-Reactive Glass Card Component
 * Responds to device orientation for immersive 3D glass effects
 */

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface GyroGlassCardProps {
  children: React.ReactNode
  className?: string
  intensity?: number
  enableGyro?: boolean
  fallbackToMouse?: boolean
  glassEffect?: 'subtle' | 'normal' | 'intense'
}

interface GyroData {
  alpha: number // Z-axis rotation
  beta: number  // X-axis rotation
  gamma: number // Y-axis rotation
}

export function GyroGlassCard({
  children,
  className,
  intensity = 1,
  enableGyro = true,
  fallbackToMouse = true,
  glassEffect = 'normal'
}: GyroGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [gyroData, setGyroData] = useState<GyroData>({ alpha: 0, beta: 0, gamma: 0 })
  const [isGyroSupported, setIsGyroSupported] = useState(false)
  const [isGyroEnabled, setIsGyroEnabled] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  // Check for gyroscope support
  useEffect(() => {
    const checkGyroSupport = () => {
      if ('DeviceOrientationEvent' in window) {
        setIsGyroSupported(true)
        
        // Request permission for iOS 13+
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
          (DeviceOrientationEvent as any).requestPermission()
            .then((response: string) => {
              if (response === 'granted') {
                setIsGyroEnabled(true)
              }
            })
            .catch(console.error)
        } else {
          setIsGyroEnabled(true)
        }
      }
    }

    if (enableGyro) {
      checkGyroSupport()
    }
  }, [enableGyro])

  // Gyroscope event handler
  useEffect(() => {
    if (!isGyroEnabled || !enableGyro) return

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      setGyroData({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0
      })
    }

    window.addEventListener('deviceorientation', handleDeviceOrientation)
    return () => window.removeEventListener('deviceorientation', handleDeviceOrientation)
  }, [isGyroEnabled, enableGyro])

  // Mouse movement fallback
  useEffect(() => {
    if (!fallbackToMouse || (isGyroEnabled && enableGyro)) return

    const handleMouseMove = (event: MouseEvent) => {
      if (!cardRef.current || !isHovered) return

      const rect = cardRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const x = (event.clientX - centerX) / (rect.width / 2)
      const y = (event.clientY - centerY) / (rect.height / 2)
      
      setMousePosition({ x, y })
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [fallbackToMouse, isGyroEnabled, enableGyro, isHovered])

  // Calculate transform based on gyro or mouse data
  const getTransform = () => {
    let rotateX = 0
    let rotateY = 0
    let rotateZ = 0

    if (isGyroEnabled && enableGyro) {
      // Use gyroscope data
      rotateX = (gyroData.beta - 90) * intensity * 0.1
      rotateY = gyroData.gamma * intensity * 0.1
      rotateZ = gyroData.alpha * intensity * 0.05
    } else if (fallbackToMouse && isHovered) {
      // Use mouse position
      rotateX = mousePosition.y * intensity * 10
      rotateY = mousePosition.x * intensity * -10
    }

    // Clamp values to prevent extreme rotations
    rotateX = Math.max(-15, Math.min(15, rotateX))
    rotateY = Math.max(-15, Math.min(15, rotateY))
    rotateZ = Math.max(-5, Math.min(5, rotateZ))

    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
  }

  // Get glass effect intensity
  const getGlassIntensity = () => {
    const baseIntensity = Math.abs(gyroData.gamma) + Math.abs(gyroData.beta)
    const mouseIntensity = Math.abs(mousePosition.x) + Math.abs(mousePosition.y)
    const totalIntensity = isGyroEnabled ? baseIntensity : mouseIntensity

    switch (glassEffect) {
      case 'subtle':
        return Math.min(0.3, totalIntensity * 0.01)
      case 'normal':
        return Math.min(0.6, totalIntensity * 0.02)
      case 'intense':
        return Math.min(1.0, totalIntensity * 0.03)
      default:
        return 0.6
    }
  }

  const glassIntensity = getGlassIntensity()

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative glass-card',
        className
      )}
      style={{
        // Removed heavy 3D transforms for performance
        // transform: getTransform(),
        // transformStyle: 'preserve-3d'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic glass overlay based on movement */}
      <div
        className="absolute inset-0 rounded-inherit pointer-events-none"
        style={{
          background: `linear-gradient(
            ${isGyroEnabled ? gyroData.gamma * 2 : mousePosition.x * 180}deg,
            rgba(255, 255, 255, ${glassIntensity * 0.1}) 0%,
            rgba(255, 255, 255, ${glassIntensity * 0.05}) 50%,
            rgba(255, 255, 255, ${glassIntensity * 0.1}) 100%
          )`,
          opacity: isHovered || isGyroEnabled ? 1 : 0
        }}
      />

      {/* Gyro-reactive highlight */}
      <div
        className="absolute inset-0 rounded-inherit pointer-events-none"
        style={{
          background: `radial-gradient(
            circle at ${50 + (isGyroEnabled ? gyroData.gamma : mousePosition.x * 50)}% ${50 + (isGyroEnabled ? gyroData.beta - 90 : mousePosition.y * 50)}%,
            rgba(255, 119, 71, ${glassIntensity * 0.2}) 0%,
            rgba(255, 119, 71, ${glassIntensity * 0.1}) 30%,
            transparent 70%
          )`,
          opacity: isHovered || isGyroEnabled ? 1 : 0
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (isGyroEnabled || isHovered) && (
        <div className="absolute top-2 right-2 text-xs text-white/70 bg-black/20 rounded px-2 py-1 font-mono">
          {isGyroEnabled ? (
            <>
              α: {gyroData.alpha.toFixed(1)}°<br />
              β: {gyroData.beta.toFixed(1)}°<br />
              γ: {gyroData.gamma.toFixed(1)}°
            </>
          ) : (
            <>
              X: {mousePosition.x.toFixed(2)}<br />
              Y: {mousePosition.y.toFixed(2)}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Hook for gyro data access
export function useGyroData() {
  const [gyroData, setGyroData] = useState<GyroData>({ alpha: 0, beta: 0, gamma: 0 })
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if ('DeviceOrientationEvent' in window) {
      setIsSupported(true)
      
      const handleOrientation = (event: DeviceOrientationEvent) => {
        setGyroData({
          alpha: event.alpha || 0,
          beta: event.beta || 0,
          gamma: event.gamma || 0
        })
      }

      window.addEventListener('deviceorientation', handleOrientation)
      return () => window.removeEventListener('deviceorientation', handleOrientation)
    }
  }, [])

  return { gyroData, isSupported }
}

// Utility function to request gyro permissions
export async function requestGyroPermission(): Promise<boolean> {
  if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
    try {
      const permission = await (DeviceOrientationEvent as any).requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to request gyro permission:', error)
      return false
    }
  }
  return 'DeviceOrientationEvent' in window
}
