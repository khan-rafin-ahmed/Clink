
import { MemberList } from '@/components/shared/MemberList'
import type { CrewMember } from '@/types'

// Test component to verify crew management functionality
export function CrewManagementTest() {
  // Mock crew members data
  const mockMembers: CrewMember[] = [
    {
      id: '1',
      crew_id: 'crew-1',
      user_id: 'user-1',
      role: 'host',
      status: 'accepted',
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: 'user-1',
        display_name: 'John Host',
        avatar_url: null,
        nickname: 'Johnny'
      }
    },
    {
      id: '2',
      crew_id: 'crew-1',
      user_id: 'user-2',
      role: 'co_host',
      status: 'accepted',
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: 'user-2',
        display_name: 'Jane Co-Host',
        avatar_url: null,
        nickname: null
      }
    },
    {
      id: '3',
      crew_id: 'crew-1',
      user_id: 'user-3',
      role: 'member',
      status: 'accepted',
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: 'user-3',
        display_name: 'Bob Member',
        avatar_url: null,
        nickname: null
      }
    }
  ]

  const handlePromote = (userId: string) => {
    console.log('Promoting user:', userId)
  }

  const handleDemote = (userId: string) => {
    console.log('Demoting user:', userId)
  }

  const handleRemove = (userId: string) => {
    console.log('Removing user:', userId)
  }

  const isCreator = (userId: string) => {
    return userId === 'user-1' // Mock creator check
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Crew Management Test</h1>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">As Host (can manage all)</h2>
          <MemberList
            members={mockMembers}
            canManage={true}
            currentUserId="user-1"
            onPromote={handlePromote}
            onDemote={handleDemote}
            onRemove={handleRemove}
            isCreator={isCreator}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">As Co-Host (limited management)</h2>
          <MemberList
            members={mockMembers}
            canManage={true}
            currentUserId="user-2"
            onPromote={handlePromote}
            onDemote={handleDemote}
            onRemove={handleRemove}
            isCreator={isCreator}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-4">As Member (no management)</h2>
          <MemberList
            members={mockMembers}
            canManage={false}
            currentUserId="user-3"
            onPromote={handlePromote}
            onDemote={handleDemote}
            onRemove={handleRemove}
            isCreator={isCreator}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-white/5 rounded-lg">
        <h3 className="text-white font-semibold mb-2">Expected Behavior:</h3>
        <ul className="text-gray-300 space-y-1 text-sm">
          <li>• Host should see 3-dots menu for co-host and member (can promote member, demote co-host, remove both)</li>
          <li>• Co-Host should see 3-dots menu for member only (can remove member, but no promote/demote options)</li>
          <li>• Member should see no 3-dots menus</li>
          <li>• Host badge should show crown icon</li>
          <li>• Co-Host badge should show shield icon in blue</li>
          <li>• No 3-dots menu should appear for the host role</li>
        </ul>
      </div>

      <div className="mt-8 p-4 bg-white/5 rounded-lg">
        <h3 className="text-white font-semibold mb-2">Updated Toast & Notification Messages:</h3>
        <ul className="text-gray-300 space-y-1 text-sm">
          <li>• <strong>Promotion Toast:</strong> "👑 Member promoted to co-host!" (changed from 🍺, ONLY this toast shows)</li>
          <li>• <strong>Demotion Toast:</strong> "👑 Co-host demoted to member!" (changed from 🍺, ONLY this toast shows)</li>
          <li>• <strong>Promotion Notification:</strong> "👑 You've been promoted to co-host for the Crew [Crew Name]" with hyperlinked crew name</li>
          <li>• <strong>Demotion Notification:</strong> "👑 You've been demoted to a member for the Crew [Crew Name]" with hyperlinked crew name</li>
          <li>• <strong>Notification Icon:</strong> Crown emoji (👑) instead of bell icon for crew promotion/demotion</li>
          <li>• <strong>Sub-text:</strong> "Time to help lead the party!" for promotions, no sub-text for demotions</li>
          <li>• <strong>No Duplicate Toasts:</strong> Automatic notification toasts are disabled for crew promotions/demotions</li>
        </ul>
      </div>
    </div>
  )
}
