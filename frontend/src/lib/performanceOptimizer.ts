/**
 * Performance Optimization System for Liquid Glass Effects
 * Manages animation performance, battery usage, and device capabilities
 */

export interface PerformanceConfig {
  animationQuality: 'low' | 'medium' | 'high' | 'ultra'
  enableGPUAcceleration: boolean
  enableReducedMotion: boolean
  batteryOptimization: boolean
  frameRateTarget: 30 | 60 | 120
  adaptiveQuality: boolean
}

export interface DeviceCapabilities {
  isHighPerformance: boolean
  supportsGPUAcceleration: boolean
  batteryLevel?: number
  isLowPowerMode?: boolean
  deviceMemory?: number
  hardwareConcurrency: number
  connectionType?: string
}

class PerformanceOptimizer {
  private config: PerformanceConfig = {
    animationQuality: 'high',
    enableGPUAcceleration: true,
    enableReducedMotion: false,
    batteryOptimization: true,
    frameRateTarget: 60,
    adaptiveQuality: true
  }

  private capabilities: DeviceCapabilities = {
    isHighPerformance: true,
    supportsGPUAcceleration: true,
    hardwareConcurrency: navigator.hardwareConcurrency || 4
  }

  private frameRate = 60
  private lastFrameTime = 0
  private frameCount = 0
  private isMonitoring = false

  constructor() {
    this.detectCapabilities()
    this.loadUserPreferences()
    this.setupPerformanceMonitoring()
    this.adaptToSystemPreferences()
  }

  private detectCapabilities() {
    // Detect GPU acceleration support
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    this.capabilities.supportsGPUAcceleration = !!gl

    // Detect device memory (Chrome only)
    if ('deviceMemory' in navigator) {
      this.capabilities.deviceMemory = (navigator as any).deviceMemory
    }

    // Detect connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      this.capabilities.connectionType = connection.effectiveType
    }

    // Detect battery status
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.capabilities.batteryLevel = battery.level
        this.capabilities.isLowPowerMode = battery.level < 0.2

