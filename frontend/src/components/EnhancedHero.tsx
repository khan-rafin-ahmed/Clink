import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { QuickEventModal } from '@/components/QuickEventModal'
import { useAuth } from '@/lib/auth-context'
import { ArrowRight, Sparkles, Users, Clock } from 'lucide-react'

interface EnhancedHeroProps {
  className?: string
}

export function EnhancedHero({ className = '' }: EnhancedHeroProps) {
  const { user } = useAuth()

  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Enhanced Background with Gradient */}
      <div className="absolute inset-0 bg-gradient-hero"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary-muted)_0%,_transparent_50%)] opacity-20"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-16 sm:pb-20 lg:pb-24">
        <div className="text-center space-y-8 lg:space-y-12">
          {/* Main Content */}
          <div className="space-y-6 lg:space-y-8 fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Ready to raise some hell?</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4 lg:space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold text-foreground leading-tight tracking-tight">
                <span className="block">Ready to</span>
                <span className="block bg-gradient-primary bg-clip-text text-transparent">
                  raise some hell?
                </span>
              </h1>
              
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-primary font-heading font-bold tracking-wide">
                TAP. PLAN. THIRSTEE.
              </p>
              
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
                Create spontaneous drinking sessions in under 60 seconds. Get your stable together for legendary nights out.
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center pt-8 slide-up">
            {user ? (
              <QuickEventModal
                trigger={
                  <Button 
                    size="xl" 
                    className="w-full sm:w-auto group hover-glow"
                  >
                    🍺 Raise Some Hell
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            )}
            
            <Link to="/discover" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="xl" 
                className="w-full group"
              >
                {user ? 'Find the Party' : 'Join the Stable'}
                <Users className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 pt-12 lg:pt-16 scale-in">
            <div className="text-center space-y-3 group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors duration-300">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-heading font-semibold text-foreground">
                60-Second Setup
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Create your hell-raising session faster than you can crack open a cold one
              </p>
            </div>

            <div className="text-center space-y-3 group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors duration-300">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-heading font-semibold text-foreground">
                Crew System
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Build your stable and invite your crew for epic drinking adventures
              </p>
            </div>

            <div className="text-center space-y-3 group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors duration-300">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-heading font-semibold text-foreground">
                Spontaneous Fun
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Discover amazing sessions happening near you and join the party
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  )
}
