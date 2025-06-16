import { Button } from '@/components/ui/button'
import { QuickEventModal } from '@/components/QuickEventModal'
import { CreateCrewModal } from '@/components/CreateCrewModal'
import { NextEventBanner } from '@/components/NextEventBanner'
import { Plus, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileActionCardsProps {
  userId: string
  onEventCreated: () => void
  onCrewCreated: () => void
  className?: string
}

export function ProfileActionCards({
  userId,
  onEventCreated,
  onCrewCreated,
  className
}: ProfileActionCardsProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Primary CTA Card - Matching ProfileInfoCard styling */}
      <div className="glass-modal rounded-3xl p-6 lg:p-8 relative overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(255,255,255,0.12)] hover:backdrop-blur-xl" style={{ border: '1px solid hsla(0,0%,100%,.06)' }}>
        {/* Glass shimmer overlay - Matching ProfileInfoCard */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-white/4 opacity-0 hover:opacity-100 pointer-events-none rounded-3xl" />

        <div className="text-center space-y-6 relative z-10">
          <div className="space-y-2">
            <h3 className="text-xl lg:text-2xl font-heading font-bold text-foreground text-shadow">
              Ready to Raise Hell? 🍻
            </h3>
            <p className="text-sm text-muted-foreground">
              Create epic drinking sessions or build your crew of hell-raisers
            </p>
          </div>

          <div className="space-y-4">
            {/* Create Session Button */}
            <QuickEventModal
              trigger={
                <Button
                  variant="glass-primary"
                  size="lg"
                  className="w-full group hover-lift-3d drink-ripple-effect pulse-glow"
                >
                  <Plus className="mr-3 h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  🍺 Create Session
                  <span className="ml-3 group-hover:translate-x-2 transition-all duration-300">→</span>
                </Button>
              }
              onEventCreated={onEventCreated}
            />

            {/* Build Crew Button */}
            <CreateCrewModal
              trigger={
                <Button
                  variant="glass"
                  size="lg"
                  className="w-full group hover-lift-3d"
                >
                  <Users className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  Build Crew
                  <span className="ml-3 group-hover:translate-x-2 transition-all duration-300">→</span>
                </Button>
              }
              onCrewCreated={onCrewCreated}
            />
          </div>
        </div>
      </div>

      {/* Next Event Card */}
      <NextEventBanner
        userId={userId}
        className="glass-modal rounded-3xl transition-all duration-500 hover-lift-3d"
      />
    </div>
  )
}
