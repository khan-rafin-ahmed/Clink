-- Check email failure details
-- Run this in Supabase SQL Editor

-- ============================================================================
-- CHECK RECENT EMAIL FAILURES
-- ============================================================================

SELECT 'RECENT EMAIL FAILURES' as section;

-- Show recent failed emails with error details
SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  error_message,
  created_at,
  data
FROM email_logs 
WHERE created_at > NOW() - INTERVAL '6 hours'
  AND status = 'failed'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- CHECK ALL RECENT EMAIL ATTEMPTS
-- ============================================================================

SELECT 'ALL RECENT EMAIL ATTEMPTS' as section;

-- Show all recent email attempts (success and failure)
SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  CASE 
    WHEN error_message IS NOT NULL THEN LEFT(error_message, 100)
    ELSE 'No error'
  END as error_summary,
  created_at
FROM email_logs 
WHERE created_at > NOW() - INTERVAL '6 hours'
ORDER BY created_at DESC
LIMIT 15;

-- ============================================================================
-- CHECK EMAIL STATS
-- ============================================================================

SELECT 'EMAIL STATISTICS' as section;

-- Email success/failure stats
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM email_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status
ORDER BY count DESC;

-- ============================================================================
-- CHECK USER EMAIL AVAILABILITY
-- ============================================================================

SELECT 'USER EMAIL AVAILABILITY' as section;

-- Check if users have emails
SELECT 
  COUNT(*) as total_users,
  COUNT(email) as users_with_email,
  COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as users_with_valid_email
FROM user_profiles;

-- ============================================================================
-- CHECK RECENT CREW INVITATIONS
-- ============================================================================

SELECT 'RECENT CREW INVITATIONS' as section;

-- Check recent crew invitations and email status
SELECT 
  cm.id,
  cm.created_at,
  up.display_name as invited_user,
  up.email as user_email,
  c.name as crew_name,
  CASE 
    WHEN up.email IS NOT NULL THEN 'Has email'
    ELSE 'No email - this is the problem!'
  END as email_status
FROM crew_members cm
JOIN user_profiles up ON cm.user_id = up.user_id
JOIN crews c ON cm.crew_id = c.id
WHERE cm.created_at > NOW() - INTERVAL '6 hours'
ORDER BY cm.created_at DESC
LIMIT 5;

-- ============================================================================
-- FORCE EMAIL SYNC
-- ============================================================================

SELECT 'FORCING EMAIL SYNC' as section;

-- Force sync emails from auth.users to user_profiles
UPDATE user_profiles 
SET email = au.email
FROM auth.users au 
WHERE user_profiles.user_id = au.id 
  AND (user_profiles.email IS NULL OR user_profiles.email = '')
  AND au.email IS NOT NULL;

-- Check results after sync
SELECT 
  COUNT(*) as total_users,
  COUNT(email) as users_with_email_after_sync,
  ROUND(COUNT(email) * 100.0 / COUNT(*), 1) as email_percentage
FROM user_profiles;

-- ============================================================================
-- DIAGNOSIS
-- ============================================================================

SELECT 'FINAL DIAGNOSIS' as section;

SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM email_logs WHERE created_at > NOW() - INTERVAL '6 hours' AND status = 'failed') > 0
    THEN 'EMAILS ARE FAILING - Check error messages above'
    WHEN (SELECT COUNT(*) FROM email_logs WHERE created_at > NOW() - INTERVAL '6 hours') = 0
    THEN 'NO EMAIL ATTEMPTS - Frontend not calling email function'
    WHEN (SELECT COUNT(email) FROM user_profiles WHERE email IS NOT NULL) = 0
    THEN 'NO USER EMAILS - Email sync failed'
    ELSE 'System should be working - check details above'
  END as diagnosis;

-- Show the most recent error message
SELECT 'MOST RECENT ERROR' as section;
SELECT 
  error_message,
  recipient,
  created_at
FROM email_logs 
WHERE error_message IS NOT NULL
ORDER BY created_at DESC 
LIMIT 1;
