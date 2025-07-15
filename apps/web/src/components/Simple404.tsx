import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

interface Simple404Props {
  username?: string
}

export function Simple404({ username }: Simple404Props) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/thirstee-logo.svg"
            alt="Thirstee"
            className="h-16 w-auto"
          />
        </div>

        {/* Glass card container */}
        <div className="glass-modal rounded-2xl p-8 border border-white/10">
          <div className="text-6xl mb-6">🍺</div>

          <h1 className="text-2xl font-semibold text-white mb-4">
            Search Result Not Found
          </h1>

          <p className="text-[#B3B3B3] mb-6 leading-relaxed">
            This profile doesn't exist or isn't available.
            Maybe they're taking a beer break? 🍻
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="bg-transparent border-white/20 text-[#B3B3B3] hover:bg-white/10 hover:text-white hover:border-white/30"
            >
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="bg-white text-[#08090A] hover:bg-white/90"
            >
              Find Sessions
            </Button>
          </div>
        </div>

        {/* Beer-themed footer message */}
        <p className="text-sm text-[#888888] mt-6">
          Keep exploring and find your drinking crew! 🤘
        </p>
      </div>
    </div>
  )
}
