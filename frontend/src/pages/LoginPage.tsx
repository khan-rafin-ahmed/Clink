import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithMagicLink } from '@/lib/authService'
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
      await signInWithMagicLink(email, `${window.location.origin}/auth/callback`)

      setMagicLinkSent(true)
      toast.success('Magic link sent! Check your email 📧')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send magic link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error: any) {
      toast.error('Google sign in failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-bg-base">
        <div className="absolute inset-0 bg-gradient-hero"></div>

        <div className="relative flex h-screen items-center justify-center">
          <div className="text-center space-y-6 fade-in">
            <div className="relative">
              <img
                src="/thirstee-logo.svg"
                alt="Thirstee"
                className="h-20 w-auto mx-auto"
              />
              <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-xl"></div>
            </div>
            <div className="space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-accent-primary mx-auto" />
              <p className="text-lg text-muted-foreground font-medium">Loading your session...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render login form if user is authenticated (redirect handled in useEffect)
  if (user) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-bg-base">
        <div className="absolute inset-0 bg-gradient-hero"></div>

        <div className="relative flex h-screen items-center justify-center">
          <div className="text-center space-y-6 fade-in">
            <div className="relative">
              <img
                src="/thirstee-logo.svg"
                alt="Thirstee"
                className="h-20 w-auto mx-auto"
              />
              <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-xl"></div>
            </div>
            <div className="space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-accent-primary mx-auto" />
              <p className="text-lg text-muted-foreground font-medium">Welcome back! Redirecting...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-bg-base">
      {/* Masculine Glass Background */}
      <div className="absolute inset-0 bg-gradient-hero"></div>

      {/* Floating Glass Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-primary opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-secondary opacity-8 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 glass-panel rounded-2xl opacity-20"></div>
      </div>

      <div className="relative flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md space-y-8 fade-in">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src="/thirstee-logo.svg"
                  alt="Thirstee"
                  className="h-20 w-auto"
                />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 hover:opacity-100"></div>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
                Welcome Back, <span className="text-accent-primary" style={{ textShadow: '0 0 20px rgba(255, 119, 71, 0.4)' }}>Hell-Raiser!</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Ready to raise some hell? Let's get you back in there! 🍻
              </p>
            </div>
          </div>

          {/* Enhanced Glass Login Card */}
          <div className="glass-modal rounded-2xl p-8 shadow-glass-lg border border-white/15 hover:border-accent-primary/40 relative overflow-hidden">
            {/* Glass shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-0 hover:opacity-100 pointer-events-none rounded-2xl" />

            <div className="relative z-10">
              {error && (
                <div className="mb-6 p-4 glass-effect bg-destructive/10 border border-destructive/30 rounded-xl backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="text-destructive text-lg">⚠️</span>
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  </div>
                </div>
              )}

            {magicLinkSent ? (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-amber">
                  <span className="text-3xl">📧</span>
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-heading font-bold text-foreground">
                    Check Your Email
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    We sent a magic link to <span className="text-accent-primary font-semibold">{email}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click the link to sign in instantly - no password needed!
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setMagicLinkSent(false)}
                  className="w-full group"
                >
                  <span>Try Different Email</span>
                  <span className="ml-2">←</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Enhanced Glass Google Sign In */}
                <Button
                  onClick={handleGoogleSignIn}
                  variant="glass"
                  className="w-full flex items-center justify-center gap-3 h-14 group"
                  size="lg"
                >
                  <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-glass">
                    <span className="text-accent-primary font-bold text-lg">G</span>
                  </div>
                  <span className="font-semibold text-lg">Continue with Google</span>
                  <span className="ml-auto">→</span>
                </Button>

                {/* Enhanced Glass Divider */}
                <div className="relative py-2">
                  <div className="relative flex justify-center text-sm">
                    <span className="px-6 py-2 glass-effect rounded-full text-muted-foreground font-medium border border-white/10 backdrop-blur-md">
                      or continue with email
                    </span>
                  </div>
                </div>

                {/* Enhanced Glass Magic Link Form */}
                <form onSubmit={handleMagicLink} className="space-y-6 slide-up">
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <span>📧</span>
                      Email address
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-14 text-base pl-12"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        ✉️
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="glass"
                    className="w-full h-14 group"
                    disabled={isLoading || !email}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        <span className="text-lg">Sending Magic Link...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">✨ Send Magic Link</span>
                        <span className="ml-3 text-xl">→</span>
                      </>
                    )}
                  </Button>
                </form>

                {/* Additional Info */}
                <div className="text-center pt-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Magic links are secure, password-free, and expire in 1 hour
                  </p>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              By signing in, you agree to our{' '}
              <span className="text-accent-primary hover:text-accent-primary-hover cursor-pointer underline underline-offset-2">
                terms
              </span>{' '}
              and{' '}
              <span className="text-accent-primary hover:text-accent-primary-hover cursor-pointer underline underline-offset-2">
                privacy policy
              </span>
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>🔒</span>
              <span>Your data is secure and encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}