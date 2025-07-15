-- Check and configure email system database functions
-- Run this in Supabase SQL Editor

-- ============================================================================
-- CHECK CURRENT SETTINGS
-- ============================================================================

SELECT 'CURRENT DATABASE SETTINGS' as section;

-- Check if Supabase settings are configured
SELECT 
  name,
  setting,
  CASE
    WHEN name = 'app.supabase_url' THEN 'https://arpphimkotjvnfoacquj.supabase.co'
    WHEN name = 'app.service_role_key' THEN 'REDACTED_FOR_SECURITY'
    ELSE 'Other setting'
  END as description
FROM pg_settings 
WHERE name IN ('app.supabase_url', 'app.service_role_key');

-- ============================================================================
-- CHECK EMAIL FUNCTIONS
-- ============================================================================

SELECT 'EMAIL FUNCTIONS STATUS' as section;

-- Check if email functions exist
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'send_event_invitation_emails',
    'send_crew_invitation_email',
    'get_user_email_preferences'
  )
ORDER BY routine_name;

-- ============================================================================
-- CHECK EMAIL TABLES
-- ============================================================================

SELECT 'EMAIL TABLES STATUS' as section;

-- Check if email tables exist
SELECT table_name, 
       CASE WHEN table_name = 'email_logs' THEN 'Stores email send history'
            WHEN table_name = 'email_preferences' THEN 'User email preferences'
            ELSE 'Other table'
       END as description
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('email_logs', 'email_preferences');

-- Check email_logs structure
SELECT 'EMAIL_LOGS COLUMNS' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'email_logs'
ORDER BY ordinal_position;

-- ============================================================================
-- CONFIGURE SUPABASE SETTINGS (UNCOMMENT TO RUN)
-- ============================================================================

-- IMPORTANT: Replace these with your actual values before running!
-- Uncomment the lines below and replace with your actual values:

-- ALTER DATABASE postgres SET app.supabase_url = 'https://arpphimkotjvnfoacquj.supabase.co';
-- ALTER DATABASE postgres SET app.service_role_key = 'YOUR_SERVICE_ROLE_KEY_HERE';

-- ============================================================================
-- TEST EMAIL FUNCTION
-- ============================================================================

SELECT 'TESTING EMAIL FUNCTIONS' as section;

-- Test if we can call the email functions (this will show if they exist)
-- Note: This won't actually send emails, just test if the functions are callable

SELECT 'send_event_invitation_emails function test' as test_name,
       CASE 
         WHEN EXISTS (
           SELECT 1 FROM information_schema.routines 
           WHERE routine_name = 'send_event_invitation_emails'
         ) THEN 'Function exists ✅'
         ELSE 'Function missing ❌'
       END as status;

SELECT 'send_crew_invitation_email function test' as test_name,
       CASE 
         WHEN EXISTS (
           SELECT 1 FROM information_schema.routines 
           WHERE routine_name = 'send_crew_invitation_email'
         ) THEN 'Function exists ✅'
         ELSE 'Function missing ❌'
       END as status;

-- ============================================================================
-- RECENT EMAIL LOGS
-- ============================================================================

SELECT 'RECENT EMAIL ACTIVITY' as section;

-- Show recent email logs (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs') THEN
    RAISE NOTICE 'Email logs table exists. Checking recent activity...';
  ELSE
    RAISE NOTICE 'Email logs table does not exist.';
  END IF;
END $$;

-- Show recent email logs if table exists
SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  created_at,
  error_message
FROM email_logs 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC 
LIMIT 10;
