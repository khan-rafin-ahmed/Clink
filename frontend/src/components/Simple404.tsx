import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

interface Simple404Props {
  username?: string
}

export function Simple404({ username }: Simple404Props) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="text-6xl mb-4">🍺</div>
        <h1 className="text-2xl font-bold">Profile Not Found</h1>
        <p className="text-muted-foreground">
          {username ? `@${username} doesn't exist` : "This profile doesn't exist"}
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
          <Button onClick={() => navigate('/')}>
            Home
          </Button>
        </div>
      </div>
    </div>
  )
}
