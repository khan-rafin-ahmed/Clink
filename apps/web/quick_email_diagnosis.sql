-- Quick Email Diagnosis Script
-- Run this first to confirm the root cause

-- ============================================================================
-- CHECK 1: Does email column exist in user_profiles?
-- ============================================================================

SELECT 
  'EMAIL COLUMN CHECK' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_profiles' 
      AND column_name = 'email'
    ) THEN '✅ Email column exists'
    ELSE '❌ Email column MISSING - This is the problem!'
  END as result;

-- ============================================================================
-- CHECK 2: How many users have emails in auth.users vs user_profiles?
-- ============================================================================

SELECT 'EMAIL AVAILABILITY COMPARISON' as test_name;

SELECT 
  'auth.users' as table_name,
  COUNT(*) as total_users,
  COUNT(email) as users_with_email,
  ROUND(COUNT(email) * 100.0 / COUNT(*), 1) as email_percentage
FROM auth.users
UNION ALL
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as total_users,
  COUNT(email) as users_with_email,
  ROUND(COUNT(email) * 100.0 / COUNT(*), 1) as email_percentage
FROM user_profiles;

-- ============================================================================
-- CHECK 3: Show recent crew invitations and their email status
-- ============================================================================

SELECT 'RECENT CREW INVITATIONS EMAIL STATUS' as test_name;

SELECT 
  cm.id as invitation_id,
  up.display_name as invited_user,
  up.email as profile_email,
  au.email as auth_email,
  CASE 
    WHEN up.email IS NOT NULL THEN '✅ Has email in profile'
    WHEN au.email IS NOT NULL THEN '⚠️ Email only in auth.users'
    ELSE '❌ No email found anywhere'
  END as email_status,
  cm.created_at
FROM crew_members cm
JOIN user_profiles up ON cm.user_id = up.user_id
JOIN auth.users au ON cm.user_id = au.id
WHERE cm.created_at > NOW() - INTERVAL '24 hours'
ORDER BY cm.created_at DESC
LIMIT 5;

-- ============================================================================
-- CHECK 4: Show recent email logs to see failure patterns
-- ============================================================================

SELECT 'RECENT EMAIL LOGS' as test_name;

SELECT 
  recipient,
  subject,
  type,
  status,
  error_message,
  created_at
FROM email_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- DIAGNOSIS SUMMARY
-- ============================================================================

DO $$
DECLARE
  email_column_exists BOOLEAN;
  auth_email_count INTEGER;
  profile_email_count INTEGER;
  missing_count INTEGER;
BEGIN
  -- Check if email column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) INTO email_column_exists;
  
  -- Count emails in both tables
  SELECT COUNT(email) INTO auth_email_count FROM auth.users WHERE email IS NOT NULL;
  SELECT COUNT(email) INTO profile_email_count FROM user_profiles WHERE email IS NOT NULL;
  
  -- Count missing emails
  SELECT COUNT(*) INTO missing_count
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.user_id
  WHERE au.email IS NOT NULL 
    AND (up.email IS NULL OR up.email = '');
  
  RAISE NOTICE '🔍 EMAIL DIAGNOSIS RESULTS:';
  RAISE NOTICE '- Email column exists in user_profiles: %', email_column_exists;
  RAISE NOTICE '- Users with emails in auth.users: %', auth_email_count;
  RAISE NOTICE '- Users with emails in user_profiles: %', profile_email_count;
  RAISE NOTICE '- Users missing emails in profiles: %', missing_count;
  
  IF NOT email_column_exists THEN
    RAISE NOTICE '🚨 ROOT CAUSE CONFIRMED: user_profiles table has no email column!';
    RAISE NOTICE '💡 SOLUTION: Run simple_email_fix.sql to add email column and sync data';
  ELSIF missing_count > 0 THEN
    RAISE NOTICE '🚨 ROOT CAUSE CONFIRMED: % users have emails in auth.users but not in user_profiles!', missing_count;
    RAISE NOTICE '💡 SOLUTION: Run simple_email_fix.sql to sync missing emails';
  ELSE
    RAISE NOTICE '✅ Email sync appears to be working - investigate other causes';
  END IF;
END $$;
