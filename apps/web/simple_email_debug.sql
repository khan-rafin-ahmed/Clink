-- Simple email system debug
-- Run this in Supabase SQL Editor

-- ============================================================================
-- CHECK 1: Do users have emails?
-- ============================================================================

SELECT 'USER EMAILS CHECK' as section;

SELECT 
  COUNT(*) as total_users,
  COUNT(email) as users_with_email,
  ROUND(COUNT(email) * 100.0 / COUNT(*), 1) as email_percentage
FROM user_profiles;

-- Show some actual emails (masked for privacy)
SELECT 
  display_name,
  CASE 
    WHEN email IS NOT NULL THEN CONCAT(LEFT(email, 3), '***@', SPLIT_PART(email, '@', 2))
    ELSE 'No email'
  END as masked_email,
  created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================================================
-- CHECK 2: Recent crew invitations
-- ============================================================================

SELECT 'CREW INVITATIONS CHECK' as section;

SELECT 
  cm.id,
  cm.crew_id,
  cm.user_id,
  cm.status,
  cm.created_at,
  up.display_name as invited_user,
  CASE 
    WHEN up.email IS NOT NULL THEN 'Has email'
    ELSE 'No email'
  END as email_status,
  c.name as crew_name
FROM crew_members cm
JOIN user_profiles up ON cm.user_id = up.user_id
JOIN crews c ON cm.crew_id = c.id
WHERE cm.created_at > NOW() - INTERVAL '3 hours'
ORDER BY cm.created_at DESC
LIMIT 5;

-- ============================================================================
-- CHECK 3: Email logs
-- ============================================================================

SELECT 'EMAIL LOGS CHECK' as section;

SELECT 
  COUNT(*) as total_email_logs,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '3 hours' THEN 1 END) as recent_logs,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_emails,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_emails
FROM email_logs;

-- Show recent email attempts
SELECT 
  recipient,
  subject,
  type,
  status,
  created_at,
  error_message
FROM email_logs 
WHERE created_at > NOW() - INTERVAL '3 hours'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- CHECK 4: Force email sync if needed
-- ============================================================================

SELECT 'EMAIL SYNC' as section;

-- Update any missing emails
UPDATE user_profiles 
SET email = au.email
FROM auth.users au 
WHERE user_profiles.user_id = au.id 
  AND (user_profiles.email IS NULL OR user_profiles.email = '')
  AND au.email IS NOT NULL;

-- Check sync results
SELECT 
  COUNT(*) as total_users_after_sync,
  COUNT(email) as users_with_email_after_sync
FROM user_profiles;

-- ============================================================================
-- DIAGNOSIS
-- ============================================================================

SELECT 'DIAGNOSIS' as section;

SELECT 
  CASE 
    WHEN (SELECT COUNT(email) FROM user_profiles WHERE email IS NOT NULL) = 0 
    THEN '❌ ISSUE: No emails in user_profiles table'
    WHEN (SELECT COUNT(*) FROM crew_members WHERE created_at > NOW() - INTERVAL '3 hours') = 0
    THEN '❌ ISSUE: No recent crew invitations found - try creating one'
    WHEN (SELECT COUNT(*) FROM email_logs WHERE created_at > NOW() - INTERVAL '3 hours') = 0
    THEN '❌ ISSUE: No email logs - frontend not calling email function'
    WHEN (SELECT COUNT(*) FROM email_logs WHERE created_at > NOW() - INTERVAL '3 hours' AND status = 'sent') = 0
    THEN '❌ ISSUE: Emails not being sent - check error messages'
    ELSE '✅ System looks functional - check specific details above'
  END as main_issue;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

SELECT 'NEXT STEPS' as section;
SELECT 'Based on the diagnosis above:' as instruction;
SELECT '1. If no emails: Run the email sync script again' as step_1;
SELECT '2. If no invitations: Create a test crew invitation' as step_2;
SELECT '3. If no logs: Check browser console for frontend errors' as step_3;
SELECT '4. If emails failing: Check error_message column above' as step_4;
