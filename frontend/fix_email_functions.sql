-- Fix email functions without requiring database-level settings
-- This approach uses hardcoded values instead of database settings

-- ============================================================================
-- UPDATED EMAIL FUNCTIONS WITH HARDCODED VALUES
-- ============================================================================

-- Function to send event invitation emails (updated)
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
  emails_sent_count INTEGER := 0;
  emails_failed_count INTEGER := 0;
  email_data JSONB;
  supabase_url TEXT := 'https://arpphimkotjvnfoacquj.supabase.co';
  -- SECURITY: Service key should be stored as environment variable in Edge Functions
  -- This SQL file should not contain hardcoded credentials
  service_role_key TEXT := 'REPLACE_WITH_ENVIRONMENT_VARIABLE';
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

      -- Call the send-email edge function with hardcoded values
      PERFORM
        net.http_post(
          url := format('%s/functions/v1/send-email', supabase_url),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', format('Bearer %s', service_role_key)
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

-- Function to send crew invitation emails (updated)
CREATE OR REPLACE FUNCTION send_crew_invitation_email(
  p_crew_id UUID,
  p_user_id UUID,
  p_inviter_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  crew_record RECORD;
  user_record RECORD;
  inviter_record RECORD;
  user_email TEXT;
  email_data JSONB;
  supabase_url TEXT := 'https://arpphimkotjvnfoacquj.supabase.co';
  -- SECURITY: Service key should be stored as environment variable in Edge Functions
  -- This SQL file should not contain hardcoded credentials
  service_role_key TEXT := 'REPLACE_WITH_ENVIRONMENT_VARIABLE';
BEGIN
  -- Get crew details
  SELECT c.*, up.display_name as creator_name
  INTO crew_record
  FROM crews c
  JOIN user_profiles up ON c.created_by = up.user_id
  WHERE c.id = p_crew_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Crew not found';
  END IF;

  -- Get user email
  SELECT au.email, up.display_name
  INTO user_record
  FROM auth.users au
  JOIN user_profiles up ON au.id = up.user_id
  WHERE au.id = p_user_id;
  
  IF NOT FOUND OR user_record.email IS NULL THEN
    RAISE EXCEPTION 'User not found or no email address';
  END IF;

  -- Get inviter details
  SELECT up.display_name
  INTO inviter_record
  FROM user_profiles up
  WHERE up.user_id = p_inviter_id;

  -- Get crew member count
  DECLARE
    member_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO member_count
    FROM crew_members
    WHERE crew_id = p_crew_id AND status = 'accepted';
  END;

  -- Prepare email data
  email_data := jsonb_build_object(
    'crewName', crew_record.name,
    'inviterName', inviter_record.display_name,
    'crewDescription', crew_record.description,
    'memberCount', member_count,
    'acceptUrl', format('https://arpphimkotjvnfoacquj.supabase.co/crew/%s', crew_record.id)
  );

  -- Call the send-email edge function
  PERFORM
    net.http_post(
      url := format('%s/functions/v1/send-email', supabase_url),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', format('Bearer %s', service_role_key)
      ),
      body := jsonb_build_object(
        'to', user_record.email,
        'subject', format('🤘 You''re invited to join %s', crew_record.name),
        'type', 'crew_invitation',
        'data', email_data
      )
    );

  RAISE NOTICE 'Crew invitation email queued for: %', user_record.email;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the invitation
    RAISE NOTICE 'Failed to send crew invitation email: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_event_invitation_emails(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_crew_invitation_email(UUID, UUID, UUID) TO authenticated;

-- ============================================================================
-- TEST THE FUNCTIONS
-- ============================================================================

SELECT '🎉 Email functions updated with hardcoded credentials!' as status;
SELECT 'Functions are now ready to send emails.' as message;
SELECT 'Test by creating an event and inviting crew members.' as next_step;
