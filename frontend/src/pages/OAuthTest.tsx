import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function OAuthTest() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      addLog(`OAuth Error: ${error} - ${errorDescription}`)
      return
    }

    if (code && !isProcessing) {
      setIsProcessing(true)
      handleOAuthCallback(code)
    }
  }, [searchParams, isProcessing])

  const handleOAuthCallback = async (code: string) => {
    try {
      addLog(`Processing OAuth code: ${code.substring(0, 20)}...`)

      // Method 1: Try exchangeCodeForSession
      try {
        addLog('Attempting exchangeCodeForSession...')
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          addLog(`exchangeCodeForSession error: ${error.message}`)
        } else if (data?.session) {
          addLog('✅ exchangeCodeForSession SUCCESS!')
          toast.success('Google OAuth successful!')
          navigate('/profile')
          return
        } else {
          addLog('exchangeCodeForSession returned no session')
        }
      } catch (err: any) {
        addLog(`exchangeCodeForSession exception: ${err.message}`)
      }

      // Method 2: Try manual token exchange
      try {
        addLog('Attempting manual token exchange...')
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            auth_code: code,
            code_verifier: '', // PKCE not used for OAuth
          })
        })

        const tokenData = await response.json()
        addLog(`Manual exchange response: ${JSON.stringify(tokenData)}`)

        if (tokenData.access_token) {
          addLog('✅ Manual token exchange SUCCESS!')
          // Set the session manually
          const { error: setError } = await supabase.auth.setSession({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token
          })

          if (setError) {
            addLog(`Session set error: ${setError.message}`)
          } else {
            addLog('✅ Session set successfully!')
            toast.success('Google OAuth successful!')
            navigate('/dashboard')
            return
          }
        }
      } catch (err: any) {
        addLog(`Manual exchange exception: ${err.message}`)
      }

      // Method 3: Wait for session to appear
      addLog('Waiting for session to appear...')
      let attempts = 0
      const maxAttempts = 10

      const checkSession = async () => {
        attempts++
        addLog(`Session check attempt ${attempts}/${maxAttempts}`)

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          addLog(`Session check error: ${error.message}`)
        } else if (session) {
          addLog('✅ Session found!')
          toast.success('Google OAuth successful!')
          navigate('/dashboard')
          return
        }

        if (attempts < maxAttempts) {
          setTimeout(checkSession, 2000)
        } else {
          addLog('❌ All methods failed')
          toast.error('OAuth failed - check console for details')
        }
      }

      setTimeout(checkSession, 1000)

    } catch (error: any) {
      addLog(`Overall error: ${error.message}`)
    }
  }

  const startOAuth = async () => {
    try {
      addLog('Starting Google OAuth...')
      addLog(`Using redirect: ${window.location.origin}/oauth-test`)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/oauth-test`
        }
      })

      if (error) {
        addLog(`OAuth start error: ${error.message}`)
      } else {
        addLog('OAuth redirect initiated...')
      }
    } catch (err: any) {
      addLog(`OAuth start exception: ${err.message}`)
    }
  }

  const startOAuthDirect = async () => {
    try {
      addLog('Starting Google OAuth with direct Supabase callback...')
      addLog('This will redirect to Supabase directly (no custom callback)')

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
        // No custom redirectTo - uses Supabase default
      })

      if (error) {
        addLog(`OAuth start error: ${error.message}`)
      } else {
        addLog('OAuth redirect initiated...')
      }
    } catch (err: any) {
      addLog(`OAuth start exception: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">OAuth Debug Test</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={startOAuth} className="w-full">
            Test OAuth (Custom Callback)
          </Button>
          <Button onClick={startOAuthDirect} className="w-full" variant="outline">
            Test OAuth (Supabase Direct)
          </Button>
        </div>

        <div className="bg-card p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Debug Logs</h2>
          <div className="bg-muted p-4 rounded text-sm font-mono max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <Button onClick={() => navigate('/login')} variant="outline">
          Back to Login
        </Button>
      </div>
    </div>
  )
}
