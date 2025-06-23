-- Email Fix Verification Script
-- Run this after applying the email sync migration to verify everything works

-- ============================================================================
-- TEST 1: Verify email sync migration worked
-- ============================================================================

SELECT 'EMAIL SYNC VERIFICATION' as test_section;

-- Check email column exists and has data
SELECT 
  'user_profiles email column' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      AND column_name = 'email'
    ) THEN '✅ Email column exists'
    ELSE '❌ Email column missing'
  END as status;

-- Check email data coverage
SELECT 
  'email data coverage' as check_type,
  CONCAT(
    COUNT(email), ' out of ', COUNT(*), ' users have emails (',
    ROUND(COUNT(email) * 100.0 / COUNT(*), 1), '%)'
  ) as status
FROM user_profiles;

-- ============================================================================
-- TEST 2: Test secure email lookup function
-- ============================================================================

SELECT 'SECURE EMAIL LOOKUP FUNCTION TEST' as test_section;

-- Check if function exists
SELECT 
  'get_user_email_for_invitation function' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'get_user_email_for_invitation'
    ) THEN '✅ Function exists'
    ELSE '❌ Function missing'
  END as status;

-- Test function with a real user
DO $$
DECLARE
  test_user_id UUID;
  test_result RECORD;
BEGIN
  -- Get a user ID to test with
  SELECT user_id INTO test_user_id FROM user_profiles LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test the secure function
    SELECT * INTO test_result FROM get_user_email_for_invitation(test_user_id);
    
    IF test_result.email IS NOT NULL THEN
      RAISE NOTICE '✅ Secure email function works: % (%)', test_result.display_name, test_result.email;
    ELSE
      RAISE NOTICE '❌ Secure email function returned no email for user %', test_user_id;
    END IF;
  ELSE
    RAISE NOTICE '⚠️ No users found to test secure email function';
  END IF;
END $$;

-- ============================================================================
-- TEST 3: Simulate crew invitation email lookup
-- ============================================================================

SELECT 'CREW INVITATION EMAIL LOOKUP TEST' as test_section;

-- Test crew invitation scenario
DO $$
DECLARE
  test_crew_id UUID;
  test_user_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get a test crew and user
  SELECT id INTO test_crew_id FROM crews LIMIT 1;
  SELECT user_id INTO test_user_id FROM user_profiles WHERE email IS NOT NULL LIMIT 1;
  
  IF test_crew_id IS NOT NULL AND test_user_id IS NOT NULL THEN
    -- Simulate the crew invitation email lookup process
    
    -- First try: user_profiles direct lookup
    SELECT display_name, email INTO user_name, user_email
    FROM user_profiles 
    WHERE user_id = test_user_id;
    
    IF user_email IS NOT NULL THEN
      RAISE NOTICE '✅ Crew invitation email lookup (direct): % (%)', user_name, user_email;
    ELSE
      -- Fallback: secure function
      SELECT display_name, email INTO user_name, user_email
      FROM get_user_email_for_invitation(test_user_id);
      
      IF user_email IS NOT NULL THEN
        RAISE NOTICE '✅ Crew invitation email lookup (fallback): % (%)', user_name, user_email;
      ELSE
        RAISE NOTICE '❌ Crew invitation email lookup failed for user %', test_user_id;
      END IF;
    END IF;
  ELSE
    RAISE NOTICE '⚠️ No test data available for crew invitation test';
  END IF;
END $$;

-- ============================================================================
-- TEST 4: Simulate event invitation email lookup
-- ============================================================================

SELECT 'EVENT INVITATION EMAIL LOOKUP TEST' as test_section;

