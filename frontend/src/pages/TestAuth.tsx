import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { GoogleAuthDebug } from '@/components/GoogleAuthDebug'
import { useState, useEffect } from 'react'

export function TestAuth() {
  const { user, loading, signOut } = useAuth()
  const [session, setSession] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setSession(session)
      if (error) setError(error.message)
    })
  }, [])

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from('events').select('count(*)')
      if (error) {
        setError(`Database error: ${error.message}`)
      } else {
        setError(`Database connected! Events count: ${JSON.stringify(data)}`)
      }
    } catch (err: any) {
      setError(`Connection error: ${err.message}`)
    }
  }

  const testGoogleAuth = async () => {
    try {
      setError('Attempting Google sign in...')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(`Google OAuth error: ${error.message}`)
      } else {
        setError('Google OAuth initiated successfully!')
      }
    } catch (err: any) {
      setError(`Google auth error: ${err.message}`)
    }
  }

  const testMagicLink = async () => {
    try {
      setError('Sending magic link to test@example.com...')
      const { data, error } = await supabase.auth.signInWithOtp({
        email: 'test@example.com',
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
      setError(`Magic link sent successfully! Data: ${JSON.stringify(data)}`)
    } catch (err: any) {
      setError(`Magic link error: ${err.message}`)
    }
  }

  const checkAuthState = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      setError(`Current session: ${session ? 'Active' : 'None'}, Error: ${error?.message || 'None'}`)
    } catch (err: any) {
      setError(`Session check error: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Auth Debug Page</h1>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Auth Status</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? user.email : 'Not signed in'}</p>
            <p><strong>User ID:</strong> {user?.id || 'None'}</p>
            <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            <Button onClick={testConnection} variant="outline">
              Test Database Connection
            </Button>
            <Button onClick={testGoogleAuth}>
              Test Google Sign In
            </Button>
            <Button onClick={testMagicLink} variant="outline">
              Test Magic Link
            </Button>
            <Button onClick={checkAuthState} variant="outline">
              Check Current Session
            </Button>
            <Button onClick={() => window.open('/oauth-test', '_blank')} variant="outline">
              🔧 Advanced OAuth Debug
            </Button>
            <Button onClick={() => window.open('/db-check', '_blank')} variant="outline">
              🗄️ Database Checker
            </Button>
            {user && (
              <Button onClick={signOut} variant="destructive">
                Sign Out
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <h3 className="font-semibold text-destructive">Debug Info:</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <GoogleAuthDebug />

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <div className="space-y-1 text-sm">
            <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL}</p>
            <p><strong>Anon Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 20)}...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
