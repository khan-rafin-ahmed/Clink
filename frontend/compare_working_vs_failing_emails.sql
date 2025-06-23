-- Compare Working vs Failing Emails
-- This will help us understand why some emails work and others don't

-- ============================================================================
-- CHECK 1: Compare successful vs pending emails side by side
-- ============================================================================

SELECT 'SUCCESSFUL EMAILS (sent status)' as email_type;

SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  message_id,
  data,
  error_message,
  sent_at,
  created_at
FROM email_logs
WHERE status = 'sent'
ORDER BY created_at DESC
LIMIT 5;

SELECT 'PENDING EMAILS (stuck in pending)' as email_type;

SELECT 
  id,
  recipient,
  subject,
  type,
  status,
  message_id,
  data,
  error_message,
  sent_at,
  created_at
FROM email_logs
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- CHECK 2: Look for patterns in the data field
-- ============================================================================

SELECT 'DATA FIELD COMPARISON' as analysis_type;

-- Successful emails data structure
SELECT 
  'SUCCESSFUL' as email_type,
  type,
  data,
  created_at
FROM email_logs
WHERE status = 'sent' AND data IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- Pending emails data structure
SELECT 
  'PENDING' as email_type,
  type,
  data,
  created_at
FROM email_logs
WHERE status = 'pending' AND data IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- ============================================================================
-- CHECK 3: Check if pending emails have different recipients
-- ============================================================================

SELECT 'RECIPIENT ANALYSIS' as analysis_type;

SELECT 
  recipient,
  COUNT(*) as total_emails,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
FROM email_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY recipient
ORDER BY total_emails DESC;

-- ============================================================================
-- CHECK 4: Check timing patterns
-- ============================================================================

SELECT 'TIMING ANALYSIS' as analysis_type;

SELECT 
  DATE_TRUNC('hour', created_at) as hour_bucket,
  COUNT(*) as total_emails,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM email_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour_bucket DESC;

-- ============================================================================
-- CHECK 5: Look for specific patterns in pending emails
-- ============================================================================

SELECT 'PENDING EMAIL PATTERNS' as analysis_type;

-- Check if pending emails are missing certain fields
SELECT 
  id,
  recipient,
  subject,
  type,
  CASE WHEN data IS NULL THEN 'No data' ELSE 'Has data' END as data_status,
  CASE WHEN message_id IS NULL THEN 'No message_id' ELSE 'Has message_id' END as message_id_status,
  created_at
FROM email_logs
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- CHECK 6: Try to identify the source of pending emails
-- ============================================================================

SELECT 'PENDING EMAIL SOURCES' as analysis_type;

-- Look at the subjects to identify what type of invitations are failing
SELECT 
  CASE 
    WHEN subject LIKE '%invited to join%' THEN 'Crew Invitation'
    WHEN subject LIKE '%You''re invited:%' THEN 'Event Invitation'
    WHEN subject LIKE '%Test%' OR subject LIKE '%Debug%' THEN 'Test Email'
    ELSE 'Other'
  END as email_category,
  COUNT(*) as count,
  MIN(created_at) as earliest,
  MAX(created_at) as latest
FROM email_logs
WHERE status = 'pending'
GROUP BY 
  CASE 
    WHEN subject LIKE '%invited to join%' THEN 'Crew Invitation'
    WHEN subject LIKE '%You''re invited:%' THEN 'Event Invitation'
    WHEN subject LIKE '%Test%' OR subject LIKE '%Debug%' THEN 'Test Email'
    ELSE 'Other'
  END
ORDER BY count DESC;
