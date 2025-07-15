// Manual SendGrid Edge Function Test
// Run this in browser console on your Thirstee app to test the Edge Function directly

async function testSendGridEdgeFunction() {
  console.log('🧪 Testing SendGrid Edge Function...');
  
  try {
    // Get Supabase client (assuming it's available globally)
    const supabase = window.supabase || window._supabase;
    
    if (!supabase) {
      console.error('❌ Supabase client not found. Make sure you\'re on the Thirstee app page.');
      return;
    }
    
    console.log('✅ Supabase client found');
    
    // Test payload
    const testPayload = {
      to: 'test@example.com',
      subject: 'Manual SendGrid Test',
      type: 'event_invitation',
      html: '<h1>Manual Test</h1><p>This is a manual test of the SendGrid Edge Function.</p>',
      text: 'Manual Test\n\nThis is a manual test of the SendGrid Edge Function.'
    };
    
    console.log('📤 Sending test email with payload:', testPayload);
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: testPayload
    });
    
    if (error) {
      console.error('❌ Edge Function Error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText
      });
      return;
    }
    
    console.log('✅ Edge Function Response:', data);
    
    // Check if email was logged
    console.log('🔍 Checking email logs...');
    
    const { data: emailLogs, error: logError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('recipient', 'test@example.com')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (logError) {
      console.error('❌ Error checking email logs:', logError);
      return;
    }
    
    if (emailLogs && emailLogs.length > 0) {
      const latestLog = emailLogs[0];
      console.log('📧 Latest email log:', {
        id: latestLog.id,
        status: latestLog.status,
        error_message: latestLog.error_message,
        sent_at: latestLog.sent_at,
        created_at: latestLog.created_at
      });
      
      if (latestLog.status === 'sent') {
        console.log('🎉 SUCCESS: Email was sent successfully!');
      } else if (latestLog.status === 'pending') {
        console.log('⚠️ WARNING: Email is still pending - SendGrid might not be configured');
      } else if (latestLog.status === 'failed') {
        console.log('❌ FAILED: Email failed to send:', latestLog.error_message);
      }
    } else {
      console.log('⚠️ No email log found - email might not have been logged');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Instructions
console.log(`
🧪 SENDGRID EDGE FUNCTION TEST

To run this test:
1. Open your Thirstee app in the browser
2. Open browser console (F12)
3. Paste this entire script
4. Run: testSendGridEdgeFunction()

This will test the SendGrid Edge Function directly and show you:
- Whether the Edge Function is accessible
- Whether SendGrid is configured correctly
- Whether emails are being sent or stuck in pending
`);

// Auto-run if you want
// testSendGridEdgeFunction();
