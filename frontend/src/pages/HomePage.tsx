import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { QuickEventModal } from '@/components/QuickEventModal'
import { EnhancedHero } from '@/components/EnhancedHero'
import { useAuth } from '@/lib/auth-context'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero Section */}
      <EnhancedHero />

      {/* Enhanced Features Section */}
      <section className="relative py-20 lg:py-24 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary-muted)_0%,_transparent_70%)] opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
              <span className="text-primary font-medium">How It Works</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
              Three Steps to <span className="bg-gradient-primary bg-clip-text text-transparent">Epic Nights</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From zero to legendary in under 60 seconds. That's how we roll.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: "01",
                icon: "⚡",
                title: "Lightning Setup",
                description: "Create your session faster than you can crack open a cold one. Pick your vibe, location, and poison of choice.",
                features: ["60-second creation", "Smart location picker", "Vibe selector"]
              },
              {
                step: "02",
                icon: "🚀",
                title: "Rally Your Crew",
                description: "Invite your stable with one tap. WhatsApp, SMS, or shareable links - your crew gets notified instantly.",
                features: ["Instant notifications", "Multiple invite methods", "Crew management"]
              },
              {
                step: "03",
                icon: "🍻",
                title: "Raise Hell",
                description: "Live RSVPs, real-time updates, and legendary nights. That's the bottom line, 'cause Stone Cold said so.",
                features: ["Live updates", "One-tap RSVPs", "Epic memories"]
              }
            ].map((step, index) => (
              <div key={index} className="group slide-up" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="relative">
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg shadow-gold">
                    {step.step}
                  </div>

                  {/* Card */}
                  <div className="bg-gradient-card border border-border hover:border-border-hover rounded-2xl p-8 h-full transition-all duration-300 hover-lift">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                        <span className="text-4xl">{step.icon}</span>
                      </div>
                      <h3 className="text-2xl font-heading font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-2">
                      {step.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Vibe Selection Section */}
      <section className="relative py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 backdrop-blur-sm mb-6">
              <span className="text-accent-foreground font-medium">Choose Your Vibe</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6">
              Every Night Has Its <span className="bg-gradient-primary bg-clip-text text-transparent">Flavor</span>
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From chill hangs to legendary ragers - pick your poison and set the mood
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                emoji: '🍻',
                title: 'Chill Vibes',
                desc: 'Casual drinks with good company',
                color: 'from-blue-500/20 to-cyan-500/20',
                borderColor: 'border-blue-500/20 hover:border-blue-500/40'
              },
              {
                emoji: '🥃',
                title: 'Stone Cold Mode',
                desc: 'Time to raise some serious hell',
                color: 'from-amber-500/20 to-orange-500/20',
                borderColor: 'border-amber-500/20 hover:border-amber-500/40'
              },
              {
                emoji: '🍷',
                title: 'Classy Affairs',
                desc: 'Sophisticated celebrations',
                color: 'from-purple-500/20 to-pink-500/20',
                borderColor: 'border-purple-500/20 hover:border-purple-500/40'
              },
              {
                emoji: '🎉',
                title: 'Party Mode',
                desc: 'Full celebration chaos',
                color: 'from-red-500/20 to-pink-500/20',
                borderColor: 'border-red-500/20 hover:border-red-500/40'
              }
            ].map((vibe, index) => (
              <div key={index} className="group scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className={`relative bg-gradient-to-br ${vibe.color} rounded-2xl p-6 lg:p-8 text-center border ${vibe.borderColor} transition-all duration-300 hover-lift hover:shadow-lg backdrop-blur-sm`}>
                  {/* Glow Effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative">
                    <div className="text-5xl lg:text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                      {vibe.emoji}
                    </div>
                    <h3 className="text-xl lg:text-2xl font-heading font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {vibe.title}
                    </h3>
                    <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
                      {vibe.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative py-20 lg:py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-hero"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary)_0%,_transparent_70%)] opacity-10"></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8 fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <span className="text-primary font-medium">Ready to Join?</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
                Time to <span className="bg-gradient-primary bg-clip-text text-transparent">Raise Hell</span>
              </h2>

              <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Join thousands of hell-raisers creating legendary nights across the globe
              </p>

              <div className="text-lg text-primary font-heading font-semibold italic">
                "And that's the bottom line, 'cause Stone Cold said so!" 🥃
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center pt-8">
              {user ? (
                <QuickEventModal
                  trigger={
                    <Button
                      size="xl"
                      className="w-full sm:w-auto group hover-glow"
                    >
                      🍺 Start Raising Hell
                      <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                    </Button>
                  }
                />
              ) : (
                <Link to="/login" className="w-full sm:w-auto">
                  <Button
                    size="xl"
                    className="w-full group hover-glow"
                  >
                    🍺 Gimme a Hell Yeah!
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </Button>
                </Link>
              )}

              <Link to="/discover" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="xl"
                  className="w-full group backdrop-blur-sm"
                >
                  Discover Events
                  <span className="ml-2 group-hover:scale-110 transition-transform">🔍</span>
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="pt-12 border-t border-border/20">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">10K+</div>
                  <div className="text-sm text-muted-foreground">Hell-Raisers</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">50K+</div>
                  <div className="text-sm text-muted-foreground">Epic Events</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">100+</div>
                  <div className="text-sm text-muted-foreground">Cities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}