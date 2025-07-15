-- Test email functions to see what's happening
-- Run this in Supabase SQL Editor to debug

-- ============================================================================
-- TEST 1: Check if functions exist
-- ============================================================================

SELECT 'FUNCTION EXISTENCE TEST' as test_section;

SELECT 
  routine_name,
  routine_type,
  CASE WHEN routine_name IN ('get_user_email', 'get_pending_invitations_with_emails') 
       THEN '✅ Function exists' 
       ELSE '❌ Function missing' 
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_user_email', 'get_pending_invitations_with_emails')
ORDER BY routine_name;

-- ============================================================================
-- TEST 2: Check recent crew invitations
-- ============================================================================

SELECT 'RECENT CREW INVITATIONS TEST' as test_section;

-- Check recent crew member invitations
SELECT 
  cm.id,
  cm.crew_id,
  cm.user_id,
  cm.status,
  cm.created_at,
  up.display_name as invited_user,
  c.name as crew_name
FROM crew_members cm
JOIN user_profiles up ON cm.user_id = up.user_id
JOIN crews c ON cm.crew_id = c.id
WHERE cm.created_at > NOW() - INTERVAL '1 hour'
ORDER BY cm.created_at DESC
LIMIT 5;

-- ============================================================================
-- TEST 3: Test get_user_email function
-- ============================================================================

SELECT 'GET_USER_EMAIL FUNCTION TEST' as test_section;

-- Test with a real user ID from recent crew invitations
DO $$
DECLARE
  test_user_id UUID;
  email_result RECORD;
BEGIN
  -- Get a user ID from recent crew invitations
  SELECT cm.user_id INTO test_user_id 
  FROM crew_members cm 
  WHERE cm.created_at > NOW() - INTERVAL '1 hour'
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    RAISE NOTICE 'Testing get_user_email with user ID: %', test_user_id;
    
    -- Test the function
    SELECT * INTO email_result FROM get_user_email(test_user_id);
    
    IF email_result.email IS NOT NULL THEN
      RAISE NOTICE 'SUCCESS: Found email % for user %', email_result.email, email_result.display_name;
    ELSE
      RAISE NOTICE 'WARNING: No email found for user %', test_user_id;
    END IF;
  ELSE
    RAISE NOTICE 'No recent crew invitations found to test with';
  END IF;
END $$;

-- ============================================================================
-- TEST 4: Check email logs for crew invitations
-- ============================================================================

SELECT 'EMAIL LOGS TEST' as test_section;

-- Check recent email logs
SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  created_at,
  error_message
FROM email_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND type = 'crew_invitation'
ORDER BY created_at DESC;

-- ============================================================================
-- TEST 5: Manual email function test
-- ============================================================================

SELECT 'MANUAL EMAIL TEST' as test_section;

-- Get a test user email
DO $$
DECLARE
  test_user_id UUID;
  test_email TEXT;
  test_name TEXT;
BEGIN
  -- Get a user with email
  SELECT user_id INTO test_user_id FROM user_profiles LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    SELECT email, display_name INTO test_email, test_name 
    FROM get_user_email(test_user_id);
    
    IF test_email IS NOT NULL THEN
      RAISE NOTICE 'Test user found: % (%)', test_name, test_email;
      RAISE NOTICE 'You can manually test crew invitation email by calling:';
      RAISE NOTICE 'Frontend should call: sendCrewInvitationEmailToUser(crew_id, %, inviter_id)', test_user_id;
    ELSE
      RAISE NOTICE 'No email found for test user';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 'DEBUG SUMMARY' as section;
SELECT 'Check the NOTICE messages above for detailed test results' as instruction;
SELECT 'If functions exist but no emails in logs, the frontend is not calling them' as diagnosis_1;
SELECT 'If functions missing, re-run the enable_email_notifications.sql script' as diagnosis_2;
