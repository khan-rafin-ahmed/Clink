import { useState } from 'react'
import { DeleteProfileDialog } from '@/components/DeleteProfileDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Test component for Delete Profile functionality
 * This allows testing the dialog without needing to navigate to Edit Profile
 */
export function DeleteProfileTest() {
  const [showDialog, setShowDialog] = useState(false)

  const handleAccountDeleted = () => {
    console.log('Account deleted - would redirect to home page')
    alert('Account deletion completed! (This is a test)')
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Delete Profile Feature Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This is a test page for the Delete Profile functionality. 
              Click the button below to test the confirmation dialog.
            </p>
            
            <Button 
              variant="destructive" 
              onClick={() => setShowDialog(true)}
            >
              Test Delete Profile Dialog
            </Button>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Test Notes:</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• The dialog should show a two-step confirmation process</li>
                <li>• Step 1: Warning about what will be deleted</li>
                <li>• Step 2: Requires typing "DELETE" to confirm</li>
                <li>• The actual deletion will fail without the database functions</li>
                <li>• This tests the UI/UX flow only</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <DeleteProfileDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onAccountDeleted={handleAccountDeleted}
        />
      </div>
    </div>
  )
}
