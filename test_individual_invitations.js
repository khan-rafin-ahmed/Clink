// Test Individual User Invitations
// Run this in the browser console to test the individual invitation functionality

import { supabase } from './frontend/src/lib/supabase.js'
import { sendEventInvitationsToUsers } from './frontend/src/lib/eventInvitationService.js'

async function testIndividualInvitations() {
  console.log('🧪 Testing Individual User Invitations...')
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('❌ Not authenticated:', userError)
      return
    }
    
    console.log('✅ Current user:', user.id)
    
    // Get a test event (create one if needed)
    let { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', user.id)
      .limit(1)
    
    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError)
      return
    }
    
    let testEvent = events?.[0]
    
    if (!testEvent) {
      console.log('📝 Creating test event...')
      const { data: newEvent, error: createError } = await supabase
        .from('events')
        .insert({
          title: 'Test Individual Invitations',
          description: 'Testing individual user invitations',
          location: 'Test Location',
          date_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          created_by: user.id,
          privacy: 'private'
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Error creating test event:', createError)
        return
      }
      
      testEvent = newEvent
    }
    
    console.log('✅ Test event:', testEvent.id, testEvent.title)
    
    // Get some users to invite (excluding current user)
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, email')
      .neq('user_id', user.id)
      .limit(2)
    
    if (usersError || !users || users.length === 0) {
      console.error('❌ Error fetching users or no users found:', usersError)
      return
    }
    
    console.log('✅ Found users to invite:', users.map(u => ({ id: u.user_id, name: u.display_name })))
    
    // Test 1: Check if the RPC function exists
    console.log('🔍 Testing send_event_invitations_to_users RPC function...')
    
    const userIds = users.map(u => u.user_id)
    
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('send_event_invitations_to_users', {
          p_event_id: testEvent.id,
          p_user_ids: userIds,
          p_invited_by: user.id
        })
      
      if (rpcError) {
        console.error('❌ RPC function error:', rpcError)
        console.log('🔧 The send_event_invitations_to_users function needs to be created in the database')
        return
      }
      
      console.log('✅ RPC function works:', rpcData)
      
    } catch (rpcException) {
      console.error('❌ RPC function exception:', rpcException)
      console.log('🔧 The send_event_invitations_to_users function needs to be created in the database')
      return
    }
    
    // Test 2: Check if notifications were created
    console.log('🔍 Checking if notifications were created...')
    
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('type', 'event_invitation')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (notifError) {
      console.error('❌ Error fetching notifications:', notifError)
    } else {
      console.log('✅ Recent event invitation notifications:', notifications)
    }
    
    // Test 3: Test the frontend service function
    console.log('🔍 Testing frontend sendEventInvitationsToUsers function...')
    
    try {
      const result = await sendEventInvitationsToUsers(testEvent.id, userIds, user.id)
      console.log('✅ Frontend service result:', result)
    } catch (serviceError) {
      console.error('❌ Frontend service error:', serviceError)
    }
    
    console.log('🎉 Individual invitation test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testIndividualInvitations()
