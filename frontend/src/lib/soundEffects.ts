/**
 * Sound Effects System for Liquid Glass Interactions
 * Provides audio feedback for glass interactions and drinking-themed actions
 */

export interface SoundConfig {
  volume: number
  enabled: boolean
  preload: boolean
}

class SoundEffectsManager {
  private sounds: Map<string, HTMLAudioElement> = new Map()
  private config: SoundConfig = {
    volume: 0.3,
    enabled: true,
    preload: true
  }

  constructor() {
    this.initializeSounds()
    this.loadUserPreferences()
  }

  private initializeSounds() {
    const soundDefinitions = {
      // Glass interaction sounds
      glassClick: {
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
        volume: 0.2
      },
      glassHover: {
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
        volume: 0.1
      },
      
      // Drinking-themed sounds
      drinkSplash: {
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
        volume: 0.4
      },
      beerClink: {
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
        volume: 0.3
      },
      
      // UI feedback sounds
      success: {
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
        volume: 0.25
      },
      error: {
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
        volume: 0.2
      },
      
      // Navigation sounds
      pageTransition: {
        url: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
        volume: 0.15
      }
    }

    // Create audio elements for each sound
    Object.entries(soundDefinitions).forEach(([key, sound]) => {
      const audio = new Audio(sound.url)
      audio.volume = sound.volume * this.config.volume
      audio.preload = this.config.preload ? 'auto' : 'none'
      this.sounds.set(key, audio)
    })
  }

  private loadUserPreferences() {
    try {
      const saved = localStorage.getItem('thirstee_sound_config')
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) }
      }
    } catch (error) {
      console.warn('Failed to load sound preferences:', error)
    }
  }

  private saveUserPreferences() {
    try {
      localStorage.setItem('thirstee_sound_config', JSON.stringify(this.config))
    } catch (error) {
      console.warn('Failed to save sound preferences:', error)
    }
  }

  // Public API methods
  play(soundName: string, options?: { volume?: number; delay?: number }) {
    if (!this.config.enabled) return

    const sound = this.sounds.get(soundName)
    if (!sound) {
      console.warn(`Sound '${soundName}' not found`)
      return
    }

    const playSound = () => {
      try {
        sound.currentTime = 0
        if (options?.volume !== undefined) {
          sound.volume = options.volume * this.config.volume
        }
        sound.play().catch(error => {
          // Ignore autoplay policy errors
          if (!error.message.includes('autoplay')) {
            console.warn('Failed to play sound:', error)
          }
        })
      } catch (error) {
        console.warn('Error playing sound:', error)
      }
    }

    if (options?.delay) {
      setTimeout(playSound, options.delay)
    } else {
      playSound()
    }
  }

  // Convenience methods for common interactions
  glassClick() {
    this.play('glassClick')
  }

  glassHover() {
    this.play('glassHover')
  }

  drinkSplash() {
    this.play('drinkSplash')
  }

  beerClink() {
    this.play('beerClink')
  }

  success() {
    this.play('success')
  }

  error() {
    this.play('error')
  }

  pageTransition() {
    this.play('pageTransition')
  }

  // Configuration methods
  setVolume(volume: number) {
    this.config.volume = Math.max(0, Math.min(1, volume))
    this.sounds.forEach(sound => {
      sound.volume = sound.volume * this.config.volume
    })
    this.saveUserPreferences()
  }

  setEnabled(enabled: boolean) {
    this.config.enabled = enabled
    this.saveUserPreferences()
  }

  getConfig(): SoundConfig {
    return { ...this.config }
  }

  // Preload all sounds for better performance
  preloadAll() {
    this.sounds.forEach(sound => {
      sound.load()
    })
  }
}

// Create singleton instance
export const soundEffects = new SoundEffectsManager()

// React hook for sound effects
export function useSoundEffects() {
  return {
    play: soundEffects.play.bind(soundEffects),
    glassClick: soundEffects.glassClick.bind(soundEffects),
    glassHover: soundEffects.glassHover.bind(soundEffects),
    drinkSplash: soundEffects.drinkSplash.bind(soundEffects),
    beerClink: soundEffects.beerClink.bind(soundEffects),
    success: soundEffects.success.bind(soundEffects),
    error: soundEffects.error.bind(soundEffects),
    pageTransition: soundEffects.pageTransition.bind(soundEffects),
    setVolume: soundEffects.setVolume.bind(soundEffects),
    setEnabled: soundEffects.setEnabled.bind(soundEffects),
    getConfig: soundEffects.getConfig.bind(soundEffects),
    preloadAll: soundEffects.preloadAll.bind(soundEffects)
  }
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  // Preload sounds after user interaction
  const initSounds = () => {
    soundEffects.preloadAll()
    document.removeEventListener('click', initSounds)
    document.removeEventListener('touchstart', initSounds)
  }
  
  document.addEventListener('click', initSounds, { once: true })
  document.addEventListener('touchstart', initSounds, { once: true })
}
