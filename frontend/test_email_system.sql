-- TEST EMAIL SYSTEM
-- Run this after setting up the email system to verify everything works

-- ============================================================================
-- TEST 1: CHECK TABLES AND FUNCTIONS EXIST
-- ============================================================================

SELECT '🧪 TESTING EMAIL SYSTEM SETUP' as test_section;

-- Check if email tables exist
SELECT 
  'email_logs' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'email_logs' AND table_schema = 'public'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
  'email_preferences' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'email_preferences' AND table_schema = 'public'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check if functions exist
SELECT 
  'get_user_email_preferences' as function_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'get_user_email_preferences' AND routine_schema = 'public'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
  'send_event_invitation_emails' as function_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'send_event_invitation_emails' AND routine_schema = 'public'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- ============================================================================
-- TEST 2: CHECK POLICIES EXIST
-- ============================================================================

SELECT '🔒 CHECKING POLICIES' as test_section;

SELECT 
  tablename,
  policyname,
  CASE WHEN policyname IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM pg_policies 
WHERE tablename IN ('email_logs', 'email_preferences')
ORDER BY tablename, policyname;

-- ============================================================================
-- TEST 3: TEST EMAIL PREFERENCES FUNCTION
-- ============================================================================

SELECT '📧 TESTING EMAIL PREFERENCES' as test_section;

-- Test with current user (if authenticated)
-- This will create default preferences if they don't exist
SELECT 
  'Testing email preferences for current user' as test_description,
  CASE WHEN auth.uid() IS NOT NULL THEN '✅ USER AUTHENTICATED' ELSE '❌ NOT AUTHENTICATED' END as auth_status;

-- If authenticated, test the function
DO $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    -- Test the email preferences function
    PERFORM get_user_email_preferences(auth.uid());
    RAISE NOTICE '✅ Email preferences function works for current user';
  ELSE
    RAISE NOTICE '⚠️  Cannot test email preferences - user not authenticated';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Email preferences function failed: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 4: INSERT TEST EMAIL LOG
-- ============================================================================

SELECT '📝 TESTING EMAIL LOGGING' as test_section;

-- Insert a test email log (this tests the table structure and policies)
DO $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    -- Get current user's email
    INSERT INTO email_logs (
      recipient,
      subject,
      type,
      status,
      data
    ) 
    SELECT 
      au.email,
      'Test Email from Thirstee Setup',
      'event_invitation',
      'pending',
      jsonb_build_object(
        'test', true,
        'setup_time', NOW(),
        'user_id', auth.uid()
      )
    FROM auth.users au 
    WHERE au.id = auth.uid();
    
    RAISE NOTICE '✅ Test email log inserted successfully';
  ELSE
    RAISE NOTICE '⚠️  Cannot test email logging - user not authenticated';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Email logging failed: %', SQLERRM;
END $$;

-- ============================================================================
-- TEST 5: CHECK RECENT EMAIL LOGS
-- ============================================================================

SELECT '📋 RECENT EMAIL LOGS' as test_section;

-- Show recent email logs (only for current user due to RLS)
SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  created_at,
  CASE WHEN data->>'test' = 'true' THEN '🧪 TEST EMAIL' ELSE '📧 REAL EMAIL' END as email_type
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================================================
-- TEST 6: CHECK EMAIL PREFERENCES
-- ============================================================================

SELECT '⚙️ EMAIL PREFERENCES' as test_section;

-- Show current user's email preferences
SELECT 
  user_id,
  event_invitations,
  event_reminders,
  crew_invitations,
  marketing_emails,
  email_frequency,
  created_at
FROM email_preferences 
WHERE user_id = auth.uid();

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

SELECT '🎯 FINAL STATUS' as test_section;

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_preferences')
      AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_email_preferences')
      AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'send_event_invitation_emails')
      AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_logs')
      AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_preferences')
    THEN '🎉 EMAIL SYSTEM READY! All components are set up correctly.'
    ELSE '⚠️  EMAIL SYSTEM INCOMPLETE - Some components are missing.'
  END as final_status;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

SELECT '📋 NEXT STEPS' as section;

SELECT 
  '1. Set SendGrid environment variables in Supabase' as step
UNION ALL
SELECT '2. Deploy Edge Functions: supabase functions deploy send-email'
UNION ALL  
SELECT '3. Test email sending through your app'
UNION ALL
SELECT '4. Monitor email_logs table for delivery status'
UNION ALL
SELECT '5. Configure email preferences UI in your app';

-- Clean up test data
DELETE FROM email_logs WHERE data->>'test' = 'true';
