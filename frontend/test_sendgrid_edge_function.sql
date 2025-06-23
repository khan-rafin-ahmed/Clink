-- Test SendGrid Edge Function Configuration
-- This will help us identify why emails stay in 'pending' status

-- ============================================================================
-- CHECK 1: Show all pending emails that need to be sent
-- ============================================================================

SELECT 'PENDING EMAILS THAT NEED ATTENTION' as section_name;

SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  created_at,
  -- Calculate how long they've been pending
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_pending
FROM email_logs
WHERE status = 'pending'
ORDER BY created_at DESC;

-- ============================================================================
-- CHECK 2: Compare successful vs pending emails
-- ============================================================================

SELECT 'EMAIL STATUS COMPARISON' as section_name;

SELECT 
  status,
  COUNT(*) as count,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM email_logs
GROUP BY status
ORDER BY count DESC;

-- ============================================================================
-- CHECK 3: Show the data structure of pending emails
-- ============================================================================

SELECT 'PENDING EMAIL DATA STRUCTURE' as section_name;

SELECT 
  id,
  recipient,
  subject,
  type,
  data,
  created_at
FROM email_logs
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 3;

-- ============================================================================
-- CHECK 4: Manual test of Edge Function (if possible)
-- ============================================================================

-- Note: This would normally be done via HTTP request, but we can prepare the data

SELECT 'EDGE FUNCTION TEST DATA' as section_name;

-- Show what data should be sent to the Edge Function
SELECT 
  'Test data for Edge Function:' as note,
  jsonb_build_object(
    'to', 'test@example.com',
    'subject', 'Manual Test Email',
    'type', 'event_invitation',
    'html', '<h1>Test</h1><p>This is a manual test.</p>',
    'text', 'Test - This is a manual test.'
  ) as edge_function_payload;
