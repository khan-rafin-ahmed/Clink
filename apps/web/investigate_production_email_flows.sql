-- Investigation: Production Email Flow Analysis
-- Since database schema is fine, let's investigate the actual production flows

-- ============================================================================
-- CHECK 1: Recent crew invitations and their email lookup success
-- ============================================================================

SELECT 'RECENT CREW INVITATIONS ANALYSIS' as investigation_section;

-- Check recent crew member invitations and whether they have emails
SELECT 
  cm.id as invitation_id,
  cm.crew_id,
  cm.user_id as invited_user_id,
  cm.status as invitation_status,
  up.display_name as invited_user_name,
  up.email as profile_email,
  au.email as auth_email,
  CASE 
    WHEN up.email IS NOT NULL THEN '✅ Email available in profile'
    WHEN au.email IS NOT NULL THEN '⚠️ Email only in auth.users'
    ELSE '❌ No email found anywhere'
  END as email_availability,
  cm.created_at,
  cm.invited_by
FROM crew_members cm
JOIN user_profiles up ON cm.user_id = up.user_id
JOIN auth.users au ON cm.user_id = au.id
WHERE cm.created_at > NOW() - INTERVAL '48 hours'
ORDER BY cm.created_at DESC
LIMIT 10;

-- ============================================================================
-- CHECK 2: Recent event invitations and their email lookup success
-- ============================================================================

SELECT 'RECENT EVENT INVITATIONS ANALYSIS' as investigation_section;

-- Check recent event member invitations and whether they have emails
SELECT 
  em.id as invitation_id,
  em.event_id,
  em.user_id as invited_user_id,
  em.status as invitation_status,
  up.display_name as invited_user_name,
  up.email as profile_email,
  au.email as auth_email,
  CASE 
    WHEN up.email IS NOT NULL THEN '✅ Email available in profile'
    WHEN au.email IS NOT NULL THEN '⚠️ Email only in auth.users'
    ELSE '❌ No email found anywhere'
  END as email_availability,
  em.created_at,
  em.invited_by
FROM event_members em
JOIN user_profiles up ON em.user_id = up.user_id
JOIN auth.users au ON em.user_id = au.id
WHERE em.created_at > NOW() - INTERVAL '48 hours'
ORDER BY em.created_at DESC
LIMIT 10;

-- ============================================================================
-- CHECK 3: Test the secure email lookup function with real users
-- ============================================================================

SELECT 'SECURE EMAIL FUNCTION TEST WITH REAL USERS' as investigation_section;

-- Test the secure email lookup function with recent invitation recipients
DO $$
DECLARE
  test_user_record RECORD;
  email_result RECORD;
  test_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Testing secure email lookup function with recent invitation recipients:';
  
  -- Test with users from recent crew invitations
  FOR test_user_record IN 
    SELECT DISTINCT cm.user_id, up.display_name
    FROM crew_members cm
    JOIN user_profiles up ON cm.user_id = up.user_id
    WHERE cm.created_at > NOW() - INTERVAL '48 hours'
    LIMIT 3
  LOOP
    test_count := test_count + 1;
    
    -- Test the secure function
    SELECT * INTO email_result FROM get_user_email_for_invitation(test_user_record.user_id);
    
    IF email_result.email IS NOT NULL THEN
      RAISE NOTICE '✅ Test %: % (%)', test_count, email_result.display_name, email_result.email;
    ELSE
      RAISE NOTICE '❌ Test %: No email found for % (ID: %)', test_count, test_user_record.display_name, test_user_record.user_id;
    END IF;
  END LOOP;
  
  IF test_count = 0 THEN
    RAISE NOTICE 'No recent crew invitations found to test with';
  END IF;
END $$;

-- ============================================================================
-- CHECK 4: Look for failed email logs with specific error patterns
-- ============================================================================

SELECT 'FAILED EMAIL LOGS ANALYSIS' as investigation_section;

-- Check for failed emails and their error patterns
SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  error_message,
  data,
  created_at
FROM email_logs
WHERE status IN ('failed', 'pending')
  AND created_at > NOW() - INTERVAL '48 hours'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- CHECK 5: Check for users who might be causing email failures
-- ============================================================================

SELECT 'USERS WITH POTENTIAL EMAIL ISSUES' as investigation_section;

