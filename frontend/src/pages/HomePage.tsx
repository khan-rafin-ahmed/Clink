import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { QuickEventModal } from '@/components/QuickEventModal'
import { useAuth } from '@/lib/auth-context'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center space-y-8">
            {/* Main headline */}
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight">
                Ready to raise some hell?
              </h1>
              <p className="text-xl sm:text-2xl text-primary font-heading font-semibold tracking-wide">
                TAP. PLAN. CLINK.
              </p>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Create spontaneous drinking sessions in under 60 seconds. Get your crew together for legendary nights out.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              {user ? (
                <QuickEventModal
                  trigger={
                    <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4 font-semibold">
                      🍺 Start a Session
                    </Button>
                  }
                />
              ) : (
                <Link to="/login">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4 font-semibold">
                    🍺 Start a Session
                  </Button>
                </Link>
              )}
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4 font-semibold">
                  {user ? 'Browse Sessions' : 'Join the Fun'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to epic nights
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground">
                Quick Setup
              </h3>
              <p className="text-muted-foreground">
                Create your drinking session in under 60 seconds. Pick your vibe, location, and drinks.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground">
                Share Instantly
              </h3>
              <p className="text-muted-foreground">
                Send invites via WhatsApp, SMS, or share links. Your crew gets notified immediately.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-2xl">🍻</span>
              </div>
              <h3 className="text-xl font-heading font-semibold text-foreground">
                Raise Hell
              </h3>
              <p className="text-muted-foreground">
                One-tap RSVPs, live updates, and legendary nights. That's the bottom line.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Event Types Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">
              Choose your vibe
            </h2>
            <p className="text-lg text-muted-foreground">
              From casual hangs to wild nights out
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: '🍻', title: 'Beer O\'Clock', desc: 'Casual drinks with the crew' },
              { emoji: '🥃', title: 'Shots Night', desc: 'Time to get wild' },
              { emoji: '🍷', title: 'Wine Time', desc: 'Classy evening vibes' },
              { emoji: '🎉', title: 'Party Mode', desc: 'All-out celebration' }
            ].map((vibe, index) => (
              <div key={index} className="bg-card rounded-xl p-6 text-center hover:bg-card/80 transition-colors">
                <div className="text-4xl mb-3">{vibe.emoji}</div>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                  {vibe.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {vibe.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
            Ready to start the party?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 italic">
            "And that's the bottom line, 'cause Stone Cold said so!" 🥃
          </p>
          <Link to="/login">
            <Button size="lg" className="text-lg px-8 py-4 font-semibold">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}