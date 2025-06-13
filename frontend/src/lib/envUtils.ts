/**
 * Environment detection and configuration utilities
 * Helps handle different environments (local, production) consistently
 */

export type Environment = 'local' | 'production' | 'development'

/**
 * Detects the current environment based on various indicators
 */
export function getCurrentEnvironment(): Environment {
  // Check explicit environment variable first
  const explicitEnv = import.meta.env.VITE_ENVIRONMENT
  if (explicitEnv === 'local' || explicitEnv === 'production') {
    return explicitEnv
  }

  // Check if we're in development mode
  if (import.meta.env.DEV) {
    return 'development'
  }

  // Check URL patterns
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    return 'local'
  }

  // Default to production for deployed environments
  return 'production'
}

/**
 * Gets the base URL for the current environment
 */
export function getBaseUrl(): string {
  const env = getCurrentEnvironment()
  
  switch (env) {
    case 'local':
    case 'development':
      return 'http://localhost:3000'
    case 'production':
      // Use the actual production URL - update this when you know your production domain
      return typeof window !== 'undefined' ? window.location.origin : 'https://thirstee.app'
    default:
      return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  }
}

/**
 * Gets the authentication callback URL for the current environment
 */
export function getAuthCallbackUrl(): string {
  return `${getBaseUrl()}/auth/callback`
}

/**
 * Checks if we're running in a local development environment
 */
export function isLocalEnvironment(): boolean {
  const env = getCurrentEnvironment()
  return env === 'local' || env === 'development'
}

/**
 * Checks if we're running in production
 */
export function isProductionEnvironment(): boolean {
  return getCurrentEnvironment() === 'production'
}

/**
 * Gets environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = getCurrentEnvironment()
  const baseUrl = getBaseUrl()
  
  return {
    environment: env,
    baseUrl,
    authCallbackUrl: getAuthCallbackUrl(),
    isLocal: isLocalEnvironment(),
    isProduction: isProductionEnvironment(),
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    // Debug mode enabled for local environments
    debugMode: isLocalEnvironment() || import.meta.env.DEV,
  }
}

/**
 * Logs environment information (useful for debugging)
 */
export function logEnvironmentInfo() {
  if (!isLocalEnvironment()) return // Only log in local environments
  
  const config = getEnvironmentConfig()
  console.log('🌍 Environment Configuration:', {
    environment: config.environment,
    baseUrl: config.baseUrl,
    authCallbackUrl: config.authCallbackUrl,
    supabaseUrl: config.supabaseUrl,
    debugMode: config.debugMode,
  })
}
