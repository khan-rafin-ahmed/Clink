/**
 * Age Gate Test Page
 * For testing age gate functionality
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AgeGateModal, SimpleAgeGateModal } from '@/components/AgeGateModal'
import { useAgeVerification } from '@/components/RequireAge'
import { 
  isAgeVerificationValid, 
  setAgeVerification, 
  clearAgeVerification,
  validateAge 
} from '@/lib/ageGate'
import { useAuth } from '@/lib/auth-context'

export function AgeGateTest() {
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [showSimpleModal, setShowSimpleModal] = useState(false)
  const [testAge, setTestAge] = useState('')
  const { ageStatus, loading, isVerified, needsVerification, isUnderAge } = useAgeVerification()

  const handleTestAge = () => {
    const validation = validateAge(testAge)
    alert(`Age ${testAge}: ${validation.isValid ? 'Valid' : validation.error}`)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Age Gate Test Page
          </h1>
          <p className="text-muted-foreground">
            Test the age verification functionality
          </p>
        </div>

        {/* Current Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Age Verification Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>User:</strong> {user ? user.email : 'Not logged in'}
              </div>
              <div>
                <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Is Verified:</strong> {isVerified ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Needs Verification:</strong> {needsVerification ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Is Under Age:</strong> {isUnderAge ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>LocalStorage Valid:</strong> {isAgeVerificationValid() ? 'Yes' : 'No'}
              </div>
            </div>
            
            {ageStatus && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <strong>Full Age Status:</strong>
                <pre className="mt-2 text-sm">
                  {JSON.stringify(ageStatus, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setShowModal(true)}>
                Show Age Gate Modal
              </Button>
              <Button onClick={() => setShowSimpleModal(true)}>
                Show Simple Modal
              </Button>
              <Button onClick={setAgeVerification} variant="outline">
                Set Age Verification
              </Button>
              <Button onClick={clearAgeVerification} variant="destructive">
                Clear Age Verification
              </Button>
              <Button
                onClick={() => window.open('/not-allowed', '_blank')}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Test /not-allowed Page
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="number"
                placeholder="Test age"
                value={testAge}
                onChange={(e) => setTestAge(e.target.value)}
                className="px-3 py-2 border rounded-md"
                min="1"
                max="120"
              />
              <Button onClick={handleTestAge} disabled={!testAge}>
                Validate Age
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Check the current verification status above</li>
              <li>Use "Clear Age Verification" to reset localStorage</li>
              <li>Use "Show Age Gate Modal" to test the modal and button styling</li>
              <li>Click "No, I'm under 18" to test redirect to /not-allowed (should NOT loop back)</li>
              <li>Use "Test /not-allowed Page" button to verify the page is accessible</li>
              <li>Test age validation with different values</li>
              <li>Navigate to other pages to see if age gate appears</li>
              <li>Try logging in/out to test different scenarios</li>
            </ol>
          </CardContent>
        </Card>

        {/* Modals */}
        <AgeGateModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
        />

        <SimpleAgeGateModal
          isOpen={showSimpleModal}
          onConfirm={() => {
            setAgeVerification()
            setShowSimpleModal(false)
            alert('Age confirmed!')
          }}
          onDeny={() => {
            clearAgeVerification()
            setShowSimpleModal(false)
            alert('Access denied!')
          }}
        />
      </div>
    </div>
  )
}
