-- Simple Email Investigation - Get actual data
-- This script will show us what's really happening

-- ============================================================================
-- CHECK 1: Show ALL recent crew invitations (last 7 days)
-- ============================================================================

SELECT 'ALL RECENT CREW INVITATIONS (Last 7 days)' as section_name;

SELECT 
  cm.id,
  cm.crew_id,
  cm.user_id,
  cm.status,
  up.display_name,
  up.email,
  cm.created_at
FROM crew_members cm
LEFT JOIN user_profiles up ON cm.user_id = up.user_id
WHERE cm.created_at > NOW() - INTERVAL '7 days'
ORDER BY cm.created_at DESC;

-- ============================================================================
-- CHECK 2: Show ALL recent event invitations (last 7 days)
-- ============================================================================

SELECT 'ALL RECENT EVENT INVITATIONS (Last 7 days)' as section_name;

SELECT 
  em.id,
  em.event_id,
  em.user_id,
  em.status,
  up.display_name,
  up.email,
  em.created_at
FROM event_members em
LEFT JOIN user_profiles up ON em.user_id = up.user_id
WHERE em.created_at > NOW() - INTERVAL '7 days'
ORDER BY em.created_at DESC;

-- ============================================================================
-- CHECK 3: Show ALL email logs (last 7 days)
-- ============================================================================

SELECT 'ALL EMAIL LOGS (Last 7 days)' as section_name;

SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  error_message,
  created_at
FROM email_logs
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- ============================================================================
-- CHECK 4: Count everything
-- ============================================================================

SELECT 'COUNTS SUMMARY' as section_name;

SELECT 
  'crew_members (last 7 days)' as table_name,
  COUNT(*) as count
FROM crew_members 
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'event_members (last 7 days)' as table_name,
  COUNT(*) as count
FROM event_members 
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'email_logs (last 7 days)' as table_name,
  COUNT(*) as count
FROM email_logs 
WHERE created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'user_profiles with emails' as table_name,
  COUNT(*) as count
FROM user_profiles 
WHERE email IS NOT NULL

UNION ALL

SELECT 
  'user_profiles total' as table_name,
  COUNT(*) as count
FROM user_profiles;

-- ============================================================================
-- CHECK 5: Test if secure function exists
-- ============================================================================

SELECT 'FUNCTION EXISTENCE CHECK' as section_name;

SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'get_user_email_for_invitation';

-- ============================================================================
-- CHECK 6: Show sample user data
-- ============================================================================

SELECT 'SAMPLE USER DATA' as section_name;

SELECT 
  up.user_id,
  up.display_name,
  up.email as profile_email,
  au.email as auth_email,
  up.created_at
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
ORDER BY up.created_at DESC
LIMIT 5;

-- ============================================================================
-- CHECK 7: Look for any failed or pending emails
-- ============================================================================

SELECT 'FAILED OR PENDING EMAILS' as section_name;

SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  error_message,
  created_at
FROM email_logs
WHERE status IN ('failed', 'pending')
ORDER BY created_at DESC
LIMIT 10;
