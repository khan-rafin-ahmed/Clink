// Test script to verify notification system state
// Run this with: node test_notification_system.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://arpphimkotjvnfoacquj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycHBoaW1rb3Rqdm5mb2FjcXVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDYwNjYsImV4cCI6MjA2Mzc4MjA2Nn0.GksQ0jn0RuJCAqDcP2m2B0Z5uPP7_y-efc2EqztrL3k'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testNotificationSystem() {
  console.log('🔍 Testing Notification System State...\n')
  
  try {
    // 1. Check for malformed notifications
    console.log('1. Checking for malformed "you invited you" notifications...')
    const { data: malformed, error: malformedError } = await supabase
      .from('notifications')
      .select('id, title, created_at')
      .ilike('title', '%you invited you%')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (malformedError) {
      console.error('❌ Error checking malformed notifications:', malformedError.message)
    } else {
      console.log(`📊 Found ${malformed?.length || 0} malformed notifications`)
      if (malformed && malformed.length > 0) {
        console.log('⚠️ Malformed notifications found:')
        malformed.forEach(n => console.log(`   - ${n.title} (${n.created_at})`))
        console.log('🔧 These should be cleaned up by applying the migration\n')
      } else {
        console.log('✅ No malformed notifications found\n')
      }
    }
    
    // 2. Check for "Someone" notifications
    console.log('2. Checking for "Someone" notifications...')
    const { data: someoneNotifs, error: someoneError } = await supabase
      .from('notifications')
      .select('id, title, created_at')
      .ilike('title', '%Someone%')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (someoneError) {
      console.error('❌ Error checking Someone notifications:', someoneError.message)
    } else {
      console.log(`📊 Found ${someoneNotifs?.length || 0} "Someone" notifications`)
      if (someoneNotifs && someoneNotifs.length > 0) {
        console.log('⚠️ "Someone" notifications found:')
        someoneNotifs.forEach(n => console.log(`   - ${n.title} (${n.created_at})`))
        console.log('🔧 These indicate the user name fallback needs fixing\n')
      } else {
        console.log('✅ No "Someone" notifications found\n')
      }
    }
    
    // 3. Check recent event invitation notifications
    console.log('3. Checking recent event invitation notifications...')
    const { data: recentInvites, error: inviteError } = await supabase
      .from('notifications')
      .select('id, title, message, data, created_at')
      .eq('type', 'event_invitation')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (inviteError) {
      console.error('❌ Error checking recent invitations:', inviteError.message)
    } else {
      console.log(`📊 Found ${recentInvites?.length || 0} recent event invitations`)
      if (recentInvites && recentInvites.length > 0) {
        recentInvites.forEach(n => {
          console.log(`   - ${n.title}`)
          console.log(`     Message: ${n.message}`)
          console.log(`     Has inviter_id: ${!!n.data?.inviter_id}`)
          console.log(`     Has invitation_id: ${!!n.data?.invitation_id}`)
          console.log(`     Created: ${n.created_at}\n`)
        })
      }
    }
    
    // 4. Check recent RSVP notifications
    console.log('4. Checking recent RSVP notifications...')
    const { data: recentRSVPs, error: rsvpError } = await supabase
      .from('notifications')
      .select('id, title, message, data, created_at')
      .eq('type', 'event_invitation_response')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (rsvpError) {
      console.error('❌ Error checking recent RSVPs:', rsvpError.message)
    } else {
      console.log(`📊 Found ${recentRSVPs?.length || 0} recent RSVP notifications`)
      if (recentRSVPs && recentRSVPs.length > 0) {
        recentRSVPs.forEach(n => {
          console.log(`   - ${n.title}`)
          console.log(`     Message: ${n.message}`)
          console.log(`     Has user_id: ${!!n.data?.user_id}`)
          console.log(`     Created: ${n.created_at}\n`)
        })
      }
    }
    
    // 5. Summary and recommendations
    console.log('📋 SUMMARY AND NEXT STEPS:')
    console.log('=' .repeat(50))
    
    const hasMalformed = malformed && malformed.length > 0
    const hasSomeone = someoneNotifs && someoneNotifs.length > 0
    
    if (!hasMalformed && !hasSomeone) {
      console.log('✅ Notification system appears to be working correctly!')
      console.log('✅ No malformed or "Someone" notifications found')
      console.log('📝 If you\'re still experiencing issues, apply the migration:')
      console.log('   1. Go to Supabase Dashboard > SQL Editor')
      console.log('   2. Run: supabase/migrations/20250111_fix_duplicate_notifications.sql')
    } else {
      console.log('⚠️ Issues detected in notification system:')
      if (hasMalformed) console.log('   - Malformed "you invited you" notifications found')
      if (hasSomeone) console.log('   - "Someone" notifications found')
      console.log('\n🔧 TO FIX THESE ISSUES:')
      console.log('   1. Apply the database migration:')
      console.log('      - Go to Supabase Dashboard > SQL Editor')
      console.log('      - Run: supabase/migrations/20250111_fix_duplicate_notifications.sql')
      console.log('   2. Deploy the updated frontend code')
      console.log('   3. Test creating new invitations')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run the test
testNotificationSystem()
