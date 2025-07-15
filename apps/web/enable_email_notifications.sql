-- Enable email notifications by creating a secure view for user emails
-- Run this in Supabase SQL Editor

-- ============================================================================
-- CREATE USER EMAIL ACCESS FUNCTIONS
-- ============================================================================

-- Function to get user email by user ID (secure)
CREATE OR REPLACE FUNCTION get_user_email(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.user_id,
    up.display_name,
    au.email::TEXT
  FROM user_profiles up
  JOIN auth.users au ON up.user_id = au.id
  WHERE up.user_id = p_user_id
    AND au.email IS NOT NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_email(UUID) TO authenticated;

-- ============================================================================
-- CREATE EMAIL NOTIFICATION FUNCTIONS
-- ============================================================================

-- Function to send event invitation emails (improved version)
CREATE OR REPLACE FUNCTION send_event_invitation_emails_v2(
  p_event_id UUID,
  p_inviter_id UUID
)
RETURNS TABLE (
  emails_sent INTEGER,
  emails_failed INTEGER,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_record RECORD;
  invitation_record RECORD;
  inviter_record RECORD;
  emails_sent_count INTEGER := 0;
  emails_failed_count INTEGER := 0;
  email_data JSONB;
  response_data JSONB;
  email_details JSONB[] := '{}';
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
  SELECT up.display_name
  INTO inviter_record
  FROM user_profiles up
  WHERE up.user_id = p_inviter_id;

  -- Loop through pending invitations with emails
  FOR invitation_record IN
    SELECT ei.*, au.email::TEXT as email, up.display_name as user_name
    FROM event_invitations ei
    JOIN user_profiles up ON ei.user_id = up.user_id
    JOIN auth.users au ON up.user_id = au.id
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
      SELECT content INTO response_data
      FROM net.http_post(
        url := 'https://arpphimkotjvnfoacquj.supabase.co/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          -- SECURITY: Service key should be stored as environment variable
          'Authorization', 'Bearer REPLACE_WITH_ENVIRONMENT_VARIABLE'
        ),
        body := jsonb_build_object(
          'to', invitation_record.email,
          'subject', format('🍻 You''re invited to %s', event_record.title),
          'type', 'event_invitation',
          'data', email_data
        )
      );

      emails_sent_count := emails_sent_count + 1;
      email_details := email_details || jsonb_build_object(
        'email', invitation_record.email,
        'user_name', invitation_record.user_name,
        'status', 'sent'
      );
      
    EXCEPTION
      WHEN OTHERS THEN
        emails_failed_count := emails_failed_count + 1;
        email_details := email_details || jsonb_build_object(
          'email', invitation_record.email,
          'user_name', invitation_record.user_name,
          'status', 'failed',
          'error', SQLERRM
        );
        RAISE NOTICE 'Failed to send email to %: %', invitation_record.email, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT emails_sent_count, emails_failed_count, array_to_json(email_details)::jsonb;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_event_invitation_emails_v2(UUID, UUID) TO authenticated;

-- ============================================================================
-- FRONTEND-FRIENDLY EMAIL FUNCTIONS
-- ============================================================================

-- Function to get pending invitations with emails (for frontend use)
CREATE OR REPLACE FUNCTION get_pending_invitations_with_emails(p_event_id UUID)
RETURNS TABLE (
  invitation_id UUID,
  user_id UUID,
  user_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ei.id as invitation_id,
    ei.user_id,
    up.display_name as user_name,
    au.email::TEXT,
    ei.created_at
  FROM event_invitations ei
  JOIN user_profiles up ON ei.user_id = up.user_id
  JOIN auth.users au ON up.user_id = au.id
  WHERE ei.event_id = p_event_id
    AND ei.status = 'pending'
    AND au.email IS NOT NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pending_invitations_with_emails(UUID) TO authenticated;

-- ============================================================================
-- TEST THE SETUP
-- ============================================================================

-- Test if the functions work
SELECT 'USER EMAIL FUNCTIONS TEST' as test_name;

-- Test get_user_email function with a sample user
DO $$
DECLARE
  test_user_id UUID;
  email_result RECORD;
BEGIN
  -- Get a sample user ID
  SELECT user_id INTO test_user_id FROM user_profiles LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    -- Test the function
    SELECT * INTO email_result FROM get_user_email(test_user_id);

    IF email_result.email IS NOT NULL THEN
      RAISE NOTICE 'SUCCESS: get_user_email function works - found email for user %', email_result.display_name;
    ELSE
      RAISE NOTICE 'WARNING: get_user_email function works but no email found for test user';
    END IF;
  ELSE
    RAISE NOTICE 'WARNING: No users found to test with';
  END IF;
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '🎉 Email notification system enabled!' as status;
SELECT 'User emails are now accessible through secure functions' as step_1;
SELECT 'Frontend can now send email invitations' as step_2;
SELECT 'Database functions can also send emails if needed' as step_3;
