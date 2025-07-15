import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCrewById, hasCrewManagementPermissions } from '@/lib/crewService'
import { useAuth } from '@/lib/auth-context'
import type { Crew } from '@/types'

// Test component to verify crew permission functionality
export function CrewPermissionTest() {
  const { user } = useAuth()
  const [testCrewId, setTestCrewId] = useState('')
  const [crewData, setCrewData] = useState<Crew | null>(null)
  const [permissionResult, setPermissionResult] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testPermissions = async () => {
    if (!testCrewId || !user) {
      setError('Please enter a crew ID and make sure you are logged in')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      // Test getCrewById with new permission fields
      console.log('🧪 Testing getCrewById for crew:', testCrewId)
      const crew = await getCrewById(testCrewId)
      setCrewData(crew)

      if (!crew) {
        setError('Crew not found')
        return
      }

      // Test hasCrewManagementPermissions function
      console.log('🧪 Testing hasCrewManagementPermissions for crew:', testCrewId)
      const hasPermissions = await hasCrewManagementPermissions(testCrewId, user.id)
      setPermissionResult(hasPermissions)

      console.log('🧪 Test Results:', {
        crewId: testCrewId,
        userId: user.id,
        crewData: {
          is_creator: crew.is_creator,
          user_role: crew.user_role,
          can_manage: crew.can_manage
        },
        hasPermissionsResult: hasPermissions
      })

    } catch (err: any) {
      console.error('🧪 Test Error:', err)
      setError(err.message || 'An error occurred during testing')
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setCrewData(null)
    setPermissionResult(null)
    setError(null)
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Crew Permission System Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-white">Test Crew Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Crew ID to Test:
            </label>
            <input
              type="text"
              value={testCrewId}
              onChange={(e) => setTestCrewId(e.target.value)}
              placeholder="Enter crew ID (e.g., 14d90566-edef-4dcb-8ea8-c2112ebbb132)"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testPermissions} 
              disabled={isLoading || !testCrewId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? 'Testing...' : 'Test Permissions'}
            </Button>
            <Button 
              onClick={clearResults} 
              variant="outline"
            >
              Clear Results
            </Button>
          </div>

          {user && (
            <div className="text-sm text-gray-300">
              <strong>Current User:</strong> {user.id} ({user.email})
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-500">
          <CardContent className="pt-6">
            <div className="text-red-400">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {crewData && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-white">Crew Data Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong className="text-white">Crew Name:</strong>
                  <div className="text-gray-300">{crewData.name}</div>
                </div>
                <div>
                  <strong className="text-white">Created By:</strong>
                  <div className="text-gray-300">{crewData.created_by}</div>
                </div>
                <div>
                  <strong className="text-white">Is Creator:</strong>
                  <div className={crewData.is_creator ? 'text-green-400' : 'text-red-400'}>
                    {crewData.is_creator ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <strong className="text-white">User Role:</strong>
                  <div className="text-gray-300">{crewData.user_role || 'None'}</div>
                </div>
                <div>
                  <strong className="text-white">Can Manage (from getCrewById):</strong>
                  <div className={crewData.can_manage ? 'text-green-400' : 'text-red-400'}>
                    {crewData.can_manage ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <strong className="text-white">Is Member:</strong>
                  <div className={crewData.is_member ? 'text-green-400' : 'text-red-400'}>
                    {crewData.is_member ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {permissionResult !== null && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-white">Permission Check Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <strong className="text-white">hasCrewManagementPermissions Result:</strong>
                <div className={permissionResult ? 'text-green-400' : 'text-red-400'}>
                  {permissionResult ? 'Yes - User can manage this crew' : 'No - User cannot manage this crew'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Expected Behavior</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-300">
            <h4 className="text-white font-semibold">For Crew Creators (Hosts):</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>is_creator: true</li>
              <li>user_role: 'host'</li>
              <li>can_manage: true</li>
              <li>hasCrewManagementPermissions: true</li>
              <li>Should see Edit Crew button in CrewCard and CrewDetail</li>
            </ul>
            
            <h4 className="text-white font-semibold mt-4">For Co-hosts:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>is_creator: false</li>
              <li>user_role: 'co_host'</li>
              <li>can_manage: true</li>
              <li>hasCrewManagementPermissions: true</li>
              <li>Should see Edit Crew button in CrewCard and CrewDetail</li>
            </ul>
            
            <h4 className="text-white font-semibold mt-4">For Regular Members:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>is_creator: false</li>
              <li>user_role: 'member'</li>
              <li>can_manage: false</li>
              <li>hasCrewManagementPermissions: false</li>
              <li>Should NOT see Edit Crew button</li>
            </ul>
            
            <h4 className="text-white font-semibold mt-4">For Non-members:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>is_creator: false</li>
              <li>user_role: null</li>
              <li>can_manage: false</li>
              <li>hasCrewManagementPermissions: false</li>
              <li>Should NOT see Edit Crew button</li>
            </ul>

            <h4 className="text-white font-semibold mt-4">Profile View Fix:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>getUserCrews now accepts viewerId parameter for permission calculation</li>
              <li>When viewing your own profile: permissions calculated from your perspective</li>
              <li>When viewing others' profiles: permissions calculated from viewer's perspective</li>
              <li>Edit Crew button should now appear correctly in profile crew cards</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
