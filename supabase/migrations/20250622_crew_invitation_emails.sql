-- Add crew invitation email functionality
-- This migration creates a function to send crew invitation emails

-- Function to send crew invitation emails
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
  inviter_record RECORD;
  user_email TEXT;
  email_data JSONB;
BEGIN
  -- Get crew details
  SELECT name, description, created_by
  INTO crew_record
  FROM crews
  WHERE id = p_crew_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Crew not found';
  END IF;

  -- Get inviter details
  SELECT display_name, avatar_url
  INTO inviter_record
  FROM user_profiles
  WHERE user_id = p_inviter_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inviter profile not found';
  END IF;

  -- Get user email from auth.users
  SELECT email
  INTO user_email
  FROM auth.users
  WHERE id = p_user_id;

  IF NOT FOUND OR user_email IS NULL THEN
    RAISE NOTICE 'User email not found for user_id: %', p_user_id;
    RETURN;
  END IF;

  -- Get crew member count
  DECLARE
    member_count INTEGER;
  BEGIN
    SELECT COUNT(*)
    INTO member_count
    FROM crew_members
    WHERE crew_id = p_crew_id AND status = 'accepted';
    
    -- Add 1 for creator if not already counted
    IF NOT EXISTS (
      SELECT 1 FROM crew_members 
      WHERE crew_id = p_crew_id 
        AND user_id = crew_record.created_by 
        AND status = 'accepted'
    ) THEN
      member_count := member_count + 1;
    END IF;
  END;

  -- Prepare email data
  email_data := jsonb_build_object(
    'crewName', crew_record.name,
    'inviterName', COALESCE(inviter_record.display_name, 'Someone'),
    'inviterAvatar', inviter_record.avatar_url,
    'crewDescription', crew_record.description,
    'acceptUrl', format('%s/notifications', current_setting('app.base_url', true)),
    'declineUrl', format('%s/notifications', current_setting('app.base_url', true)),
    'crewUrl', format('%s/crew/%s', current_setting('app.base_url', true), p_crew_id),
    'memberCount', member_count
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
        'to', user_email,
        'subject', format('🤘 You''re invited to join %s', crew_record.name),
        'type', 'crew_invitation',
        'data', email_data
      )
    );

  RAISE NOTICE 'Crew invitation email queued for: %', user_email;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the invitation
    RAISE NOTICE 'Failed to send crew invitation email: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION send_crew_invitation_email(UUID, UUID, UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION send_crew_invitation_email IS 'Sends crew invitation email to a user';
