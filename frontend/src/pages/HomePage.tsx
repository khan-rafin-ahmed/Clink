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
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-foreground leading-tight">
                Ready to raise some hell?
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-primary font-heading font-semibold tracking-wide">
                TAP. PLAN. THIRSTEE.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
                Create spontaneous drinking sessions in under 60 seconds. Get your stable together for legendary nights out.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              {user ? (
                <QuickEventModal
                  trigger={
                    <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-semibold">
                      🍺 Raise Some Hell
                    </Button>
                  }
                />
              ) : (
                <Link to="/login">
                  <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-semibold">
                    🍺 Gimme a Hell Yeah!
                  </Button>
                </Link>
              )}
              <Link to="/discover">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-semibold">
                  {user ? 'Find the Party' : 'Join the Stable'}
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
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4">
              How to Raise Hell
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Three simple steps to legendary mayhem
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1 */}
            <div className="text-center space-y-4 px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-xl sm:text-2xl">⚡</span>
              </div>
              <h3 className="text-lg sm:text-xl font-heading font-semibold text-foreground">
                Quick Setup
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Create your hell-raising session in under 60 seconds. Pick your vibe, location, and poison.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-4 px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-xl sm:text-2xl">📱</span>
              </div>
              <h3 className="text-lg sm:text-xl font-heading font-semibold text-foreground">
                Rally the Stable
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Send invites via WhatsApp, SMS, or share links. Your stable gets notified immediately.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-4 px-4 sm:col-span-2 md:col-span-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-xl sm:text-2xl">🍻</span>
              </div>
              <h3 className="text-lg sm:text-xl font-heading font-semibold text-foreground">
                Raise Hell
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">
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
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4">
              Choose Your Mayhem
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground px-4">
              From casual hangs to all-out hell-raising
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: '🍻', title: 'Happy Hour Vibes', desc: 'Casual drinks with the stable' },
              { emoji: '🥃', title: 'Stone Cold Shots', desc: 'Time to raise hell' },
              { emoji: '🍷', title: 'Classy Night Out', desc: 'Sophisticated celebrations' },
              { emoji: '🎉', title: 'Party Mode', desc: 'Full celebration mode' }
            ].map((vibe, index) => (
              <div key={index} className="bg-card rounded-xl p-4 sm:p-6 text-center hover:bg-card/80 transition-colors">
                <div className="text-3xl sm:text-4xl mb-3">{vibe.emoji}</div>
                <h3 className="text-base sm:text-lg font-heading font-semibold text-foreground mb-2">
                  {vibe.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Ready to raise some hell?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 italic px-4">
            "And that's the bottom line, 'cause Stone Cold said so!" 🥃
          </p>
          <Link to="/login" className="inline-block w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 font-semibold">
              Gimme a Hell Yeah!
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}