-- Database Email Investigation Script
-- Run this in Supabase SQL Editor to diagnose email issues
-- This script investigates why production emails fail while test emails work

-- ============================================================================
-- INVESTIGATION 1: Check user_profiles table schema
-- ============================================================================

SELECT 'USER_PROFILES SCHEMA CHECK' as investigation_section;

-- Check if email column exists in user_profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- INVESTIGATION 2: Check email data availability
-- ============================================================================

SELECT 'EMAIL DATA AVAILABILITY' as investigation_section;

-- Count users with and without emails in user_profiles
SELECT 
  COUNT(*) as total_users,
  COUNT(email) as users_with_email_in_profiles,
  COUNT(*) - COUNT(email) as users_without_email_in_profiles,
  ROUND(COUNT(email) * 100.0 / COUNT(*), 1) as email_coverage_percentage
FROM user_profiles;

-- ============================================================================
-- INVESTIGATION 3: Compare auth.users vs user_profiles emails
-- ============================================================================

SELECT 'AUTH.USERS VS USER_PROFILES EMAIL COMPARISON' as investigation_section;

-- Check email availability in both tables
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
-- INVESTIGATION 4: Find users with missing emails in user_profiles
-- ============================================================================

SELECT 'USERS WITH MISSING EMAILS IN USER_PROFILES' as investigation_section;

-- Show users who have emails in auth.users but not in user_profiles
SELECT 
  au.id as user_id,
  au.email as auth_email,
  up.email as profile_email,
  up.display_name,
  au.created_at
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE au.email IS NOT NULL 
  AND (up.email IS NULL OR up.email = '')
ORDER BY au.created_at DESC
LIMIT 10;

-- ============================================================================
-- INVESTIGATION 5: Check recent crew invitations and their email status
-- ============================================================================

SELECT 'RECENT CREW INVITATIONS EMAIL STATUS' as investigation_section;

-- Check recent crew invitations and whether invited users have emails
SELECT 
  cm.id as invitation_id,
  cm.crew_id,
  cm.user_id as invited_user_id,
  cm.status as invitation_status,
  up.display_name as invited_user_name,
  up.email as profile_email,
  au.email as auth_email,
  CASE 
    WHEN up.email IS NOT NULL THEN '✅ Has email in profile'
    WHEN au.email IS NOT NULL THEN '⚠️ Email only in auth.users'
    ELSE '❌ No email found'
  END as email_status,
  cm.created_at
FROM crew_members cm
JOIN user_profiles up ON cm.user_id = up.user_id
JOIN auth.users au ON cm.user_id = au.id
WHERE cm.created_at > NOW() - INTERVAL '24 hours'
ORDER BY cm.created_at DESC
LIMIT 10;

-- ============================================================================
-- INVESTIGATION 6: Check recent event invitations and their email status
-- ============================================================================

SELECT 'RECENT EVENT INVITATIONS EMAIL STATUS' as investigation_section;

-- Check recent event invitations and whether invited users have emails
SELECT 
  em.id as invitation_id,
  em.event_id,
  em.user_id as invited_user_id,
  em.status as invitation_status,
  up.display_name as invited_user_name,
  up.email as profile_email,
  au.email as auth_email,
  CASE 
    WHEN up.email IS NOT NULL THEN '✅ Has email in profile'
    WHEN au.email IS NOT NULL THEN '⚠️ Email only in auth.users'
    ELSE '❌ No email found'
  END as email_status,
  em.created_at
FROM event_members em
JOIN user_profiles up ON em.user_id = up.user_id
JOIN auth.users au ON em.user_id = au.id
WHERE em.created_at > NOW() - INTERVAL '24 hours'
ORDER BY em.created_at DESC
LIMIT 10;

-- ============================================================================
-- INVESTIGATION 7: Check email logs for failed emails
-- ============================================================================

SELECT 'RECENT EMAIL LOGS' as investigation_section;

-- Check recent email logs to see failure patterns
SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  error_message,
  created_at,
  sent_at
FROM email_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- INVESTIGATION 8: Test email functions
-- ============================================================================

SELECT 'EMAIL FUNCTION TESTS' as investigation_section;

-- Check if email-related functions exist
SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%email%'
ORDER BY routine_name;

-- ============================================================================
-- SUMMARY AND RECOMMENDATIONS
-- ============================================================================

SELECT 'INVESTIGATION SUMMARY' as investigation_section;

-- Provide summary of findings
DO $$
DECLARE
  profile_email_count INTEGER;
  auth_email_count INTEGER;
  missing_email_count INTEGER;
BEGIN
  -- Count emails in user_profiles
  SELECT COUNT(email) INTO profile_email_count FROM user_profiles WHERE email IS NOT NULL;

  -- Count emails in auth.users
  SELECT COUNT(email) INTO auth_email_count FROM auth.users WHERE email IS NOT NULL;

  -- Count users with emails in auth but not in profiles
  SELECT COUNT(*) INTO missing_email_count
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.user_id
  WHERE au.email IS NOT NULL
    AND (up.email IS NULL OR up.email = '');

  RAISE NOTICE '📊 INVESTIGATION RESULTS:';
  RAISE NOTICE '- Users with emails in auth.users: %', auth_email_count;
  RAISE NOTICE '- Users with emails in user_profiles: %', profile_email_count;
  RAISE NOTICE '- Users missing emails in user_profiles: %', missing_email_count;

  IF missing_email_count > 0 THEN
    RAISE NOTICE '🚨 ROOT CAUSE IDENTIFIED: % users have emails in auth.users but not in user_profiles', missing_email_count;
    RAISE NOTICE '💡 SOLUTION: Run email sync migration to copy emails from auth.users to user_profiles';
  ELSE
    RAISE NOTICE '✅ Email sync appears to be working correctly';
  END IF;
END $$;
