/**
 * Environment validation utilities
 * Helps validate and debug environment configuration
 */

import { getEnvironmentConfig, isLocalEnvironment } from './envUtils'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  config: ReturnType<typeof getEnvironmentConfig>
}

/**
 * Validates the current environment configuration
 */
export function validateEnvironment(): ValidationResult {
  const config = getEnvironmentConfig()
  const errors: string[] = []
  const warnings: string[] = []

  // Check required environment variables
  if (!config.supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is not set')
  }

  if (!config.supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is not set')
  }

  // Validate Supabase URL format
  if (config.supabaseUrl) {
    try {
      const url = new URL(config.supabaseUrl)
      
      if (isLocalEnvironment()) {
        // Local environment should use localhost
        if (!url.hostname.includes('localhost') && !url.hostname.includes('127.0.0.1')) {
          warnings.push('Local environment detected but Supabase URL is not localhost. This might cause authentication issues.')
        }
        
        // Check for common local Supabase port
        if (url.port !== '54321') {
          warnings.push('Supabase URL port is not 54321. Make sure your local Supabase is running on the correct port.')
        }
      } else {
        // Production environment should use HTTPS
        if (url.protocol !== 'https:') {
          errors.push('Production Supabase URL should use HTTPS')
        }
        
        if (url.hostname.includes('localhost')) {
          errors.push('Production environment detected but Supabase URL is localhost')
        }
      }
    } catch (e) {
      errors.push('VITE_SUPABASE_URL is not a valid URL')
    }
  }

  // Check base URL consistency
  if (isLocalEnvironment()) {
    const currentUrl = typeof window !== 'undefined' ? window.location.origin : ''
    if (currentUrl && !currentUrl.includes('localhost:3000')) {
      warnings.push(`App is running on ${currentUrl} but expected http://localhost:3000 for consistent local development`)
    }
  }

  // Check for common misconfigurations
  if (config.supabaseUrl?.includes('supabase.co') && isLocalEnvironment()) {
    warnings.push('Using production Supabase URL in local environment. Consider using local Supabase for development.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  }
}

/**
 * Logs environment validation results to console
 */
export function logEnvironmentValidation(): ValidationResult {
  const result = validateEnvironment()

  // Disable environment validation logging to reduce console noise
  // if (!isLocalEnvironment()) {
  //   return result // Only log in local environment
  // }

  // console.group('🌍 Environment Validation')

  // console.log('Configuration:', {
  //   environment: result.config.environment,
  //   baseUrl: result.config.baseUrl,
  //   supabaseUrl: result.config.supabaseUrl,
  //   authCallbackUrl: result.config.authCallbackUrl,
  // })

  // if (result.errors.length > 0) {
  //   console.group('❌ Errors')
  //   result.errors.forEach(error => console.error(error))
  //   console.groupEnd()
  // }

  // if (result.warnings.length > 0) {
  //   console.group('⚠️ Warnings')
  //   result.warnings.forEach(warning => console.warn(warning))
  //   console.groupEnd()
  // }

  // if (result.isValid && result.warnings.length === 0) {
  //   console.log('✅ Environment configuration looks good!')
  // }

  // console.groupEnd()
  
  return result
}

/**
 * Gets a user-friendly environment status message
 */
export function getEnvironmentStatusMessage(): string {
  const result = validateEnvironment()
  
  if (!result.isValid) {
    return `❌ Environment configuration has ${result.errors.length} error(s). Check console for details.`
  }
  
  if (result.warnings.length > 0) {
    return `⚠️ Environment configuration has ${result.warnings.length} warning(s). Check console for details.`
  }
  
  return `✅ Environment configuration is valid (${result.config.environment})`
}

/**
 * Hook to validate environment on app startup
 */
export function useEnvironmentValidation() {
  if (typeof window !== 'undefined' && isLocalEnvironment()) {
    // Run validation after a short delay to avoid blocking initial render
    setTimeout(() => {
      logEnvironmentValidation()
    }, 1000)
  }
}
