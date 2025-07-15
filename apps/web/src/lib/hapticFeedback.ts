/**
 * Haptic Feedback System for Liquid Glass Interactions
 * Provides tactile feedback for mobile devices to enhance glass interactions
 */

export interface HapticConfig {
  enabled: boolean
  intensity: 'light' | 'medium' | 'heavy'
  patterns: {
    glassClick: number[]
    drinkSplash: number[]
    success: number[]
    error: number[]
    navigation: number[]
  }
}

class HapticFeedbackManager {
  private config: HapticConfig = {
    enabled: true,
    intensity: 'medium',
    patterns: {
      glassClick: [10], // Single short vibration
      drinkSplash: [20, 50, 20], // Splash pattern
      success: [10, 30, 10], // Success pattern
      error: [50, 100, 50], // Error pattern
      navigation: [5] // Subtle navigation feedback
    }
  }

  private isSupported = false
  private vibrationAPI: any = null

  constructor() {
    this.detectSupport()
    this.loadUserPreferences()
  }

  private detectSupport() {
    // Check for Vibration API support
    if ('vibrate' in navigator) {
      this.vibrationAPI = navigator.vibrate.bind(navigator)
      this.isSupported = true
    }
    
    // Check for iOS Haptic Feedback (iOS 10+)
    if ('DeviceMotionEvent' in window && 'requestPermission' in (DeviceMotionEvent as any)) {
      this.isSupported = true
    }

    // Check for Android Haptic Feedback
    if ('vibrate' in navigator || 'webkitVibrate' in navigator) {
      this.vibrationAPI = (navigator as any).vibrate || (navigator as any).webkitVibrate
      this.isSupported = true
    }
  }

  private loadUserPreferences() {
    try {
      const saved = localStorage.getItem('thirstee_haptic_config')
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('Failed to load haptic preferences:', error)
    }
  }

  private saveUserPreferences() {
    try {
      localStorage.setItem('thirstee_haptic_config', JSON.stringify(this.config))
    } catch (error) {
      console.warn('Failed to save haptic preferences:', error)
    }
  }

  private getIntensityMultiplier(): number {
    switch (this.config.intensity) {
      case 'light': return 0.5
      case 'medium': return 1.0
      case 'heavy': return 1.5
      default: return 1.0
    }
  }

  private adjustPattern(pattern: number[]): number[] {
    const multiplier = this.getIntensityMultiplier()
    return pattern.map(duration => Math.round(duration * multiplier))
  }

  // Core vibration method
  private vibrate(pattern: number | number[]) {
    if (!this.config.enabled || !this.isSupported) return

    try {
      if (this.vibrationAPI) {
        this.vibrationAPI(pattern)
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }

  // Public API methods
  trigger(patternName: keyof HapticConfig['patterns'], options?: { intensity?: number }) {
    if (!this.config.enabled) return

    const pattern = this.config.patterns[patternName]
    if (!pattern) {
      console.warn(`Haptic pattern '${patternName}' not found`)
      return
    }

    let adjustedPattern = this.adjustPattern(pattern)
    
    if (options?.intensity) {
      adjustedPattern = adjustedPattern.map(duration => 
        Math.round(duration * options.intensity!)
      )
    }

    this.vibrate(adjustedPattern)
  }

  // Convenience methods for common interactions
  glassClick(intensity?: number) {
    this.trigger('glassClick', { intensity })
  }

  drinkSplash(intensity?: number) {
    this.trigger('drinkSplash', { intensity })
  }

  success(intensity?: number) {
    this.trigger('success', { intensity })
  }

  error(intensity?: number) {
    this.trigger('error', { intensity })
  }

  navigation(intensity?: number) {
    this.trigger('navigation', { intensity })
  }

  // Custom vibration patterns
  customVibrate(pattern: number | number[], intensity?: number) {
    if (!this.config.enabled) return

    let adjustedPattern: number | number[]
    
    if (Array.isArray(pattern)) {
      adjustedPattern = this.adjustPattern(pattern)
      if (intensity) {
        adjustedPattern = adjustedPattern.map(duration => 
          Math.round(duration * intensity)
        )
      }
    } else {
      adjustedPattern = Math.round(pattern * this.getIntensityMultiplier())
      if (intensity) {
        adjustedPattern = Math.round(adjustedPattern * intensity)
      }
    }

    this.vibrate(adjustedPattern)
  }

  // Glass-specific haptic patterns
  glassShatter() {
    this.customVibrate([30, 20, 40, 20, 50], 1.2)
  }

  glassRipple() {
    this.customVibrate([5, 10, 15, 20, 15, 10, 5], 0.8)
  }

  glassFloat() {
    this.customVibrate([8, 15, 8], 0.6)
  }

  // Configuration methods
  setEnabled(enabled: boolean) {
    this.config.enabled = enabled
    this.saveUserPreferences()
  }

  setIntensity(intensity: 'light' | 'medium' | 'heavy') {
    this.config.intensity = intensity
    this.saveUserPreferences()
  }

  setPattern(patternName: keyof HapticConfig['patterns'], pattern: number[]) {
    this.config.patterns[patternName] = pattern
    this.saveUserPreferences()
  }

  getConfig(): HapticConfig {
    return { ...this.config }
  }

  isHapticSupported(): boolean {
    return this.isSupported
  }

  // Request permissions for iOS devices
  async requestPermission(): Promise<boolean> {
    if ('DeviceMotionEvent' in window && 'requestPermission' in (DeviceMotionEvent as any)) {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        return permission === 'granted'
      } catch (error) {
        console.warn('Failed to request haptic permission:', error)
        return false
      }
    }
    return this.isSupported
  }

  // Test haptic feedback
  test() {
    if (!this.isSupported) {
      console.warn('Haptic feedback not supported on this device')
      return
    }

    // Play a test pattern
    this.customVibrate([100, 50, 100, 50, 200])
  }
}

// Create singleton instance
export const hapticFeedback = new HapticFeedbackManager()

// React hook for haptic feedback
export function useHapticFeedback() {
  return {
    trigger: hapticFeedback.trigger.bind(hapticFeedback),
    glassClick: hapticFeedback.glassClick.bind(hapticFeedback),
    drinkSplash: hapticFeedback.drinkSplash.bind(hapticFeedback),
    success: hapticFeedback.success.bind(hapticFeedback),
    error: hapticFeedback.error.bind(hapticFeedback),
    navigation: hapticFeedback.navigation.bind(hapticFeedback),
    customVibrate: hapticFeedback.customVibrate.bind(hapticFeedback),
    glassShatter: hapticFeedback.glassShatter.bind(hapticFeedback),
    glassRipple: hapticFeedback.glassRipple.bind(hapticFeedback),
    glassFloat: hapticFeedback.glassFloat.bind(hapticFeedback),
    setEnabled: hapticFeedback.setEnabled.bind(hapticFeedback),
    setIntensity: hapticFeedback.setIntensity.bind(hapticFeedback),
    getConfig: hapticFeedback.getConfig.bind(hapticFeedback),
    isSupported: hapticFeedback.isHapticSupported.bind(hapticFeedback),
    requestPermission: hapticFeedback.requestPermission.bind(hapticFeedback),
    test: hapticFeedback.test.bind(hapticFeedback)
  }
}

// Auto-detect device capabilities
if (typeof window !== 'undefined') {
  // Disable logging to reduce console noise
  // console.log('Haptic feedback support:', hapticFeedback.isHapticSupported())
}
