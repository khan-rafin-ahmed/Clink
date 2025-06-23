// Test Fixed Event Invitations
// Run this in browser console to test the fix

async function testFixedEventInvitations() {
  console.log('🧪 Testing fixed event invitation email...');
  
  try {
    // Test with properly formatted data matching EventInvitationData interface
    const testEventData = {
      eventTitle: "Test Fixed Event",
      eventDate: "Friday, June 23, 2025", 
      eventTime: "7:00 PM",
      eventLocation: "Test Location",
      inviterName: "Test User",
      eventDescription: "Testing the fixed email format",
      acceptUrl: "https://thirstee.app/event/test/accept/123",
      declineUrl: "https://thirstee.app/event/test/decline/123", 
      eventUrl: "https://thirstee.app/event/test",
      vibe: "party"
    };
    
    console.log('📤 Testing with properly formatted data:', testEventData);
    
    // Call the Edge Function directly with template generation
    const response = await fetch('https://arpphimkotjvnfoacquj.supabase.co/functions/v1/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycHBoaW1rb3Rqdm5mb2FjcXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDYwNjYsImV4cCI6MjA2Mzc4MjA2Nn0.GksQ0jn0RuJCAqDcP2m2B0Z5uPP7_y-efc2EqztrL3k'
      },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: '🍺 You\'re invited: Test Fixed Event',
        type: 'event_invitation',
        data: testEventData
      })
    });
    
    const result = await response.text();
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response:', result);
    
    if (response.ok) {
      console.log('✅ Fixed event invitation email sent successfully!');
      console.log('🔍 Check email_logs table to verify it shows "sent" status');
    } else {
      console.error('❌ Fixed event invitation failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Instructions
console.log(`
🧪 FIXED EVENT INVITATION TEST

This tests the fixed event invitation email format.

To run:
1. Make sure you're on the Thirstee app page
2. Run: testFixedEventInvitations()

This will test if the property name fix resolves the pending email issue.
`);

// Auto-run if you want
// testFixedEventInvitations();
