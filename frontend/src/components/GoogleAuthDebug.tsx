import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function GoogleAuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testGoogleAuth = async () => {
    setIsLoading(true)
    setDebugInfo(null)

    try {
      console.log('Testing Google OAuth configuration...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      const info = {
        timestamp: new Date().toISOString(),
        redirectUrl: `${window.location.origin}/auth/callback`,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
        expectedGoogleRedirect: `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/callback`,
        data,
        error: error ? {
          message: error.message,
          status: error.status,
          details: error
        } : null
      }

      setDebugInfo(info)
      console.log('Google OAuth Debug Info:', info)

      if (error) {
        toast.error(`Google OAuth Error: ${error.message}`)
      } else {
        toast.success('Google OAuth initiated successfully!')
      }
    } catch (err: any) {
      const errorInfo = {
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack
      }
      setDebugInfo(errorInfo)
      console.error('Google OAuth Test Error:', errorInfo)
      toast.error(`Test failed: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-card p-6 rounded-lg border space-y-4">
      <h3 className="text-lg font-semibold">Google OAuth Debug</h3>
      
      <Button 
        onClick={testGoogleAuth} 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Testing...' : 'Test Google OAuth'}
      </Button>

      {debugInfo && (
        <div className="bg-muted p-4 rounded text-sm">
          <h4 className="font-semibold mb-2">Debug Information:</h4>
          <pre className="whitespace-pre-wrap text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-2">
        <p><strong>Expected Google Cloud Console Redirect URI:</strong></p>
        <code className="bg-muted px-2 py-1 rounded">
          {import.meta.env.VITE_SUPABASE_URL}/auth/v1/callback
        </code>
        
        <p><strong>Current App Redirect:</strong></p>
        <code className="bg-muted px-2 py-1 rounded">
          {window.location.origin}/auth/callback
        </code>
      </div>
    </div>
  )
}
