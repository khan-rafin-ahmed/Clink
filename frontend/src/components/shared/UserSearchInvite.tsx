import { useState, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { UserAvatar } from '@/components/UserAvatar'
import { searchUsersForInvite } from '@/lib/crewService'
import { Loader2, UserPlus } from 'lucide-react'

interface UserSearchInviteProps {
  onInvite: (userId: string) => Promise<void>
  label?: string
  placeholder?: string
}

export function UserSearchInvite({ onInvite, label = "Invite by Username or Email", placeholder = "Search users..." }: UserSearchInviteProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ user_id: string; display_name: string; avatar_url: string | null }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    timeoutRef.current = setTimeout(async () => {
      try {
        const searchResults = await searchUsersForInvite(searchQuery)
        setResults(searchResults)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [])

  const handleInvite = async (userId: string) => {
    try {
      setIsInviting(true)
      await onInvite(userId)
      setQuery('')
      setResults([])
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-white text-sm font-medium">{label}</Label>
        <div className="flex gap-2 mt-2">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              handleSearch(e.target.value)
            }}
            placeholder={placeholder}
            className="bg-gray-900 border-gray-700 text-white placeholder-gray-400"
          />
          <Button
            type="button"
            disabled={isSearching || !query.trim()}
            className="bg-yellow-600 hover:bg-yellow-700 text-black"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {results.map((user) => (
            <div key={user.user_id} className="flex items-center justify-between p-2 bg-gray-900 rounded">
              <div className="flex items-center gap-2">
                <UserAvatar displayName={user.display_name} avatarUrl={user.avatar_url} size="sm" />
                <span className="text-white">{user.display_name}</span>
              </div>
              <Button
                size="sm"
                onClick={() => handleInvite(user.user_id)}
                disabled={isInviting}
                className="bg-yellow-600 hover:bg-yellow-700 text-black"
              >
                {isInviting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Invite'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
