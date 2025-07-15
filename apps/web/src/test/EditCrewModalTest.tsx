import { useState } from 'react'
import { EditCrewModal } from '@/components/EditCrewModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Crew } from '@/types'

/**
 * Test component for Edit Crew Modal functionality
 * This allows testing the redesigned modal without needing actual crew data
 */
export function EditCrewModalTest() {
  const [showModal, setShowModal] = useState(false)
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null)

  // Mock crew data for testing
  const mockCrews: Crew[] = [
    {
      id: 'test-crew-1',
      name: 'Beer Bros',
      description: 'A crew for beer enthusiasts who love trying new brews and having a good time.',
      vibe: 'casual',
      visibility: 'private',
      created_by: 'test-user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'test-crew-2',
      name: 'Party Animals',
      description: 'Wild nights and unforgettable memories!',
      vibe: 'party',
      visibility: 'public',
      created_by: 'test-user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'test-crew-3',
      name: 'Classy Cocktails',
      description: '',
      vibe: 'classy',
      visibility: 'private',
      created_by: 'test-user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  const handleTestCrew = (crew: Crew) => {
    setSelectedCrew(crew)
    setShowModal(true)
  }

  const handleCrewUpdated = () => {
    console.log('Crew updated successfully!')
    // In a real app, this would refresh the crew data
  }

  const getVibeEmoji = (vibe: string) => {
    switch (vibe) {
      case 'casual': return '🍺'
      case 'party': return '🎉'
      case 'chill': return '😎'
      case 'wild': return '🔥'
      case 'classy': return '🥂'
      default: return '🤷'
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    return visibility === 'public' ? '🌍' : '🔒'
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🍺 Edit Crew Modal Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Test the redesigned Edit Crew modal with step-based navigation that matches event modal patterns.
            </p>

            {/* Test Crews */}
            <div className="space-y-4">
              <h3 className="font-semibold">Test Crews:</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockCrews.map((crew) => (
                  <Card key={crew.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold">{crew.name}</h4>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">
                              {getVibeEmoji(crew.vibe)} {crew.vibe}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getVisibilityIcon(crew.visibility)} {crew.visibility}
                            </Badge>
                          </div>
                        </div>
                        
                        {crew.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {crew.description}
                          </p>
                        )}
                        
                        <Button 
                          onClick={() => handleTestCrew(crew)}
                          className="w-full"
                          size="sm"
                        >
                          Edit Crew
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Design System Info */}
            <div className="bg-gradient-to-r from-white/10 to-[#00FFA3]/10 p-4 rounded-lg border border-[#00FFA3]/20">
              <h4 className="font-semibold mb-2 text-[#00FFA3]">Redesigned Modal Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• <strong>Step-based Navigation:</strong> 2 steps (Details & Members, Invite People)</li>
                <li>• <strong>Glassmorphism Design:</strong> Matches event modal patterns exactly</li>
                <li>• <strong>Progress Indicators:</strong> Visual step progression with white gradients</li>
                <li>• <strong>Responsive Layout:</strong> Mobile-first with proper touch targets</li>
                <li>• <strong>Component Reuse:</strong> UserSearchInvite, MemberList, InviteLinkGenerator</li>
                <li>• <strong>Permission System:</strong> Role-based access control</li>
                <li>• <strong>Design Tokens:</strong> Consistent with updated white/gray system</li>
                <li>• <strong>Z-Index Fix:</strong> Select dropdowns appear above modal content</li>
              </ul>
            </div>

            {/* Test Notes */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Test Notes:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Modal should open with glassmorphism effects and proper sizing</li>
                <li>• Step 1: Test form validation (name is required) + member management</li>
                <li>• Step 2: Invitation system integration</li>
                <li>• Navigation: Back/Next buttons should work properly</li>
                <li>• Progress bar should update with each step</li>
                <li>• Modal should match event modal visual patterns</li>
                <li>• Dropdown menus should appear above modal content properly</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Edit Crew Modal */}
        {selectedCrew && (
          <EditCrewModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            crew={selectedCrew}
            onCrewUpdated={handleCrewUpdated}
          />
        )}
      </div>
    </div>
  )
}
