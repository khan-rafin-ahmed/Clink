-- Configure email system for production
-- Run this in Supabase SQL Editor to set up database settings

-- ============================================================================
-- CONFIGURE SUPABASE SETTINGS
-- ============================================================================

-- Set Supabase URL (replace with your actual URL)
ALTER DATABASE postgres SET app.supabase_url = 'https://arpphimkotjvnfoacquj.supabase.co';

-- Set service role key (you need to get this from your Supabase dashboard)
-- Go to: Settings > API > service_role key (secret)
-- IMPORTANT: Replace 'YOUR_SERVICE_ROLE_KEY_HERE' with your actual service role key
ALTER DATABASE postgres SET app.service_role_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycHBoaW1rb3Rqdm5mb2FjcXVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIwNjA2NiwiZXhwIjoyMDYzNzgyMDY2fQ.OjmEGb1RtWWksqz4UN3d1HHNznURRxDGk2IdeEKKP3E';

-- ============================================================================
-- VERIFY SETTINGS
-- ============================================================================

-- Check if settings are now configured
SELECT 'CONFIGURED SETTINGS' as section;

SELECT 
  name,
  setting,
  CASE 
    WHEN name = 'app.supabase_url' AND setting IS NOT NULL THEN '✅ Configured'
    WHEN name = 'app.service_role_key' AND setting IS NOT NULL THEN '✅ Configured'
    WHEN setting IS NULL THEN '❌ Not configured'
    ELSE '⚠️ Check value'
  END as status
FROM pg_settings 
WHERE name IN ('app.supabase_url', 'app.service_role_key');

-- ============================================================================
-- CREATE MISSING EMAIL FUNCTIONS (IF NEEDED)
-- ============================================================================

-- Function to send event invitation emails
CREATE OR REPLACE FUNCTION send_event_invitation_emails(
  p_event_id UUID,
  p_inviter_id UUID
)
RETURNS TABLE (
  emails_sent INTEGER,
  emails_failed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_record RECORD;
  invitation_record RECORD;
  inviter_record RECORD;
  user_email TEXT;
  emails_sent_count INTEGER := 0;
  emails_failed_count INTEGER := 0;
  email_data JSONB;
BEGIN
  -- Get event details
  SELECT e.*, up.display_name as host_name
  INTO event_record
  FROM events e
  JOIN user_profiles up ON e.created_by = up.user_id
  WHERE e.id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Get inviter details
  SELECT up.display_name, au.email
  INTO inviter_record
  FROM user_profiles up
  JOIN auth.users au ON up.user_id = au.id
  WHERE up.user_id = p_inviter_id;

  -- Loop through pending invitations
  FOR invitation_record IN
    SELECT ei.*, au.email as user_email
    FROM event_invitations ei
    JOIN auth.users au ON ei.user_id = au.id
    WHERE ei.event_id = p_event_id 
      AND ei.status = 'pending'
      AND au.email IS NOT NULL
  LOOP
    BEGIN
      -- Prepare email data
      email_data := jsonb_build_object(
        'event_title', event_record.title,
        'inviter_name', inviter_record.display_name,
        'event_date_time', event_record.date_time,
        'event_location', event_record.location,
        'event_id', event_record.id,
        'invitation_id', invitation_record.id
      );

      -- Call the send-email edge function
      PERFORM
        net.http_post(
          url := format('%s/functions/v1/send-email', current_setting('app.supabase_url', true)),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', format('Bearer %s', current_setting('app.service_role_key', true))
          ),
          body := jsonb_build_object(
            'to', invitation_record.user_email,
            'subject', format('🍻 You''re invited to %s', event_record.title),
            'type', 'event_invitation',
            'data', email_data
          )
        );

      emails_sent_count := emails_sent_count + 1;
      
    EXCEPTION
      WHEN OTHERS THEN
        emails_failed_count := emails_failed_count + 1;
        RAISE NOTICE 'Failed to send email to %: %', invitation_record.user_email, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT emails_sent_count, emails_failed_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_event_invitation_emails(UUID, UUID) TO authenticated;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '🎉 Email system configuration complete!' as status;
SELECT 'Next steps:' as instruction;
SELECT '1. Replace YOUR_SERVICE_ROLE_KEY_HERE with your actual service role key' as step_1;
SELECT '2. Test email sending from your app' as step_2;
SELECT '3. Check email_logs table for activity' as step_3;
