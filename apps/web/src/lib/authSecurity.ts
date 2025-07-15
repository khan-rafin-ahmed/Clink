/**
 * Authentication Security Utilities
 * Handles secure token processing and prevents token exposure
 */

/**
 * Checks if the current URL contains sensitive authentication tokens
 */
export function hasAuthTokensInUrl(): boolean {
  const hash = window.location.hash
  const search = window.location.search
  
  // Check for common OAuth token parameters
  const tokenParams = [
    'access_token',
    'refresh_token',
    'provider_token',
    'provider_refresh_token',
    'id_token'
  ]
  
  return tokenParams.some(param => 
    hash.includes(param) || search.includes(param)
  )
}

/**
 * Extracts token information from URL for logging (without exposing actual tokens)
 */
export function getTokenInfoForLogging(): {
  hasTokens: boolean
  tokenTypes: string[]
  isFragment: boolean
  isQuery: boolean
} {
  const hash = window.location.hash
  const search = window.location.search
  
  const tokenParams = [
    'access_token',
    'refresh_token', 
    'provider_token',
    'provider_refresh_token',
    'id_token',
    'expires_in',
    'expires_at',
    'token_type'
  ]
  
  const foundInFragment = tokenParams.filter(param => hash.includes(param))
  const foundInQuery = tokenParams.filter(param => search.includes(param))
  
  return {
    hasTokens: foundInFragment.length > 0 || foundInQuery.length > 0,
    tokenTypes: [...foundInFragment, ...foundInQuery],
    isFragment: foundInFragment.length > 0,
    isQuery: foundInQuery.length > 0
  }
}

/**
 * Securely clears authentication tokens from the current URL
 * This prevents tokens from being stored in browser history or logs
 */
export function clearAuthTokensFromUrl(): void {
  const tokenInfo = getTokenInfoForLogging()
  
  if (!tokenInfo.hasTokens) {
    return
  }
  
  console.log('🔒 Security: Clearing authentication tokens from URL', {
    tokenTypes: tokenInfo.tokenTypes,
    location: tokenInfo.isFragment ? 'fragment' : 'query'
  })
  
  // Clear the URL by replacing the current history entry
  // This removes tokens from browser history
  const cleanUrl = window.location.pathname
  window.history.replaceState({}, document.title, cleanUrl)
  
  // Also clear any remaining hash fragments
  if (window.location.hash) {
    window.location.hash = ''
  }
}

/**
 * Validates that no sensitive tokens remain in the URL after processing
 */
export function validateTokenCleanup(): boolean {
  const hasTokens = hasAuthTokensInUrl()
  
  if (hasTokens) {
    console.warn('⚠️ Security Warning: Authentication tokens still present in URL after cleanup')
    return false
  }
  
  return true
}

/**
 * Comprehensive security check for authentication callback
 */
export function performAuthSecurityCheck(): {
  isSecure: boolean
  issues: string[]
  recommendations: string[]
} {
  const issues: string[] = []
  const recommendations: string[] = []
  
  // Check for tokens in URL
  if (hasAuthTokensInUrl()) {
    issues.push('Authentication tokens present in URL')
    recommendations.push('Clear tokens from URL immediately after processing')
  }
  
  // Check for HTTPS in production
  if (window.location.protocol !== 'https:' && 
      !window.location.hostname.includes('localhost')) {
    issues.push('Non-HTTPS connection in production environment')
    recommendations.push('Ensure all authentication flows use HTTPS')
  }
  
  // Check for secure storage
  if (!window.localStorage) {
    issues.push('Local storage not available for secure token storage')
    recommendations.push('Ensure browser supports secure local storage')
  }
  
  // Check referrer policy
  const metaReferrer = document.querySelector('meta[name="referrer"]')
  if (!metaReferrer || !metaReferrer.getAttribute('content')?.includes('strict')) {
    recommendations.push('Consider setting strict referrer policy to prevent token leakage')
  }
  
  return {
    isSecure: issues.length === 0,
    issues,
    recommendations
  }
}

/**
 * Sets up security headers and policies for authentication
 */
export function setupAuthSecurityPolicies(): void {
  // Set referrer policy to prevent token leakage through referrer headers
  let referrerMeta = document.querySelector('meta[name="referrer"]')
  if (!referrerMeta) {
    referrerMeta = document.createElement('meta')
    referrerMeta.setAttribute('name', 'referrer')
    document.head.appendChild(referrerMeta)
  }
  referrerMeta.setAttribute('content', 'strict-origin-when-cross-origin')
  
  // Prevent caching of authentication pages
  const cacheControlMeta = document.createElement('meta')
  cacheControlMeta.setAttribute('http-equiv', 'Cache-Control')
  cacheControlMeta.setAttribute('content', 'no-cache, no-store, must-revalidate')
  document.head.appendChild(cacheControlMeta)
}

/**
 * Logs security information for debugging (without exposing sensitive data)
 */
export function logAuthSecurityInfo(): void {
  const securityCheck = performAuthSecurityCheck()
  const tokenInfo = getTokenInfoForLogging()
  
  console.group('🔒 Authentication Security Status')
  
  console.log('Token Detection:', {
    hasTokens: tokenInfo.hasTokens,
    tokenCount: tokenInfo.tokenTypes.length,
    location: tokenInfo.isFragment ? 'URL fragment' : tokenInfo.isQuery ? 'URL query' : 'none'
  })
  
  console.log('Security Status:', {
    isSecure: securityCheck.isSecure,
    issueCount: securityCheck.issues.length
  })
  
  if (securityCheck.issues.length > 0) {
    console.group('⚠️ Security Issues')
    securityCheck.issues.forEach(issue => console.warn(issue))
    console.groupEnd()
  }
  
  if (securityCheck.recommendations.length > 0) {
    console.group('💡 Security Recommendations')
    securityCheck.recommendations.forEach(rec => console.info(rec))
    console.groupEnd()
  }
  
  console.groupEnd()
}
