import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { getUserCrews } from '@/lib/crewService'
import { useAuth } from '@/lib/auth-context'
import { Search, Plus, X, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { UserProfile, Crew } from '@/types'

interface UserSearchInviteProps {
  onUserSelect: (user: UserProfile) => void
  onCrewSelect: (crew: Crew) => void
  selectedUsers: UserProfile[]
  selectedCrews: Crew[]
  onRemoveUser: (userId: string) => void
  onRemoveCrew: (crewId: string) => void
  className?: string
}

export function UserSearchInvite({
  onUserSelect,
  onCrewSelect,
  selectedUsers,
  selectedCrews,
  onRemoveUser,
  onRemoveCrew,
  className
}: UserSearchInviteProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [userCrews, setUserCrews] = useState<Crew[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      loadUserCrews()
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadUserCrews = async () => {
    if (!user?.id) return

    try {
      const crews = await getUserCrews(user.id)
      setUserCrews(crews)
    } catch (error) {
      console.error('Error loading user crews:', error)
    }
  }

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, nickname, avatar_url, username')
        .or(`display_name.ilike.%${query}%,nickname.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('user_id', user?.id) // Exclude current user
        .limit(10)

      if (error) throw error

      // Filter out already selected users
      const filteredResults = (data || []).filter(
        result => !selectedUsers.some(selected => selected.user_id === result.user_id)
      )

      setSearchResults(filteredResults)
      setShowResults(true)
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
      setIsSearching(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      searchUsers(value)
    }, 300)
  }

  const handleUserSelect = (selectedUser: UserProfile) => {
    onUserSelect(selectedUser)
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  const handleCrewSelect = (crew: Crew) => {
    if (selectedCrews.some(selected => selected.id === crew.id)) {
      toast.error('Crew already selected')
      return
    }
    onCrewSelect(crew)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* User Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Invite Individual Users</h3>
        </div>

        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, display name, or nickname..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-glass border-white/10"
              onFocus={() => searchQuery && setShowResults(true)}
            />
          </div>

          {/* Search Results */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.user_id}
                  onClick={() => handleUserSelect(result)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#2A2A2A] transition-colors text-left"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={result.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-white text-xs">
                      {result.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {result.display_name}
                    </p>
                    {result.nickname && (
                      <p className="text-xs text-yellow-400 italic truncate">
                        aka {result.nickname}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 truncate">
                      @{result.username}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl p-4 text-center">
              <div className="text-sm text-muted-foreground">Searching...</div>
            </div>
          )}
        </div>
      </div>

      {/* Crew Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">Invite Entire Crews</h3>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {userCrews.map((crew) => {
            const isSelected = selectedCrews.some(selected => selected.id === crew.id)
            return (
              <button
                key={crew.id}
                onClick={() => !isSelected && handleCrewSelect(crew)}
                disabled={isSelected}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors text-left ${
                  isSelected
                    ? 'bg-primary/10 border-primary/30 cursor-not-allowed'
                    : 'bg-glass border-white/10 hover:border-primary/30 hover:bg-primary/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{crew.name}</p>
                    <p className="text-xs text-gray-400">
                      {crew.vibe} • {crew.visibility}
                    </p>
                  </div>
                </div>
                {isSelected ? (
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    Selected
                  </Badge>
                ) : (
                  <Plus className="w-4 h-4 text-primary" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Selected Users ({selectedUsers.length})</h4>
          <div className="space-y-2">
            {selectedUsers.map((selectedUser) => (
              <div
                key={selectedUser.user_id}
                className="flex items-center justify-between p-3 bg-glass border border-white/10 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={selectedUser.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-primary text-white text-xs">
                      {selectedUser.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">{selectedUser.display_name}</p>
                    {selectedUser.nickname && (
                      <p className="text-xs text-yellow-400 italic">aka {selectedUser.nickname}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveUser(selectedUser.user_id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Crews */}
      {selectedCrews.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Selected Crews ({selectedCrews.length})</h4>
          <div className="space-y-2">
            {selectedCrews.map((selectedCrew) => (
              <div
                key={selectedCrew.id}
                className="flex items-center justify-between p-3 bg-glass border border-white/10 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{selectedCrew.name}</p>
                    <p className="text-xs text-gray-400">{selectedCrew.vibe} • {selectedCrew.visibility}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveCrew(selectedCrew.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
