import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  hasAuthTokensInUrl, 
  clearAuthTokensFromUrl, 
  validateTokenCleanup,
  performAuthSecurityCheck,
  logAuthSecurityInfo,
  getTokenInfoForLogging
} from '@/lib/authSecurity'
import { CheckCircle, XCircle, AlertTriangle, Shield, Eye, Trash2 } from 'lucide-react'

/**
 * Test component for authentication security features
 * This component helps verify that token cleanup and security measures are working correctly
 */
export function AuthSecurityTest() {
  const [testResults, setTestResults] = useState<any>(null)
  const [tokenInfo, setTokenInfo] = useState<any>(null)

  const runSecurityCheck = () => {
    const securityCheck = performAuthSecurityCheck()
    const tokenData = getTokenInfoForLogging()
    
    setTestResults(securityCheck)
    setTokenInfo(tokenData)
    
    // Also log to console for detailed debugging
    logAuthSecurityInfo()
  }

  const simulateTokenUrl = () => {
    // Simulate a URL with tokens for testing (using fake tokens)
    const testUrl = `${window.location.pathname}#access_token=fake_token_123&refresh_token=fake_refresh_456&provider_token=fake_provider_789`
    window.history.replaceState({}, document.title, testUrl)
    
    // Update token info
    const tokenData = getTokenInfoForLogging()
    setTokenInfo(tokenData)
  }

  const clearTokensTest = () => {
    clearAuthTokensFromUrl()
    const isClean = validateTokenCleanup()
    
    // Update token info after cleanup
    const tokenData = getTokenInfoForLogging()
    setTokenInfo(tokenData)
    
    if (isClean) {
      alert('✅ Tokens successfully cleared from URL!')
    } else {
      alert('❌ Warning: Tokens may still be present in URL')
    }
  }

  const checkCurrentUrl = () => {
    const hasTokens = hasAuthTokensInUrl()
    const tokenData = getTokenInfoForLogging()
    setTokenInfo(tokenData)
    
    if (hasTokens) {
      alert('⚠️ Authentication tokens detected in current URL!')
    } else {
      alert('✅ No authentication tokens found in current URL')
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Authentication Security Test
          </h1>
          <p className="text-muted-foreground">
            Test and verify authentication security measures
          </p>
        </div>

        {/* Current URL Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Current URL Status
            </CardTitle>
            <CardDescription>
              Check if the current URL contains any authentication tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={checkCurrentUrl} variant="outline">
                Check Current URL
              </Button>
              <Button onClick={simulateTokenUrl} variant="secondary">
                Simulate Token URL (Test)
              </Button>
              <Button onClick={clearTokensTest} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Tokens
              </Button>
            </div>
            
            {tokenInfo && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Token Detection Results:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {tokenInfo.hasTokens ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    <span>
                      {tokenInfo.hasTokens ? 'Tokens detected' : 'No tokens found'}
                    </span>
                  </div>
                  
                  {tokenInfo.tokenTypes.length > 0 && (
                    <div>
                      <span className="text-sm text-muted-foreground">Token types found: </span>
                      {tokenInfo.tokenTypes.map((type: string) => (
                        <Badge key={type} variant="secondary" className="ml-1">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    Location: {tokenInfo.isFragment ? 'URL Fragment' : tokenInfo.isQuery ? 'URL Query' : 'None'}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Check
            </CardTitle>
            <CardDescription>
              Run comprehensive security validation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runSecurityCheck}>
              Run Security Check
            </Button>
            
            {testResults && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {testResults.isSecure ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-semibold">
                    Security Status: {testResults.isSecure ? 'Secure' : 'Issues Found'}
                  </span>
                </div>
                
                {testResults.issues.length > 0 && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Security Issues
                    </h4>
                    <ul className="space-y-1">
                      {testResults.issues.map((issue: string, index: number) => (
                        <li key={index} className="text-sm text-destructive">
                          • {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {testResults.recommendations.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-700 mb-2">
                      Recommendations
                    </h4>
                    <ul className="space-y-1">
                      {testResults.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-sm text-blue-600">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">How to test:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Click "Check Current URL" to see if any tokens are present</li>
                <li>Click "Simulate Token URL" to add fake tokens to the URL for testing</li>
                <li>Click "Clear Tokens" to test the token cleanup functionality</li>
                <li>Click "Run Security Check" to perform comprehensive security validation</li>
                <li>Check browser console for detailed security logs</li>
              </ol>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> This test page uses fake tokens for testing purposes. 
                Real authentication tokens should never be exposed in URLs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
