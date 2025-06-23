import { supabase } from './supabase'

/**
 * Debug utilities for investigating user search issues
 * These functions help diagnose why specific users might not appear in search results
 */

export interface UserSearchDebugInfo {
  user_id: string
  display_name: string | null
  nickname: string | null
  email: string | null
  email_confirmed: boolean
  profile_created_at: string | null
  auth_created_at: string | null
}

/**
 * Debug function to investigate user search issues
 * This function searches for users across all fields and returns detailed information
 */
export async function debugUserSearch(query: string): Promise<UserSearchDebugInfo[]> {
  try {
    console.log('🔍 Debug: Searching for users with query:', query)

    // Use the debug RPC function if available
    const { data: debugResults, error: rpcError } = await supabase
      .rpc('debug_user_search', { search_query: query })

    if (!rpcError && debugResults) {
      console.log('📊 Debug RPC results:', debugResults)
      return debugResults
    }

    // Fallback to manual search if RPC not available
    console.log('⚠️ RPC debug function not available, using manual search')

    // Search user_profiles table
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, nickname, created_at')
      .or(`display_name.ilike.%${query}%,nickname.ilike.%${query}%`)

    if (profileError) {
      console.error('❌ Error searching profiles:', profileError)
      throw profileError
    }

    console.log('👤 Profile search results:', profiles?.length || 0)
    profiles?.forEach(profile => {
      console.log(`  - ${profile.display_name} (${profile.nickname}) - ID: ${profile.user_id}`)
    })

    // Convert to debug format
    return (profiles || []).map(profile => ({
      user_id: profile.user_id,
      display_name: profile.display_name,
      nickname: profile.nickname,
      email: null, // Can't access email from client
      email_confirmed: false,
      profile_created_at: profile.created_at,
      auth_created_at: null
    }))

  } catch (error) {
    console.error('❌ Debug search failed:', error)
    throw error
  }
}

/**
 * Check if a specific user exists by searching for exact matches
 */
export async function checkUserExists(searchTerm: string): Promise<{
  exists: boolean
  matches: UserSearchDebugInfo[]
  searchType: 'exact' | 'partial'
}> {
  try {
    console.log('🔍 Checking if user exists:', searchTerm)

    // First try exact match
    const { data: exactMatches, error: exactError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, nickname, created_at')
      .or(`display_name.eq.${searchTerm},nickname.eq.${searchTerm}`)

    if (exactError) {
      console.error('❌ Error in exact search:', exactError)
    }

    if (exactMatches && exactMatches.length > 0) {
      console.log('✅ Found exact matches:', exactMatches.length)
      return {
        exists: true,
        matches: exactMatches.map(profile => ({
          user_id: profile.user_id,
          display_name: profile.display_name,
          nickname: profile.nickname,
          email: null,
          email_confirmed: false,
          profile_created_at: profile.created_at,
          auth_created_at: null
        })),
        searchType: 'exact'
      }
    }

    // Try partial match
    const partialMatches = await debugUserSearch(searchTerm)
    
    return {
      exists: partialMatches.length > 0,
      matches: partialMatches,
      searchType: 'partial'
    }

  } catch (error) {
    console.error('❌ User existence check failed:', error)
    return {
      exists: false,
      matches: [],
      searchType: 'partial'
    }
  }
}

/**
 * Test the enhanced search functionality
 */
export async function testEnhancedSearch(query: string): Promise<void> {
  try {
    console.log('🧪 Testing enhanced search for:', query)

    // Test the enhanced search function
    const { searchUsersForInvite } = await import('./crewService')
    const results = await searchUsersForInvite(query)

    console.log('📊 Enhanced search results:', results.length)
    results.forEach(result => {
      console.log(`  - ${result.display_name} (ID: ${result.user_id})`)
    })

    // Also run debug search
    const debugResults = await debugUserSearch(query)
    console.log('🔍 Debug search results:', debugResults.length)

    // Compare results
    const enhancedIds = new Set(results.map(r => r.user_id))
    const debugIds = new Set(debugResults.map(r => r.user_id))

    const missingInEnhanced = debugResults.filter(r => !enhancedIds.has(r.user_id))
    const missingInDebug = results.filter(r => !debugIds.has(r.user_id))

    if (missingInEnhanced.length > 0) {
      console.log('⚠️ Users found in debug but missing in enhanced search:', missingInEnhanced)
    }

    if (missingInDebug.length > 0) {
      console.log('⚠️ Users found in enhanced but missing in debug search:', missingInDebug)
    }

    if (missingInEnhanced.length === 0 && missingInDebug.length === 0) {
      console.log('✅ Search results are consistent')
    }

  } catch (error) {
    console.error('❌ Enhanced search test failed:', error)
  }
}

/**
 * Investigate the specific case of "Moniruz Zaman"
 */
export async function investigateMoniruzZaman(): Promise<void> {
  console.log('🕵️ Investigating Moniruz Zaman search issue...')

  const searchTerms = [
    'Moniruz Zaman',
    'Moniruz',
    'Zaman',
    'moniruz',
    'zaman',
    'MONIRUZ',
    'ZAMAN',
    'm.shojol80@gmail.com',
    'shojol80',
    'shojol'
  ]

  for (const term of searchTerms) {
    console.log(`\n🔍 Testing search term: "${term}"`)
    
    try {
      const result = await checkUserExists(term)
      console.log(`  - Exists: ${result.exists}`)
      console.log(`  - Matches: ${result.matches.length}`)
      console.log(`  - Search type: ${result.searchType}`)
      
      if (result.matches.length > 0) {
        result.matches.forEach(match => {
          console.log(`    * ${match.display_name} (${match.nickname}) - ${match.user_id}`)
        })
      }
    } catch (error) {
      console.error(`  ❌ Error testing "${term}":`, error)
    }
  }

  console.log('\n🧪 Testing enhanced search...')
  await testEnhancedSearch('Moniruz')
  await testEnhancedSearch('Zaman')
  await testEnhancedSearch('Moniruz Zaman')
}
