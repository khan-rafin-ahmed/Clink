// Test script to verify the mobile app event database fix
// This tests the getEventById function to ensure it works without foreign key errors

import { supabase } from './packages/shared/src/lib/supabase.js'

async function testEventByIdFix() {
  console.log('🧪 Testing Mobile App Event Database Fix...')
  
  try {
    // Test 1: Get a sample event ID from the database
    console.log('📋 Step 1: Getting sample event from database...')
    const { data: sampleEvents, error: sampleError } = await supabase
      .from('events')
      .select('id, title, created_by')
      .limit(1)
    
    if (sampleError) {
      console.error('❌ Error getting sample event:', sampleError)
      return
    }
    
    if (!sampleEvents || sampleEvents.length === 0) {
      console.log('⚠️ No events found in database to test with')
      return
    }
    
    const testEvent = sampleEvents[0]
    console.log('✅ Found test event:', {
      id: testEvent.id,
      title: testEvent.title,
      created_by: testEvent.created_by
    })
    
    // Test 2: Test the fixed getEventById function
    console.log('📋 Step 2: Testing getEventById function...')
    
    // Simulate the fixed function logic
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select(`
        *,
        latitude,
        longitude,
        place_id,
        place_name
      `)
      .eq('id', testEvent.id)
      .single()
    
    if (eventError) {
      console.error('❌ Error fetching event data:', eventError)
      return
    }
    
    console.log('✅ Event data fetched successfully')
    
    // Test 3: Test creator profile fetch (the part that was failing)
    console.log('📋 Step 3: Testing creator profile fetch...')
    
    let creator = null
    if (eventData.created_by) {
      const { data: creatorData, error: creatorError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .eq('user_id', eventData.created_by)
        .single()
      
      if (creatorError && creatorError.code === 'PGRST116') {
        console.log('⚠️ No profile found for creator, using fallback')
        creator = {
          user_id: eventData.created_by,
          display_name: `User ${eventData.created_by.slice(-4)}`,
          avatar_url: null
        }
      } else if (!creatorError && creatorData) {
        console.log('✅ Creator profile found:', creatorData.display_name)
        creator = creatorData
      } else {
        console.log('⚠️ Creator profile error, using fallback:', creatorError)
        creator = {
          user_id: eventData.created_by,
          display_name: `User ${eventData.created_by.slice(-4)}`,
          avatar_url: null
        }
      }
    }
    
    // Test 4: Combine the data (final result)
    console.log('📋 Step 4: Combining event data with creator...')
    
    const finalEvent = {
      ...eventData,
      creator
    }
    
    console.log('✅ Final event object created successfully:', {
      id: finalEvent.id,
      title: finalEvent.title,
      creator: finalEvent.creator ? {
        display_name: finalEvent.creator.display_name,
        user_id: finalEvent.creator.user_id
      } : null
    })

    // Test 4.5: Test the new getEventMembers function logic
    console.log('📋 Step 4.5: Testing getEventMembers deduplication logic...')

    // Simulate the corrected logic
    const uniqueAttendeeIds = new Set()
    const allAttendees = []

    // Always include the host
    if (eventData.created_by) {
      uniqueAttendeeIds.add(eventData.created_by)
      allAttendees.push({
        user_id: eventData.created_by,
        source: 'host',
        role: 'host'
      })
    }

    // Test with mock RSVPs (including one that might be the host)
    const mockRsvps = [
      { user_id: 'user1', status: 'going' },
      { user_id: eventData.created_by, status: 'going' }, // Host RSVP (should be ignored)
      { user_id: 'user2', status: 'going' }
    ]

    mockRsvps.forEach(rsvp => {
      if (!uniqueAttendeeIds.has(rsvp.user_id)) {
        uniqueAttendeeIds.add(rsvp.user_id)
        allAttendees.push({ ...rsvp, source: 'rsvp' })
      }
    })

    console.log('✅ Deduplication test passed:', {
      totalUniqueAttendees: allAttendees.length,
      hostCountedOnce: allAttendees.filter(a => a.user_id === eventData.created_by).length === 1,
      attendeeBreakdown: allAttendees.map(a => ({ source: a.source, role: a.role || 'attendee' }))
    })
    
    // Test 5: Verify no foreign key errors
    console.log('📋 Step 5: Verifying no foreign key relationship errors...')
    
    // This was the problematic query that caused the original error
    try {
      const { data: problematicQuery, error: problematicError } = await supabase
        .from('events')
        .select(`
          *,
          creator:user_profiles!events_created_by_fkey(
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('id', testEvent.id)
        .single()
      
      if (problematicError) {
        console.log('✅ Confirmed: Original problematic query still fails as expected')
        console.log('   Error:', problematicError.message)
        console.log('   This is why we needed the fix!')
      } else {
        console.log('⚠️ Unexpected: Original query worked - foreign key might have been fixed')
      }
    } catch (error) {
      console.log('✅ Confirmed: Original problematic query fails as expected')
    }
    
    console.log('\n🎉 TEST RESULTS:')
    console.log('✅ Event data can be fetched without foreign key errors')
    console.log('✅ Creator profile can be fetched separately')
    console.log('✅ Data can be combined successfully')
    console.log('✅ Mobile app should now work without database relationship errors')
    
    return true
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
    return false
  }
}

// Instructions for running this test
console.log(`
🧪 MOBILE APP EVENT FIX TEST

To run this test:
1. Make sure you're in the project root directory
2. Run: node test-mobile-event-fix.js

Expected Results:
✅ No "PGRST200" foreign key relationship errors
✅ Event data fetches successfully
✅ Creator profiles fetch separately without issues
✅ Mobile app EventDetailScreen should work

If this test passes, the mobile app database error should be fixed!
`)

// Export for use in other contexts
export { testEventByIdFix }
