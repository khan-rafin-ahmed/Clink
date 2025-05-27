import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check for error in URL params and handle user redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const errorParam = urlParams.get('error')
    if (errorParam) {
      const decodedError = decodeURIComponent(errorParam)

      // Show user-friendly error messages
      if (decodedError.includes('Unable to exchange external code')) {
        setError('Google sign-in failed during authentication. Please try again or use magic link.')
      } else if (decodedError.includes('oauth_session_timeout')) {
        setError('Google sign-in timed out. Please try again.')
      } else if (decodedError.includes('magic_link_timeout')) {
        setError('Magic link verification timed out. Please try again.')
      } else {
        setError(decodedError)
      }
    }
  }, [])

  // Handle user redirect in useEffect
  useEffect(() => {
    if (!loading && user) {
      navigate('/profile')
    }
  }, [user, loading, navigate])

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      console.log('Sending magic link to:', email)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Magic link error:', error)
        throw error
      }

      console.log('Magic link sent successfully')
      setMagicLinkSent(true)
      toast.success('Magic link sent! Check your email 📧')
    } catch (error: any) {
      console.error('Magic link failed:', error)
      toast.error(error.message || 'Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      console.log('Attempting Google sign in...')
      await signInWithGoogle()
    } catch (error: any) {
      console.error('Google sign in error:', error)
      toast.error('Google sign in failed')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render login form if user is authenticated (redirect handled in useEffect)
  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Welcome to Thirstee
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Time to raise some hell! 🍻
          </p>
        </div>

        <div className="bg-card rounded-xl p-8 shadow-lg border border-border">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {magicLinkSent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">📧</span>
              </div>
              <h2 className="text-xl font-heading font-semibold text-foreground">
                Check your email
              </h2>
              <p className="text-muted-foreground">
                We sent a magic link to <strong>{email}</strong>
              </p>
              <Button
                variant="outline"
                onClick={() => setMagicLinkSent(false)}
                className="w-full"
              >
                Try different email
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Google Sign In */}
              <Button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90"
                size="default"
              >
                <div className="w-5 h-5 bg-white rounded-sm flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">G</span>
                </div>
                <span>Continue with Google</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">or</span>
                </div>
              </div>

              {/* Magic Link */}
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  disabled={isLoading || !email}
                  size="default"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send magic link'
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          By signing in, you agree to our terms and privacy policy.
        </p>
      </div>
    </div>
  )
}