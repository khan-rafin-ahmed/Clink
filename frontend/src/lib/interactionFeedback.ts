/**
 * Enhanced Interaction Feedback System
 * Combines sound effects and haptic feedback for immersive liquid glass interactions
 */

import { soundEffects, useSoundEffects } from './soundEffects'
import { hapticFeedback, useHapticFeedback } from './hapticFeedback'

export interface InteractionConfig {
  sound: boolean
  haptic: boolean
  visual: boolean
  intensity: 'subtle' | 'normal' | 'intense'
}

class InteractionFeedbackManager {
  private config: InteractionConfig = {
    sound: true,
    haptic: true,
    visual: true,
    intensity: 'normal'
  }

  constructor() {
    this.loadUserPreferences()
  }

  private loadUserPreferences() {
    try {
      const saved = localStorage.getItem('thirstee_interaction_config')
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('Failed to load interaction preferences:', error)
    }
  }

  private saveUserPreferences() {
    try {
      localStorage.setItem('thirstee_interaction_config', JSON.stringify(this.config))
    } catch (error) {
      console.warn('Failed to save interaction preferences:', error)
    }
  }

  private getIntensityMultiplier(): number {
    switch (this.config.intensity) {
      case 'subtle': return 0.6
      case 'normal': return 1.0
      case 'intense': return 1.4
      default: return 1.0
    }
  }

  // Core interaction methods
  glassClick(element?: HTMLElement) {
    const intensity = this.getIntensityMultiplier()
    
    if (this.config.sound) {
      soundEffects.glassClick()
    }
    
    if (this.config.haptic) {
      hapticFeedback.glassClick(intensity)
    }
    
    if (this.config.visual && element) {
      this.addVisualFeedback(element, 'glass-click')
    }
  }

  glassHover(element?: HTMLElement) {
    const intensity = this.getIntensityMultiplier() * 0.5 // Lighter for hover
    
    if (this.config.sound) {
      soundEffects.glassHover()
    }
    
    if (this.config.haptic) {
      hapticFeedback.glassFloat()
    }
    
    if (this.config.visual && element) {
      this.addVisualFeedback(element, 'glass-hover')
    }
  }

  drinkSplash(element?: HTMLElement) {
    const intensity = this.getIntensityMultiplier()
    
    if (this.config.sound) {
      soundEffects.drinkSplash()
    }
    
    if (this.config.haptic) {
      hapticFeedback.drinkSplash(intensity)
    }
    
    if (this.config.visual && element) {
      this.addVisualFeedback(element, 'drink-splash')
    }
  }

  beerClink(element?: HTMLElement) {
    const intensity = this.getIntensityMultiplier()
    
    if (this.config.sound) {
      soundEffects.beerClink()
    }
    
    if (this.config.haptic) {
      hapticFeedback.customVibrate([20, 10, 30], intensity)
    }
    
    if (this.config.visual && element) {
      this.addVisualFeedback(element, 'beer-clink')
    }
  }

  success(element?: HTMLElement) {
    const intensity = this.getIntensityMultiplier()
    
    if (this.config.sound) {
      soundEffects.success()
    }
    
    if (this.config.haptic) {
      hapticFeedback.success(intensity)
    }
    
    if (this.config.visual && element) {
      this.addVisualFeedback(element, 'success')
    }
  }

  error(element?: HTMLElement) {
    const intensity = this.getIntensityMultiplier()
    
    if (this.config.sound) {
      soundEffects.error()
    }
    
    if (this.config.haptic) {
      hapticFeedback.error(intensity)
    }
    
    if (this.config.visual && element) {
      this.addVisualFeedback(element, 'error')
    }
  }

  glassShatter(element?: HTMLElement) {
    const intensity = this.getIntensityMultiplier()
    
    if (this.config.sound) {
      soundEffects.error() // Use error sound for shatter
    }
    
    if (this.config.haptic) {
      hapticFeedback.glassShatter()
    }
    
    if (this.config.visual && element) {
      this.addVisualFeedback(element, 'glass-shatter')
    }
  }

