-- Diagnose email system issues
-- Run this in Supabase SQL Editor to identify problems

-- ============================================================================
-- CHECK HTTP EXTENSION
-- ============================================================================

SELECT 'HTTP EXTENSION STATUS' as section;

-- Check if pg_net extension is available
SELECT 
  extname,
  extversion,
  CASE WHEN extname = 'pg_net' THEN '✅ Available for HTTP calls'
       ELSE '❌ Extension issue'
  END as status
FROM pg_extension 
WHERE extname IN ('pg_net', 'http');

-- Check if net schema exists
SELECT 
  schema_name,
  CASE WHEN schema_name = 'net' THEN '✅ Net schema available'
       ELSE '❌ Net schema missing'
  END as status
FROM information_schema.schemata 
WHERE schema_name = 'net';

-- Check if http_post function exists
SELECT 
  routine_name,
  routine_schema,
  CASE WHEN routine_name = 'http_post' THEN '✅ HTTP POST function available'
       ELSE '❌ HTTP POST function missing'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'net' AND routine_name = 'http_post';

-- ============================================================================
-- TEST SERVICE ROLE KEY
-- ============================================================================

SELECT 'SERVICE ROLE KEY TEST' as section;

-- Test if we can make a simple HTTP call to verify the key works
-- This will test the Edge Function without sending actual emails

DO $$
DECLARE
  response_status INTEGER;
  response_body TEXT;
  supabase_url TEXT := 'https://arpphimkotjvnfoacquj.supabase.co';
  -- SECURITY: Service key should be stored as environment variable
  service_role_key TEXT := 'REPLACE_WITH_ENVIRONMENT_VARIABLE';
BEGIN
  -- Test HTTP call to Edge Function
  SELECT status, content INTO response_status, response_body
  FROM net.http_post(
    url := format('%s/functions/v1/send-email', supabase_url),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', format('Bearer %s', service_role_key)
    ),
    body := jsonb_build_object(
      'to', 'test@example.com',
      'subject', 'Database Function Test',
      'type', 'event_invitation',
      'html', '<h1>Test</h1>',
      'text', 'Test'
    )
  );
  
  RAISE NOTICE 'HTTP Response Status: %', response_status;
  RAISE NOTICE 'HTTP Response Body: %', response_body;
  
  IF response_status = 200 THEN
    RAISE NOTICE '✅ Edge Function call successful!';
  ELSE
    RAISE NOTICE '❌ Edge Function call failed with status: %', response_status;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ HTTP call failed: %', SQLERRM;
END $$;

-- ============================================================================
-- CHECK RECENT EMAIL LOGS
-- ============================================================================

SELECT 'RECENT EMAIL ACTIVITY' as section;

-- Show recent email attempts
SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  created_at,
  error_message,
  CASE 
    WHEN status = 'sent' THEN '✅ Success'
    WHEN status = 'pending' THEN '⏳ Pending (likely database function issue)'
    WHEN status = 'failed' THEN '❌ Failed'
    ELSE '❓ Unknown'
  END as status_description
FROM email_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================================================
-- SIMPLIFIED EMAIL FUNCTION (FOR TESTING)
-- ============================================================================

-- Create a simple test function that doesn't use HTTP calls
CREATE OR REPLACE FUNCTION test_email_function()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Just return a test message
  RETURN 'Email function is working - database functions are callable';
END;
$$;

-- Test the simple function
SELECT test_email_function() as test_result;

-- ============================================================================
-- ALTERNATIVE APPROACH: DIRECT EDGE FUNCTION CALLS
-- ============================================================================

SELECT 'ALTERNATIVE SOLUTION' as section;

SELECT 'Consider using frontend-only email sending instead of database functions' as suggestion;
SELECT 'Frontend can call Edge Function directly when inviting users' as option_1;
SELECT 'This avoids database HTTP call complexity' as option_2;
SELECT 'Database functions can focus on data operations only' as option_3;

-- ============================================================================
-- SUMMARY
-- ============================================================================

SELECT 'DIAGNOSIS COMPLETE' as section;
SELECT 'Check the NOTICE messages above for detailed results' as instruction;
SELECT 'If HTTP extension is missing, we need an alternative approach' as note;