        battery.addEventListener('levelchange', () => {
          this.capabilities.batteryLevel = battery.level
          this.capabilities.isLowPowerMode = battery.level < 0.2
          this.adaptQualityToBattery()
        })
      })
    }

    // Determine if device is high performance
    this.capabilities.isHighPerformance = this.calculatePerformanceScore() > 0.7
  }

  private calculatePerformanceScore(): number {
    let score = 0.5 // Base score

    // CPU cores
    if (this.capabilities.hardwareConcurrency >= 8) score += 0.2
    else if (this.capabilities.hardwareConcurrency >= 4) score += 0.1

    // Memory
    if (this.capabilities.deviceMemory) {
      if (this.capabilities.deviceMemory >= 8) score += 0.2
      else if (this.capabilities.deviceMemory >= 4) score += 0.1
    }

    // GPU acceleration
    if (this.capabilities.supportsGPUAcceleration) score += 0.1

    // Connection quality
    if (this.capabilities.connectionType === '4g') score += 0.1
    else if (this.capabilities.connectionType === '3g') score -= 0.1

    return Math.min(1, Math.max(0, score))
  }

  private loadUserPreferences() {
    try {
      const saved = localStorage.getItem('thirstee_performance_config')
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) }
      }
    } catch (error) {
      // Handle error silently in production
    }
  }

  private saveUserPreferences() {
    try {
      localStorage.setItem('thirstee_performance_config', JSON.stringify(this.config))
    } catch (error) {
      // Handle error silently in production
    }
  }

  private adaptToSystemPreferences() {
    // Respect user's reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.config.enableReducedMotion = true
      this.config.animationQuality = 'low'
    }

    // Adapt to color scheme preference for battery optimization
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Dark mode can be more battery efficient on OLED displays
      this.config.batteryOptimization = true
    }
  }

  private setupPerformanceMonitoring() {
    if (!this.config.adaptiveQuality) return

    const monitor = () => {
      const now = performance.now()
      if (this.lastFrameTime) {
        const delta = now - this.lastFrameTime
        const currentFPS = 1000 / delta
        
        this.frameCount++
        if (this.frameCount % 60 === 0) { // Check every 60 frames
          this.frameRate = currentFPS
          this.adaptQualityToPerformance()
        }
      }
      this.lastFrameTime = now

      if (this.isMonitoring) {
        requestAnimationFrame(monitor)
      }
    }

    this.isMonitoring = true
    requestAnimationFrame(monitor)
  }

  private adaptQualityToPerformance() {
    if (!this.config.adaptiveQuality) return

    const targetFPS = this.config.frameRateTarget
    const currentFPS = this.frameRate

    if (currentFPS < targetFPS * 0.8) {
      // Performance is poor, reduce quality
      this.downgradeQuality()
    } else if (currentFPS > targetFPS * 1.1 && this.config.animationQuality !== 'ultra') {
      // Performance is good, can upgrade quality
      this.upgradeQuality()
    }
  }

  private adaptQualityToBattery() {
    if (!this.config.batteryOptimization) return

    if (this.capabilities.isLowPowerMode) {
      this.config.animationQuality = 'low'
      this.config.frameRateTarget = 30
      this.config.enableGPUAcceleration = false
    } else if (this.capabilities.batteryLevel && this.capabilities.batteryLevel < 0.5) {
      this.config.animationQuality = 'medium'
      this.config.frameRateTarget = 30
    }
  }

  private downgradeQuality() {
    switch (this.config.animationQuality) {
      case 'ultra':
        this.config.animationQuality = 'high'
        break
      case 'high':
        this.config.animationQuality = 'medium'
        break
      case 'medium':
        this.config.animationQuality = 'low'
        break
    }
    console.log('🔧 Performance: Downgraded to', this.config.animationQuality)
  }

  private upgradeQuality() {
    if (!this.capabilities.isHighPerformance) return

    switch (this.config.animationQuality) {
      case 'low':
        this.config.animationQuality = 'medium'
        break
      case 'medium':
        this.config.animationQuality = 'high'
        break
      case 'high':
        this.config.animationQuality = 'ultra'
        break
    }
    console.log('🚀 Performance: Upgraded to', this.config.animationQuality)
  }

  // Public API
  getOptimalSettings() {
    return {
      ...this.config,
      shouldUseGPU: this.config.enableGPUAcceleration && this.capabilities.supportsGPUAcceleration,
      maxAnimations: this.getMaxConcurrentAnimations(),
      blurQuality: this.getBlurQuality(),
      shadowQuality: this.getShadowQuality()
    }
  }

  private getMaxConcurrentAnimations(): number {
    switch (this.config.animationQuality) {
      case 'low': return 3
      case 'medium': return 6
      case 'high': return 12
      case 'ultra': return 20
      default: return 6
    }
  }

  private getBlurQuality(): string {
    switch (this.config.animationQuality) {
      case 'low': return 'blur(8px)'
      case 'medium': return 'blur(12px)'
      case 'high': return 'blur(16px)'
      case 'ultra': return 'blur(20px)'
      default: return 'blur(12px)'
    }
  }

  private getShadowQuality(): string {
    switch (this.config.animationQuality) {
      case 'low': return '0 2px 8px rgba(0,0,0,0.1)'
      case 'medium': return '0 4px 16px rgba(0,0,0,0.15)'
      case 'high': return '0 8px 32px rgba(0,0,0,0.2)'
      case 'ultra': return '0 16px 64px rgba(0,0,0,0.25)'
      default: return '0 4px 16px rgba(0,0,0,0.15)'
    }
  }

  setConfig(newConfig: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...newConfig }
    this.saveUserPreferences()
  }

  getConfig(): PerformanceConfig {
    return { ...this.config }
  }

  getCapabilities(): DeviceCapabilities {
    return { ...this.capabilities }
  }

  getCurrentFPS(): number {
    return this.frameRate
  }

  startMonitoring() {
    this.isMonitoring = true
    this.setupPerformanceMonitoring()
  }

  stopMonitoring() {
    this.isMonitoring = false
  }
}

// Create singleton instance
export const performanceOptimizer = new PerformanceOptimizer()

// React hook for performance optimization
export function usePerformanceOptimizer() {
  return {
    getOptimalSettings: performanceOptimizer.getOptimalSettings.bind(performanceOptimizer),
    setConfig: performanceOptimizer.setConfig.bind(performanceOptimizer),
    getConfig: performanceOptimizer.getConfig.bind(performanceOptimizer),
    getCapabilities: performanceOptimizer.getCapabilities.bind(performanceOptimizer),
    getCurrentFPS: performanceOptimizer.getCurrentFPS.bind(performanceOptimizer),
    startMonitoring: performanceOptimizer.startMonitoring.bind(performanceOptimizer),
    stopMonitoring: performanceOptimizer.stopMonitoring.bind(performanceOptimizer)
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  console.log('⚡ Performance optimizer initialized')
}
