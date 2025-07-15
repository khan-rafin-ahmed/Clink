-- Fix the ambiguous user_id error in send_event_invitations_to_users function
-- This error occurs when multiple tables have user_id columns and we need to specify which one

-- Drop the existing function
DROP FUNCTION IF EXISTS send_event_invitations_to_users(UUID, UUID[], UUID);

-- Create the corrected function with proper table aliases
CREATE OR REPLACE FUNCTION send_event_invitations_to_users(
  p_event_id UUID,
  p_user_ids UUID[],
  p_invited_by UUID
)
RETURNS TABLE (
  invited_count INTEGER,
  invitation_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  invitation_id UUID;
  invited_count INTEGER := 0;
  invitation_ids UUID[] := '{}';
  event_record RECORD;
  inviter_profile RECORD;
  inviter_name TEXT;
BEGIN
  -- Get event details
  SELECT * INTO event_record FROM events WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found with ID: %', p_event_id;
  END IF;

  -- Get inviter profile with proper fallback (using table alias to avoid ambiguity)
  SELECT up.display_name, up.username INTO inviter_profile
  FROM user_profiles up WHERE up.user_id = p_invited_by;

  -- Create inviter name (consistent with crew invitation logic)
  inviter_name := COALESCE(
    inviter_profile.display_name,
    inviter_profile.username,
    (SELECT split_part(au.email, '@', 1) FROM auth.users au WHERE au.id = p_invited_by),
    'A user'
  );

  -- Process each user ID
  FOREACH current_user_id IN ARRAY p_user_ids
  LOOP
    -- Check if user is already invited or joined (using table alias)
    IF NOT EXISTS (
      SELECT 1 FROM event_members em
      WHERE em.event_id = p_event_id 
        AND em.user_id = current_user_id
    ) THEN
      -- Create event invitation
      INSERT INTO event_members (
        event_id, 
        user_id, 
        invited_by, 
        status, 
        invitation_sent_at
      ) VALUES (
        p_event_id,
        current_user_id,
        p_invited_by,
        'pending',
        NOW()
      ) RETURNING id INTO invitation_id;
      
      -- Add to results
      invited_count := invited_count + 1;
      invitation_ids := array_append(invitation_ids, invitation_id);
      
      -- Create notification for the invited user (consistent with crew invitations)
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        current_user_id,
        'event_invitation',
        '🍺 ' || inviter_name || ' invited you to a session',
        'Join the session: ' || event_record.title,
        jsonb_build_object(
          'event_id', p_event_id,
          'event_title', event_record.title,
          'invitation_id', invitation_id,
          'invited_by', p_invited_by,
          'show_join_decline_buttons', true
        )
      );
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT invited_count, invitation_ids;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_event_invitations_to_users(UUID, UUID[], UUID) TO authenticated;

-- Add documentation
COMMENT ON FUNCTION send_event_invitations_to_users IS 'FIXED: Send event invitations to individual users with proper table aliases to avoid ambiguous column references';

-- Test the function (uncomment to test with real data)
-- SELECT * FROM send_event_invitations_to_users(
--   'your-event-id'::UUID,
--   ARRAY['user-id-1'::UUID, 'user-id-2'::UUID],
--   'inviter-user-id'::UUID
-- );
