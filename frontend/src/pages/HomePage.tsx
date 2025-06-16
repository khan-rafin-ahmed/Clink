import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { QuickEventModal } from '@/components/QuickEventModal'
import { EnhancedHero } from '@/components/EnhancedHero'
import { useAuth } from '@/lib/auth-context'
import { motion } from 'framer-motion'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero Section */}
      <EnhancedHero />

      {/* Core Features Section (60s Setup, Crew, Fun) - PRD Compliant */}
      <section className="relative py-8 lg:py-10 overflow-hidden">
        {/* Glass Background */}
        <div className="absolute inset-0 bg-bg-base"></div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-effect border border-accent-primary/30 mb-4">
              <span className="text-accent-primary font-medium">Core Features</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold text-foreground mb-3">
              Everything You Need to <span className="text-accent-primary">Raise Hell</span>
            </h2>
          </motion.div>

          {/* 3 Floating Glass Cards with Hover Tilt and Glass Glow */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 mb-8">
            {[
              {
                icon: "⚡",
                title: "60s Setup",
                description: "Pick your vibe. Set the spot. Tap go.",
                delay: 0
              },
              {
                icon: "👥",
                title: "Crew System",
                description: "Build your stable for epic adventures.",
                delay: 0.1
              },
              {
                icon: "🎉",
                title: "Spontaneous Fun",
                description: "Discover sessions happening near you.",
                delay: 0.2
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="group glass-card p-6 rounded-2xl"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: feature.delay }}
                viewport={{ once: true }}
              >
                {/* Amber-outlined icons inside mini-glass circles */}
                <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4 border border-accent-primary/30">
                  <span className="text-2xl">{feature.icon}</span>
                </div>
                <h3 className="text-lg font-heading font-semibold text-foreground mb-2 text-center">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Social Proof Statistics - Moved from CTA Section */}
          <motion.div
            className="pt-6 border-t border-white/10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-3 gap-4 text-center max-w-2xl mx-auto">
              {[
                { number: "10K+", label: "Hell-Raisers" },
                { number: "50K+", label: "Epic Events" },
                { number: "100+", label: "Cities" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="glass-effect p-4 rounded-xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 + (index * 0.1) }}
                  viewport={{ once: true }}

                >
                  <div className="text-2xl font-bold text-accent-primary mb-1">{stat.number}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Three Steps to Epic Nights (How It Works) - PRD Compliant */}
      <section id="how-it-works" className="py-8 lg:py-10 bg-bg-base">

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-effect border border-accent-primary/30 mb-4">
              <span className="text-accent-primary font-medium">How It Works</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold text-foreground mb-3">
              Three Steps to <span className="text-accent-primary">Epic Nights</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              From zero to legendary in under 60 seconds.
            </p>
          </motion.div>

          {/* PRD-Compliant 3-Step Format with Enhanced Glass Step Numbers */}
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                stepNumber: "01",
                title: "Setup Fast",
                description: "Pick your vibe. Set the spot. Tap go.",
                delay: 0
              },
              {
                stepNumber: "02",
                title: "Rally the Crew",
                description: "Auto-invites via WhatsApp, SMS, links.",
                delay: 0.1
              },
              {
                stepNumber: "03",
                title: "Raise Hell",
                description: "Live RSVPs. Real-time vibes. Legendary nights.",
                delay: 0.2
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                className="group"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: step.delay }}
                viewport={{ once: true }}
              >
                {/* Floating Glass Card with Enhanced Step Number Design */}
                <div className="glass-card border border-white/10 hover:border-accent-primary/30 rounded-2xl p-6 h-full relative overflow-hidden">
                  {/* Glowing Top Border Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary opacity-60" />

                  {/* Sophisticated Glass Step Number in Top-Left Corner */}
                  <div className="absolute -top-3 -left-3 w-12 h-12 glass-effect border border-accent-primary/40 rounded-full flex items-center justify-center shadow-amber z-10">
                    <span className="text-accent-primary font-bold text-lg font-display">
                      {step.stepNumber}
                    </span>
                  </div>

                  <div className="text-center pt-6">
                    <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vibe Section (Chill, Stone Cold, Classy, Party) - PRD Compliant */}
      <section className="relative py-8 lg:py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-effect border border-accent-primary/30 mb-4">
              <span className="text-accent-primary font-medium">Choose Your Vibe</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold text-foreground mb-3">
              Every Night Has Its <span className="text-accent-primary">Flavor</span>
            </h2>
          </motion.div>

          {/* 2x2 Grid with More Vertical Spacing on Mobile */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {[
              {
                emoji: '🍻',
                title: 'Chill',
                desc: 'Casual hangs',
                glowColor: 'hover:shadow-white',
                borderColor: 'hover:border-white/40'
              },
              {
                emoji: '🥃',
                title: 'Stone Cold',
                desc: 'Raise hell',
                glowColor: 'hover:shadow-white',
                borderColor: 'hover:border-white/40'
              },
              {
                emoji: '🍷',
                title: 'Classy',
                desc: 'Sophisticated',
                glowColor: 'hover:shadow-gray',
                borderColor: 'hover:border-gray-500/40'
              },
              {
                emoji: '🎉',
                title: 'Party',
                desc: 'Full chaos',
                glowColor: 'hover:shadow-pink',
                borderColor: 'hover:border-pink-500/40'
              }
            ].map((vibe, index) => (
              <motion.div
                key={index}
                className="group"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                {/* Glass Card with Vibe-Specific Glow on Hover */}
                <div className={`glass-card border border-white/10 ${vibe.borderColor} rounded-2xl p-6 text-center ${vibe.glowColor}`}>
                  {/* Drink Icons with Glass Ring Effect */}
                  <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <span className="text-2xl">
                      {vibe.emoji}
                    </span>
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
                    {vibe.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {vibe.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Liquid Glass CTA Section - Optimized Spacing */}
      <section className="relative py-8 lg:py-10 overflow-hidden">
        {/* Glass Background */}
        <div className="absolute inset-0 bg-bg-base"></div>

        {/* Static Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/3 text-6xl opacity-8 blur-lg">🍺</div>
          <div className="absolute bottom-1/4 left-1/3 text-5xl opacity-6 blur-lg">🥃</div>
          <div className="absolute top-1/2 left-1/4 text-4xl opacity-4 blur-lg">🍻</div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            {/* Masculine Glass Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-effect border border-accent-primary/30"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <span className="text-accent-primary font-medium">Ready to Join?</span>
            </motion.div>

            {/* Compact Glass Main Headline */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-foreground leading-tight">
                Time to <span className="text-accent-primary">Raise Hell</span>
              </h2>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Join thousands creating legendary nights across the globe
              </p>

              <motion.div
                className="text-base text-accent-secondary font-heading font-medium italic"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                viewport={{ once: true }}
                style={{
                  textShadow: '0 0 20px rgba(255, 211, 126, 0.4)'
                }}
              >
                "And that's the bottom line!" 🥃
              </motion.div>
            </motion.div>

            {/* Glass CTA Buttons with Ripple Effects */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              viewport={{ once: true }}
            >
              {user ? (
                <QuickEventModal
                  trigger={
                    <Button
                      size="lg"
                      className="w-full sm:w-auto group glass-button hover-glow"
                    >
                      🍺 Start Raising Hell
                      <span className="ml-2">→</span>
                    </Button>
                  }
                />
              ) : (
                <Link to="/login" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full group glass-button hover-glow"
                  >
                    🍺 Gimme a Hell Yeah!
                    <span className="ml-2">→</span>
                  </Button>
                </Link>
              )}

              <Link to="/discover" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full group glass-button border-accent-secondary/40 hover:border-accent-secondary/70 text-accent-secondary hover:text-accent-secondary"
                >
                  Discover Events
                  <span className="ml-2">🔍</span>
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}