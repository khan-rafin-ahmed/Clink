import { UserAvatar } from '@/components/UserAvatar'
import { ClickableUserAvatar } from '@/components/ClickableUserAvatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Crown, Shield, User, MoreVertical, Trash2 } from 'lucide-react'
import type { CrewMember } from '@/types'

interface MemberListProps {
  members: CrewMember[]
  canManage: boolean
  currentUserId?: string
  onPromote?: (userId: string) => void
  onDemote?: (userId: string) => void
  onRemove?: (userId: string) => void
  isCreator?: (userId: string) => boolean
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'host': return <Crown className="w-4 h-4 text-yellow-400" />
    case 'co_host': return <Shield className="w-4 h-4 text-blue-400" />
    default: return <User className="w-4 h-4 text-gray-400" />
  }
}

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'host': return 'Host'
    case 'co_host': return 'Co-Host'
    default: return 'Member'
  }
}

export function MemberList({ 
  members, 
  canManage, 
  currentUserId, 
  onPromote, 
  onDemote, 
  onRemove, 
  isCreator 
}: MemberListProps) {
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
          <div className="flex items-center gap-3">
            <ClickableUserAvatar
              userId={member.user_id}
              displayName={member.user?.display_name || 'Unknown'}
              avatarUrl={member.user?.avatar_url || null}
              size="sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">
                  {member.user?.display_name || 'Unknown User'}
                </span>
                {member.user?.nickname && (
                  <span className="text-yellow-400 italic text-sm">
                    "{member.user.nickname}"
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {getRoleIcon(member.role)}
                <span>{getRoleLabel(member.role)}</span>
              </div>
            </div>
          </div>

          {canManage && member.user_id !== currentUserId && member.role !== 'host' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-700 z-[10002]">
                {member.role === 'member' && onPromote && isCreator?.(currentUserId || '') && (
                  <DropdownMenuItem
                    onClick={() => onPromote(member.user_id)}
                    className="text-white hover:bg-gray-800"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Promote to Co-Host
                  </DropdownMenuItem>
                )}
                {member.role === 'co_host' && onDemote && isCreator?.(currentUserId || '') && (
                  <DropdownMenuItem
                    onClick={() => onDemote(member.user_id)}
                    className="text-white hover:bg-gray-800"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Demote to Member
                  </DropdownMenuItem>
                )}
                {onRemove && (
                  <>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem
                      onClick={() => onRemove(member.user_id)}
                      className="text-red-400 hover:bg-gray-800"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove from Crew
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  )
}