  pageTransition() {
    if (this.config.sound) {
      soundEffects.pageTransition()
    }
    
    if (this.config.haptic) {
      hapticFeedback.navigation()
    }
  }

  // Visual feedback system
  private addVisualFeedback(element: HTMLElement, type: string) {
    // Remove any existing feedback classes
    element.classList.remove('feedback-active')
    
    // Add feedback class based on type
    switch (type) {
      case 'glass-click':
        element.classList.add('ripple-effect')
        break
      case 'glass-hover':
        element.classList.add('hover-glow')
        break
      case 'drink-splash':
        element.classList.add('drink-splash')
        break
      case 'beer-clink':
        element.classList.add('scale-in-bounce')
        break
      case 'success':
        element.classList.add('pulse-glow')
        break
      case 'error':
        element.classList.add('glass-shatter')
        break
      case 'glass-shatter':
        element.classList.add('glass-shatter')
        break
    }
    
    // Add active feedback class
    element.classList.add('feedback-active')
    
    // Remove classes after animation
    setTimeout(() => {
      element.classList.remove('feedback-active')
    }, 600)
  }

  // Configuration methods
  setConfig(config: Partial<InteractionConfig>) {
    this.config = { ...this.config, ...config }
    this.saveUserPreferences()
  }

  getConfig(): InteractionConfig {
    return { ...this.config }
  }

  // Convenience methods for enabling/disabling features
  setSoundEnabled(enabled: boolean) {
    this.config.sound = enabled
    soundEffects.setEnabled(enabled)
    this.saveUserPreferences()
  }

  setHapticEnabled(enabled: boolean) {
    this.config.haptic = enabled
    hapticFeedback.setEnabled(enabled)
    this.saveUserPreferences()
  }

  setVisualEnabled(enabled: boolean) {
    this.config.visual = enabled
    this.saveUserPreferences()
  }

  setIntensity(intensity: 'subtle' | 'normal' | 'intense') {
    this.config.intensity = intensity
    this.saveUserPreferences()
  }

  // Test all feedback systems
  test() {
    console.log('Testing interaction feedback systems...')
    
    setTimeout(() => this.glassClick(), 0)
    setTimeout(() => this.drinkSplash(), 500)
    setTimeout(() => this.beerClink(), 1000)
    setTimeout(() => this.success(), 1500)
  }
}

// Create singleton instance
export const interactionFeedback = new InteractionFeedbackManager()

// React hook for interaction feedback
export function useInteractionFeedback() {
  return {
    glassClick: interactionFeedback.glassClick.bind(interactionFeedback),
    glassHover: interactionFeedback.glassHover.bind(interactionFeedback),
    drinkSplash: interactionFeedback.drinkSplash.bind(interactionFeedback),
    beerClink: interactionFeedback.beerClink.bind(interactionFeedback),
    success: interactionFeedback.success.bind(interactionFeedback),
    error: interactionFeedback.error.bind(interactionFeedback),
    glassShatter: interactionFeedback.glassShatter.bind(interactionFeedback),
    pageTransition: interactionFeedback.pageTransition.bind(interactionFeedback),
    setConfig: interactionFeedback.setConfig.bind(interactionFeedback),
    getConfig: interactionFeedback.getConfig.bind(interactionFeedback),
    setSoundEnabled: interactionFeedback.setSoundEnabled.bind(interactionFeedback),
    setHapticEnabled: interactionFeedback.setHapticEnabled.bind(interactionFeedback),
    setVisualEnabled: interactionFeedback.setVisualEnabled.bind(interactionFeedback),
    setIntensity: interactionFeedback.setIntensity.bind(interactionFeedback),
    test: interactionFeedback.test.bind(interactionFeedback)
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  console.log('🎵 Interaction feedback system initialized')
}