-- Find users who might be causing email lookup failures
SELECT 
  up.user_id,
  up.display_name,
  up.email as profile_email,
  au.email as auth_email,
  CASE 
    WHEN up.email IS NULL AND au.email IS NULL THEN 'No email anywhere'
    WHEN up.email IS NULL AND au.email IS NOT NULL THEN 'Missing in profile'
    WHEN up.email = '' THEN 'Empty email in profile'
    WHEN up.email IS NOT NULL AND au.email IS NULL THEN 'Profile has email but auth does not'
    ELSE 'Emails look fine'
  END as issue_type,
  up.created_at
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE 
  -- Users with no email in profile but email in auth
  (up.email IS NULL AND au.email IS NOT NULL)
  OR
  -- Users with empty email in profile
  (up.email = '')
  OR
  -- Users with no email anywhere
  (up.email IS NULL AND au.email IS NULL)
ORDER BY up.created_at DESC
LIMIT 10;

-- ============================================================================
-- CHECK 6: Simulate the exact frontend email lookup process
-- ============================================================================

SELECT 'FRONTEND EMAIL LOOKUP SIMULATION' as investigation_section;

-- Simulate the exact process the frontend uses for crew invitations
DO $$
DECLARE
  test_user_record RECORD;
  direct_lookup_result RECORD;
  fallback_lookup_result RECORD;
BEGIN
  RAISE NOTICE 'Simulating frontend email lookup process:';
  
  -- Get a recent crew invitation to test with
  SELECT cm.user_id, up.display_name INTO test_user_record
  FROM crew_members cm
  JOIN user_profiles up ON cm.user_id = up.user_id
  WHERE cm.created_at > NOW() - INTERVAL '48 hours'
  LIMIT 1;
  
  IF test_user_record.user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing with user: % (ID: %)', test_user_record.display_name, test_user_record.user_id;
    
    -- Step 1: Try direct lookup from user_profiles (what frontend does first)
    SELECT display_name, email INTO direct_lookup_result
    FROM user_profiles 
    WHERE user_id = test_user_record.user_id;
    
    IF direct_lookup_result.email IS NOT NULL THEN
      RAISE NOTICE '✅ Direct lookup SUCCESS: Found email in user_profiles';
    ELSE
      RAISE NOTICE '⚠️ Direct lookup FAILED: No email in user_profiles, trying fallback...';
      
      -- Step 2: Try fallback lookup (what enhanced frontend does)
      SELECT display_name, email INTO fallback_lookup_result
      FROM get_user_email_for_invitation(test_user_record.user_id);
      
      IF fallback_lookup_result.email IS NOT NULL THEN
        RAISE NOTICE '✅ Fallback lookup SUCCESS: Found email via secure function';
      ELSE
        RAISE NOTICE '❌ Fallback lookup FAILED: No email found anywhere';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'No recent crew invitations found to test with';
  END IF;
END $$;

-- ============================================================================
-- SUMMARY AND NEXT STEPS
-- ============================================================================

SELECT 'INVESTIGATION SUMMARY' as investigation_section;

DO $$
DECLARE
  recent_crew_invites INTEGER;
  recent_event_invites INTEGER;
  failed_emails INTEGER;
  users_missing_emails INTEGER;
BEGIN
  -- Count recent invitations
  SELECT COUNT(*) INTO recent_crew_invites 
  FROM crew_members WHERE created_at > NOW() - INTERVAL '48 hours';
  
  SELECT COUNT(*) INTO recent_event_invites 
  FROM event_members WHERE created_at > NOW() - INTERVAL '48 hours';
  
  -- Count failed emails
  SELECT COUNT(*) INTO failed_emails 
  FROM email_logs 
  WHERE status = 'failed' AND created_at > NOW() - INTERVAL '48 hours';
  
  -- Count users with email issues
  SELECT COUNT(*) INTO users_missing_emails
  FROM user_profiles up
  LEFT JOIN auth.users au ON up.user_id = au.id
  WHERE (up.email IS NULL OR up.email = '') AND au.email IS NOT NULL;
  
  RAISE NOTICE '📊 PRODUCTION EMAIL FLOW ANALYSIS:';
  RAISE NOTICE '- Recent crew invitations: %', recent_crew_invites;
  RAISE NOTICE '- Recent event invitations: %', recent_event_invites;
  RAISE NOTICE '- Failed emails in last 48h: %', failed_emails;
  RAISE NOTICE '- Users with email sync issues: %', users_missing_emails;
  
  IF failed_emails = 0 AND users_missing_emails = 0 THEN
    RAISE NOTICE '🤔 INTERESTING: No obvious email failures detected';
    RAISE NOTICE '💡 The issue might be in specific edge cases or frontend logic';
    RAISE NOTICE '🔍 Recommendation: Test actual crew/event creation flows manually';
  ELSE
    RAISE NOTICE '🚨 ISSUES FOUND: % failed emails, % users with email problems', failed_emails, users_missing_emails;
  END IF;
END $$;
