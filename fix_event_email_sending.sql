-- Fix Event Email Sending Function
-- This makes the function actually send emails via the Edge function

-- Drop the current function that only logs but doesn't send
DROP FUNCTION IF EXISTS send_event_invitation_emails(uuid, uuid);

-- Create a new function that actually sends emails
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
  inviter_record RECORD;
  invitation_record RECORD;
  email_data JSONB;
  emails_sent_count INTEGER := 0;
  emails_failed_count INTEGER := 0;
  response_data JSONB;
BEGIN
  -- Get event details
  SELECT * INTO event_record
  FROM events
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Get inviter details
  SELECT display_name INTO inviter_record
  FROM user_profiles
  WHERE user_id = p_inviter_id;

  -- Loop through pending invitations in event_members table
  FOR invitation_record IN
    SELECT em.*, up.email as user_email, up.display_name as user_name
    FROM event_members em
    JOIN user_profiles up ON em.user_id = up.user_id
    WHERE em.event_id = p_event_id 
      AND em.status = 'pending'
      AND em.invited_by = p_inviter_id
      AND up.email IS NOT NULL
  LOOP
    BEGIN
      -- Prepare email data
      email_data := jsonb_build_object(
        'eventTitle', event_record.title,
        'inviterName', inviter_record.display_name,
        'eventDate', event_record.date_time,
        'eventLocation', event_record.location,
        'eventId', event_record.id,
        'invitationId', invitation_record.id
      );

      -- Call the send-email edge function
      SELECT content INTO response_data
      FROM net.http_post(
        url := 'https://arpphimkotjvnfoacquj.supabase.co/functions/v1/send-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFycHBoaW1rb3Rqdm5mb2FjcXVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODIwNjA2NiwiZXhwIjoyMDYzNzgyMDY2fQ.OjmEGb1RtWWksqz4UN3d1HHNznURRxDGk2IdeEKKP3E'
        ),
        body := jsonb_build_object(
          'to', invitation_record.user_email,
          'subject', format('🍻 You''re invited to %s', event_record.title),
          'type', 'event_invitation',
          'data', email_data
        )
      );

      emails_sent_count := emails_sent_count + 1;
      
      RAISE NOTICE 'Event invitation email sent to: %', invitation_record.user_email;
      
    EXCEPTION
      WHEN OTHERS THEN
        emails_failed_count := emails_failed_count + 1;
        RAISE NOTICE 'Failed to send email to %: %', invitation_record.user_email, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT emails_sent_count, emails_failed_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_event_invitation_emails(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitation_emails(UUID, UUID) TO service_role;

-- Test the function
SELECT '✅ Fixed send_event_invitation_emails function to actually send emails' as status;
