-- Debug the complete email system
-- Run this in Supabase SQL Editor to find the issue

-- ============================================================================
-- CHECK 1: Email column and data
-- ============================================================================

SELECT 'EMAIL COLUMN CHECK' as test_section;

-- Check if email column exists and has data
SELECT 
  COUNT(*) as total_users,
  COUNT(email) as users_with_email,
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as users_with_valid_email
FROM user_profiles;

-- Show actual user emails (first 3 users)
SELECT 'SAMPLE USER EMAILS' as test_section;
SELECT 
  user_id,
  display_name,
  email,
  created_at
FROM user_profiles 
WHERE email IS NOT NULL
ORDER BY created_at DESC 
LIMIT 3;

-- ============================================================================
-- CHECK 2: Recent crew invitations
-- ============================================================================

SELECT 'RECENT CREW INVITATIONS' as test_section;

-- Check recent crew member invitations
SELECT 
  cm.id as invitation_id,
  cm.crew_id,
  cm.user_id,
  cm.status,
  cm.created_at,
  up.display_name as invited_user,
  up.email as invited_user_email,
  c.name as crew_name
FROM crew_members cm
JOIN user_profiles up ON cm.user_id = up.user_id
JOIN crews c ON cm.crew_id = c.id
WHERE cm.created_at > NOW() - INTERVAL '2 hours'
ORDER BY cm.created_at DESC
LIMIT 5;

-- ============================================================================
-- CHECK 3: Recent event invitations
-- ============================================================================

SELECT 'RECENT EVENT INVITATIONS' as test_section;

-- First check what columns exist in event_invitations
SELECT 'EVENT_INVITATIONS TABLE STRUCTURE' as info;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'event_invitations'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check recent event invitations (using correct column names)
SELECT 'RECENT EVENT INVITATIONS DATA' as info;
SELECT
  ei.*,
  e.title as event_title
FROM event_invitations ei
JOIN events e ON ei.event_id = e.id
WHERE ei.created_at > NOW() - INTERVAL '2 hours'
ORDER BY ei.created_at DESC
LIMIT 5;

-- ============================================================================
-- CHECK 4: Email logs
-- ============================================================================

SELECT 'EMAIL LOGS CHECK' as test_section;

-- Check recent email logs
SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  created_at,
  sent_at,
  error_message
FROM email_logs 
WHERE created_at > NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- CHECK 5: Manual email sync (if needed)
-- ============================================================================

SELECT 'MANUAL EMAIL SYNC' as test_section;

-- Force sync emails for users who don't have them
UPDATE user_profiles 
SET email = au.email
FROM auth.users au 
WHERE user_profiles.user_id = au.id 
  AND (user_profiles.email IS NULL OR user_profiles.email = '')
  AND au.email IS NOT NULL;

-- Show how many emails were synced
SELECT 
  COUNT(*) as total_users,
  COUNT(email) as users_with_email_after_sync
FROM user_profiles;

-- ============================================================================
-- CHECK 6: Test specific user
-- ============================================================================

SELECT 'SPECIFIC USER TEST' as test_section;

-- Get your user details (the person running this script)
DO $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  current_user_name TEXT;
BEGIN
  -- This will work if you're logged in and have a profile
  SELECT user_id, email, display_name 
  INTO current_user_id, current_user_email, current_user_name
  FROM user_profiles 
  WHERE email IS NOT NULL 
  LIMIT 1;
  
  IF current_user_id IS NOT NULL THEN
    RAISE NOTICE 'Found user: % (%) with email: %', current_user_name, current_user_id, current_user_email;
    RAISE NOTICE 'This user should be able to receive emails';
  ELSE
    RAISE NOTICE 'No users found with emails in user_profiles';
  END IF;
END $$;

-- ============================================================================
-- DIAGNOSIS
-- ============================================================================

SELECT 'DIAGNOSIS' as section;

-- Check what might be wrong
SELECT 
  CASE 
    WHEN (SELECT COUNT(email) FROM user_profiles WHERE email IS NOT NULL) = 0 
    THEN '❌ No emails in user_profiles - sync failed'
    WHEN (SELECT COUNT(*) FROM crew_members WHERE created_at > NOW() - INTERVAL '2 hours') = 0
    THEN '❌ No recent crew invitations found'
    WHEN (SELECT COUNT(*) FROM email_logs WHERE created_at > NOW() - INTERVAL '2 hours') = 0
    THEN '❌ No email logs - frontend not calling email function'
    WHEN (SELECT COUNT(*) FROM email_logs WHERE created_at > NOW() - INTERVAL '2 hours' AND status = 'failed') > 0
    THEN '❌ Emails failing - check error messages above'
    ELSE '✅ System looks good - check specific issues above'
  END as diagnosis;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

SELECT 'NEXT STEPS' as section;
SELECT 'Check the results above to identify the issue:' as instruction;
SELECT '1. If no emails in user_profiles: Email sync failed' as step_1;
SELECT '2. If no recent invitations: Create test invitation' as step_2;
SELECT '3. If no email logs: Frontend not calling email function' as step_3;
SELECT '4. If emails failing: Check error messages' as step_4;
