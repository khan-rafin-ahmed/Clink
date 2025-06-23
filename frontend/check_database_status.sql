-- CHECK DATABASE STATUS
-- Run this first to see what's already in your database

-- ============================================================================
-- CHECK TABLES
-- ============================================================================

SELECT 'TABLES STATUS' as section;

SELECT 
  table_name,
  CASE WHEN table_name IN (
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES 
  ('email_logs'),
  ('email_preferences'),
  ('events'),
  ('user_profiles')
) as t(table_name);

-- ============================================================================
-- CHECK EMAIL TABLE COLUMNS
-- ============================================================================

SELECT 'EMAIL TABLES COLUMNS' as section;

-- Check email_logs columns
SELECT 
  'email_logs' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check email_preferences columns  
SELECT 
  'email_preferences' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_preferences' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- CHECK EVENTS TABLE DURATION COLUMNS
-- ============================================================================

SELECT 'EVENTS TABLE DURATION COLUMNS' as section;

SELECT 
  column_name,
  CASE WHEN column_name IN (
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'events' AND table_schema = 'public'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM (VALUES 
  ('duration_type'),
  ('end_time'),
  ('duration_hours')
) as t(column_name);

-- ============================================================================
-- CHECK FUNCTIONS
-- ============================================================================

SELECT 'FUNCTIONS STATUS' as section;

SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'calculate_event_end_time',
    'get_event_status',
    'get_user_email_preferences',
    'send_event_invitation_emails'
  )
ORDER BY routine_name;

-- ============================================================================
-- CHECK FUNCTION PARAMETERS
-- ============================================================================

SELECT 'FUNCTION PARAMETERS' as section;

SELECT 
  r.routine_name,
  p.parameter_name,
  p.data_type,
  p.ordinal_position
FROM information_schema.routines r
JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_schema = 'public' 
  AND r.routine_name = 'calculate_event_end_time'
ORDER BY p.ordinal_position;

-- ============================================================================
-- CHECK POLICIES
-- ============================================================================

SELECT 'POLICIES STATUS' as section;

SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('email_logs', 'email_preferences')
ORDER BY tablename, policyname;

-- ============================================================================
-- CHECK RLS STATUS
-- ============================================================================

SELECT 'ROW LEVEL SECURITY STATUS' as section;

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('email_logs', 'email_preferences', 'events', 'user_profiles')
ORDER BY tablename;

-- ============================================================================
-- CHECK INDEXES
-- ============================================================================

SELECT 'INDEXES STATUS' as section;

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('email_logs', 'email_preferences')
ORDER BY tablename, indexname;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 'SUMMARY' as section;

SELECT 
  'Email system setup status' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_preferences')
      AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_user_email_preferences')
    THEN '✅ READY - Tables and basic functions exist'
    ELSE '⚠️  NEEDS SETUP - Missing components'
  END as status;