-- Test event invitation scenario
DO $$
DECLARE
  test_event_id UUID;
  test_user_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get a test event and user
  SELECT id INTO test_event_id FROM events LIMIT 1;
  SELECT user_id INTO test_user_id FROM user_profiles WHERE email IS NOT NULL LIMIT 1;
  
  IF test_event_id IS NOT NULL AND test_user_id IS NOT NULL THEN
    -- Simulate the event invitation email lookup process
    
    -- First try: user_profiles direct lookup
    SELECT display_name, email INTO user_name, user_email
    FROM user_profiles 
    WHERE user_id = test_user_id;
    
    IF user_email IS NOT NULL THEN
      RAISE NOTICE '✅ Event invitation email lookup (direct): % (%)', user_name, user_email;
    ELSE
      -- Fallback: secure function
      SELECT display_name, email INTO user_name, user_email
      FROM get_user_email_for_invitation(test_user_id);
      
      IF user_email IS NOT NULL THEN
        RAISE NOTICE '✅ Event invitation email lookup (fallback): % (%)', user_name, user_email;
      ELSE
        RAISE NOTICE '❌ Event invitation email lookup failed for user %', test_user_id;
      END IF;
    END IF;
  ELSE
    RAISE NOTICE '⚠️ No test data available for event invitation test';
  END IF;
END $$;

-- ============================================================================
-- TEST 5: Check for users still missing emails
-- ============================================================================

SELECT 'MISSING EMAIL CHECK' as test_section;

-- Find users who still don't have emails
SELECT 
  'users still missing emails' as check_type,
  COUNT(*) as count
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE au.email IS NOT NULL 
  AND (up.email IS NULL OR up.email = '');

-- Show details of users missing emails (if any)
SELECT 
  up.user_id,
  up.display_name,
  au.email as auth_email,
  up.email as profile_email,
  'Missing email in profile' as issue
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE au.email IS NOT NULL 
  AND (up.email IS NULL OR up.email = '')
LIMIT 5;

-- ============================================================================
-- TEST 6: Verify email sync trigger works for new users
-- ============================================================================

SELECT 'EMAIL SYNC TRIGGER TEST' as test_section;

-- Check if trigger exists
SELECT 
  'sync_user_email_trigger' as trigger_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'sync_user_email_trigger'
    ) THEN '✅ Trigger exists'
    ELSE '❌ Trigger missing'
  END as status;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT 'VERIFICATION SUMMARY' as test_section;

DO $$
DECLARE
  total_users INTEGER;
  users_with_email INTEGER;
  missing_emails INTEGER;
  function_exists BOOLEAN;
  trigger_exists BOOLEAN;
BEGIN
  -- Get counts
  SELECT COUNT(*) INTO total_users FROM user_profiles;
  SELECT COUNT(*) INTO users_with_email FROM user_profiles WHERE email IS NOT NULL;
  
  SELECT COUNT(*) INTO missing_emails
  FROM user_profiles up
  JOIN auth.users au ON up.user_id = au.id
  WHERE au.email IS NOT NULL AND (up.email IS NULL OR up.email = '');
  
  -- Check function exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'get_user_email_for_invitation'
  ) INTO function_exists;
  
  -- Check trigger exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'sync_user_email_trigger'
  ) INTO trigger_exists;
  
  RAISE NOTICE '📊 EMAIL FIX VERIFICATION RESULTS:';
  RAISE NOTICE '- Total users: %', total_users;
  RAISE NOTICE '- Users with emails: %', users_with_email;
  RAISE NOTICE '- Users still missing emails: %', missing_emails;
  RAISE NOTICE '- Secure email function exists: %', function_exists;
  RAISE NOTICE '- Email sync trigger exists: %', trigger_exists;
  
  IF missing_emails = 0 AND function_exists AND trigger_exists THEN
    RAISE NOTICE '🎉 SUCCESS: Email system is fully fixed and ready!';
    RAISE NOTICE '✅ Production emails should now work correctly';
  ELSE
    RAISE NOTICE '⚠️ ISSUES FOUND: Some components need attention';
    IF missing_emails > 0 THEN
      RAISE NOTICE '- Run sync_all_user_emails() to fix missing emails';
    END IF;
    IF NOT function_exists THEN
      RAISE NOTICE '- Create get_user_email_for_invitation function';
    END IF;
    IF NOT trigger_exists THEN
      RAISE NOTICE '- Create email sync trigger';
    END IF;
  END IF;
END $$;
