import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function ConfigChecker() {
  const [results, setResults] = useState<any>(null)

  const checkConfig = async () => {
    const checks = {
      timestamp: new Date().toISOString(),
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      expectedGoogleRedirect: `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/callback`,
      currentOrigin: window.location.origin,
    }

    // Test Supabase connection
    try {
      const { data, error } = await supabase.auth.getSession()
      checks.supabaseConnection = error ? `Error: ${error.message}` : 'Connected'
    } catch (err: any) {
      checks.supabaseConnection = `Exception: ${err.message}`
    }

    // Test Google OAuth provider
    try {
      // This will show us what Supabase thinks about Google OAuth
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://example.com', // Dummy redirect to see if provider works
          skipBrowserRedirect: true // Don't actually redirect
        }
      })
      
      checks.googleProvider = error ? `Error: ${error.message}` : 'Provider available'
      checks.googleProviderData = data
    } catch (err: any) {
      checks.googleProvider = `Exception: ${err.message}`
    }

    setResults(checks)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Configuration Checker</h1>
        
        <Button onClick={checkConfig} className="w-full">
          Check Configuration
        </Button>
        
        {results && (
          <div className="bg-card p-4 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Configuration Results</h2>
            <pre className="bg-muted p-4 rounded text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Required Google Cloud Console Settings</h2>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium">Authorized redirect URIs:</h3>
              <code className="bg-muted px-2 py-1 rounded block mt-1">
                {import.meta.env.VITE_SUPABASE_URL}/auth/v1/callback
              </code>
            </div>
            
            <div>
              <h3 className="font-medium">Authorized JavaScript origins:</h3>
              <code className="bg-muted px-2 py-1 rounded block mt-1">
                {window.location.origin}
              </code>
              <code className="bg-muted px-2 py-1 rounded block mt-1">
                {import.meta.env.VITE_SUPABASE_URL}
              </code>
            </div>
          </div>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Supabase Settings Checklist</h2>
          <div className="space-y-2 text-sm">
            <div>✅ Google provider enabled</div>
            <div>✅ Client ID matches Google Cloud Console</div>
            <div>✅ Client Secret matches Google Cloud Console (no extra spaces)</div>
            <div>✅ Site URL set to: <code className="bg-muted px-1 rounded">{window.location.origin}</code></div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-medium text-amber-800 mb-2">Common Issues:</h3>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• Client Secret mismatch (most common)</li>
            <li>• Extra spaces in Client ID or Secret</li>
            <li>• Google OAuth consent screen not configured</li>
            <li>• Domain not verified in Google Cloud Console</li>
            <li>• OAuth app in testing mode with restricted users</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
