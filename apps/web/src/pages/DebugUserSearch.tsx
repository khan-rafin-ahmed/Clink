import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  debugUserSearch, 
  checkUserExists, 
  testEnhancedSearch, 
  investigateMoniruzZaman,
  type UserSearchDebugInfo 
} from '@/lib/debugUserSearch'
import { searchUsersForInvite } from '@/lib/crewService'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Search, Bug, User, Mail, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DebugUserSearch() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [debugResults, setDebugResults] = useState<UserSearchDebugInfo[]>([])
  const [enhancedResults, setEnhancedResults] = useState<any[]>([])
  const [existsResult, setExistsResult] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    console.log(message)
  }

  const handleDebugSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsLoading(true)
    setLogs([])
    addLog(`Starting debug search for: "${searchQuery}"`)

    try {
      // Run debug search
      const debug = await debugUserSearch(searchQuery)
      setDebugResults(debug)
      addLog(`Debug search found ${debug.length} users`)

      // Run enhanced search
      const enhanced = await searchUsersForInvite(searchQuery)
      setEnhancedResults(enhanced)
      addLog(`Enhanced search found ${enhanced.length} users`)

      // Check if user exists
      const exists = await checkUserExists(searchQuery)
      setExistsResult(exists)
      addLog(`User exists check: ${exists.exists} (${exists.searchType} match)`)

    } catch (error: any) {
      addLog(`Error: ${error.message}`)
      console.error('Debug search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestEnhanced = async () => {
    setIsLoading(true)
    addLog('Running enhanced search test...')
    
    try {
      await testEnhancedSearch(searchQuery)
      addLog('Enhanced search test completed - check console for details')
    } catch (error: any) {
      addLog(`Enhanced test error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvestigateMoniruz = async () => {
    setIsLoading(true)
    setLogs([])
    addLog('Starting Moniruz Zaman investigation...')
    
    try {
      await investigateMoniruzZaman()
      addLog('Moniruz investigation completed - check console for details')
    } catch (error: any) {
      addLog(`Investigation error: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please sign in to access the user search debug tool.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bug className="w-8 h-8" />
              User Search Debug Tool
            </h1>
            <p className="text-muted-foreground">
              Investigate user search functionality and diagnose issues
            </p>
          </div>
        </div>

        {/* Search Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter search query (name, email, etc.)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDebugSearch()}
              />
              <Button onClick={handleDebugSearch} disabled={isLoading}>
                <Search className="w-4 h-4 mr-2" />
                Debug Search
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTestEnhanced} disabled={isLoading}>
                Test Enhanced Search
              </Button>
              <Button variant="outline" onClick={handleInvestigateMoniruz} disabled={isLoading}>
                Investigate Moniruz Zaman
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Debug Results */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Search Results ({debugResults.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {debugResults.length === 0 ? (
                <p className="text-muted-foreground">No debug results yet</p>
              ) : (
                <div className="space-y-3">
                  {debugResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {result.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{result.display_name || 'No name'}</p>
                          {result.nickname && (
                            <p className="text-sm text-yellow-400 italic">{result.nickname}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>ID: {result.user_id}</p>
                        {result.email && <p>Email: {result.email}</p>}
                        <p>Email Confirmed: {result.email_confirmed ? '✅' : '❌'}</p>
                        {result.profile_created_at && (
                          <p>Profile: {new Date(result.profile_created_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Results */}
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Search Results ({enhancedResults.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {enhancedResults.length === 0 ? (
                <p className="text-muted-foreground">No enhanced results yet</p>
              ) : (
                <div className="space-y-3">
                  {enhancedResults.map((result, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={result.avatar_url} />
                          <AvatarFallback>
                            {result.display_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{result.display_name}</p>
                          {result.email && (
                            <p className="text-sm text-muted-foreground">{result.email}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">ID: {result.user_id}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Existence Check */}
        {existsResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>User Existence Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={existsResult.exists ? "default" : "secondary"}>
                  {existsResult.exists ? "EXISTS" : "NOT FOUND"}
                </Badge>
                <Badge variant="outline">{existsResult.searchType.toUpperCase()}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Found {existsResult.matches.length} matches using {existsResult.searchType} search
              </p>
            </CardContent>
          </Card>
        )}

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs yet</p>
            ) : (
              <div className="bg-muted rounded-lg p-4 max-h-60 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {logs.join('\n')}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
