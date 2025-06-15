import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { QuickEventModal } from '@/components/QuickEventModal'
import { useAuth } from '@/lib/auth-context'
import { ArrowRight, Sparkles, Users, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

interface EnhancedHeroProps {
  className?: string
}

export function EnhancedHero({ className = '' }: EnhancedHeroProps) {
  const { user } = useAuth()

  return (
    <section className={`relative min-h-screen flex items-center justify-center overflow-hidden ${className}`}>
      {/* Liquid Glass Background with Ambient Orange Spotlight */}
      <div className="absolute inset-0 bg-bg-base">
        {/* Ambient orange spotlight effect */}
        <div className="absolute inset-0 bg-gradient-radial from-accent-primary/8 via-transparent to-transparent" />
      </div>

      {/* Enhanced Ambient Glass Floaters with Micro-Parallax Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large floating glass orbs with enhanced ambient glow */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-accent-primary/15 to-transparent blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -40, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-3/4 right-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-accent-secondary/12 to-transparent blur-2xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 50, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />

        {/* Additional ambient lighting layers */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-accent-primary/8 to-transparent blur-3xl transform -translate-x-1/2 -translate-y-1/2"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 5
          }}
        />

        {/* Enhanced blurred drink loop animation - floating drink silhouettes */}
        <motion.div
          className="absolute top-1/3 right-1/3 text-5xl opacity-15 blur-md"
          animate={{
            y: [0, -25, 0],
            rotate: [0, 8, 0],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🍺
        </motion.div>
        <motion.div
          className="absolute bottom-1/3 left-1/5 text-4xl opacity-12 blur-md"
          animate={{
            y: [0, 20, 0],
            rotate: [0, -5, 0],
            opacity: [0.12, 0.2, 0.12],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        >
          🥃
        </motion.div>
        <motion.div
          className="absolute top-2/3 right-1/5 text-3xl opacity-8 blur-md"
          animate={{
            y: [0, -15, 0],
            rotate: [0, 3, 0],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        >
          🍻
        </motion.div>
      </div>

      {/* Enhanced Floating Glass Card Container with Perfect Center-alignment */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="glass-card p-8 lg:p-12 rounded-3xl text-center space-y-6 hover-lift relative overflow-hidden"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Subtle Gradient Halo Background */}
          <div className="absolute inset-0 bg-gradient-radial from-accent-primary/5 via-transparent to-transparent opacity-60" />

          {/* Glass Badge with Enhanced Gradient Halo */}
          <motion.div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-effect border border-accent-primary/40 shadow-amber relative z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Sparkles className="w-5 h-5 text-accent-primary animate-pulse" />
            <span className="text-accent-primary font-medium">Hell Yeah! 🍺</span>
          </motion.div>

          {/* Enhanced PRD-Compliant Two-Line Headline */}
          <motion.div
            className="space-y-3 relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {/* Line 1 (smaller): Ready to drink? */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-medium text-muted-foreground leading-tight">
              Ready to drink?
            </h1>

            {/* Line 2 (main punch): Raise Some Hell. in Deep Amber with Enhanced Glow */}
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-accent-primary leading-tight"
              style={{
                textShadow: '0 0 30px rgba(255, 119, 71, 0.4), 0 0 60px rgba(255, 119, 71, 0.2)'
              }}
            >
              Raise Some Hell.
            </h2>

            {/* Enhanced PRD-Compliant Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed pt-2">
              Create drink nights in under 60 seconds.
            </p>
          </motion.div>

          {/* Enhanced PRD-Compliant Glass CTA Buttons with Perfect Positioning */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {/* Primary: Start a Night (enhanced glass button with ripple + hover lift) */}
            {user ? (
              <QuickEventModal
                trigger={
                  <Button
                    size="xl"
                    className="w-full sm:w-auto group glass-button hover-glow ripple-effect hover-lift shadow-white"
                  >
                    Start a Night
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                }
              />
            ) : (
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  size="xl"
                  className="w-full group glass-button hover-glow ripple-effect hover-lift shadow-amber"
                >
                  Start a Night
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}

            {/* Secondary: How it Works (enhanced ghost glass style) */}
            <Button
              variant="outline"
              size="xl"
              className="w-full sm:w-auto group glass-button border-accent/50 hover:border-accent/80 text-accent hover:text-accent hover-lift shadow-gray"
              onClick={() => {
                const howItWorksSection = document.getElementById('how-it-works');
                howItWorksSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              How it Works
              <Sparkles className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Glass Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-base to-transparent"></div>
    </section>
  )
}
