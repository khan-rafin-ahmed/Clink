// Debug script to test crew invitation with correct values
// Run this in your browser console on the Thirstee app

(async function debugCrewInvitation() {
  console.log('🧪 Starting crew invitation debug test...')
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    console.error('❌ Not authenticated:', userError)
    return
  }
  
  console.log('👤 Current user:', {
    id: user.id,
    email: user.email
  })
  
  // Get user's crews
  const { data: crews, error: crewsError } = await supabase
    .from('crews')
    .select('*')
    .eq('created_by', user.id)
  
  if (crewsError) {
    console.error('❌ Error fetching crews:', crewsError)
    return
  }
  
  console.log('🏴‍☠️ User crews:', crews)
  
  if (!crews || crews.length === 0) {
    console.log('⚠️ No crews found. Create a crew first.')
    return
  }
  
  // Get user's events
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (eventsError) {
    console.error('❌ Error fetching events:', eventsError)
    return
  }
  
  console.log('🍺 User events:', events)
  
  if (!events || events.length === 0) {
    console.log('⚠️ No events found. Create an event first.')
    return
  }
  
  // Use the first crew and first event for testing
  const testCrew = crews[0]
  const testEvent = events[0]
  
  console.log('🧪 Testing with:', {
    eventId: testEvent.id,
    eventTitle: testEvent.title,
    eventCreator: testEvent.created_by,
    crewId: testCrew.id,
    crewName: testCrew.name,
    currentUserId: user.id,
    isEventCreator: testEvent.created_by === user.id
  })
  
  // Verify crew members
  const { data: crewMembers, error: membersError } = await supabase
    .from('crew_members')
    .select(`
      *,
      user_profiles(display_name)
    `)
    .eq('crew_id', testCrew.id)
    .eq('status', 'accepted')
  
  if (membersError) {
    console.error('❌ Error fetching crew members:', membersError)
    return
  }
  
  console.log('👥 Crew members:', crewMembers)
  
  if (!crewMembers || crewMembers.length <= 1) {
    console.log('⚠️ Crew needs at least 2 members (including you) to test invitations.')
    return
  }
  
  // Now test the RPC call
  console.log('📤 Calling send_event_invitations_to_crew RPC...')
  
  const { data, error } = await supabase
    .rpc('send_event_invitations_to_crew', {
      p_event_id: testEvent.id,
      p_crew_id: testCrew.id,
      p_inviter_id: user.id
    })
  
  console.log('📊 RPC Response:', { data, error })
  
  if (error) {
    console.error('❌ RPC Error:', error)
    
    // Additional debugging
    if (error.message.includes('Only event creator')) {
      console.log('🔍 Event creator validation failed. Checking details:')
      console.log('- Event creator ID:', testEvent.created_by)
      console.log('- Current user ID:', user.id)
      console.log('- IDs match:', testEvent.created_by === user.id)
    }
  } else {
    console.log('✅ Success! Invitations sent:', data)
  }
})() // Self-executing function
