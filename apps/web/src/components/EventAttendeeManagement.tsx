import { useState, useEffect } from 'react'
import { MemberList } from '@/components/shared/MemberList'
import { getEventMembersWithRoles, handleRoleChange, getUserEventRole } from '@/lib/eventRoleService'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'
import { User, Loader2 } from 'lucide-react'

interface EventAttendeeManagementProps {
  eventId: string
  eventCreatedBy?: string // Add event creator ID for fallback
  onMembersUpdate?: () => void
}

// EventMember already has the right structure, just need to ensure it matches CrewMember interface

export function EventAttendeeManagement({ eventId, eventCreatedBy, onMembersUpdate }: EventAttendeeManagementProps) {
  const { user } = useAuth()
  const [members, setMembers] = useState<any[]>([]) // Using any[] to match CrewMember structure
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('none')

  const loadMembers = async () => {
    try {
      setLoading(true)
      const eventMembers = await getEventMembersWithRoles(eventId)

      // Filter out members without user data and ensure role exists
      const validMembers = eventMembers.filter(member => member.user && member.role)
      setMembers(validMembers)
    } catch (error) {
      console.error('Error loading event members:', error)
      toast.error('Failed to load attendees')
    } finally {
      setLoading(false)
    }
  }

  // Effect to load user role immediately
  useEffect(() => {
    const loadUserRole = async () => {
      if (eventId && user?.id) {
        try {
          const role = await getUserEventRole(eventId, user.id)
          setUserRole(role)
        } catch (error) {
          console.error('Error loading user role on mount:', error)
          // Fallback: if user is event creator, they're host
          if (user?.id === eventCreatedBy) {
            setUserRole('host')
          }
        }
      }
    }

    loadUserRole()
  }, [eventId, user?.id, eventCreatedBy])

  // Effect to load members
  useEffect(() => {
    if (eventId && user?.id) {
      loadMembers()
    }
  }, [eventId, user?.id])

  const handlePromote = async (userId: string) => {
    if (!user) return

    try {
      const member = members.find(m => m.user_id === userId)
      const memberName = member?.user?.display_name || member?.user?.username || 'Unknown'
      const success = await handleRoleChange('promote', eventId, userId, user.id, memberName)
      if (success) {
        await loadMembers()
        onMembersUpdate?.()
      }
    } catch (error) {
      console.error('Error promoting member:', error)
    }
  }

  const handleDemote = async (userId: string) => {
    if (!user) return

    try {
      const member = members.find(m => m.user_id === userId)
      const memberName = member?.user?.display_name || member?.user?.username || 'Unknown'
      const success = await handleRoleChange('demote', eventId, userId, user.id, memberName)
      if (success) {
        await loadMembers()
        onMembersUpdate?.()
      }
    } catch (error) {
      console.error('Error demoting member:', error)
    }
  }

  const canManageRoles = userRole === 'host'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading attendees...</span>
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No attendees yet</p>
        <p className="text-sm mt-2">Invite people to your event to see them here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Attendees ({members.length})</h3>
        {canManageRoles && (
          <p className="text-sm text-muted-foreground">
            Tap the menu to promote members to co-host
          </p>
        )}
      </div>

      <MemberList
        members={members}
        canManage={canManageRoles}
        currentUserId={user?.id}
        onPromote={handlePromote}
        onDemote={handleDemote}
        isCreator={(userId) => userId === eventCreatedBy}
        context="event"
      />

      {!canManageRoles && userRole !== 'none' && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Only the event host can promote members to co-host
        </p>
      )}
    </div>
  )
}
