-- COMPREHENSIVE FIX: Eliminate ALL "Someone" notifications from all functions
-- This fixes every function that still uses "Someone" as fallback

-- 1. Fix respond_to_event_invitation (ensure it's really fixed)
DROP FUNCTION IF EXISTS respond_to_event_invitation(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS respond_to_event_invitation(UUID, UUID, TEXT);

CREATE OR REPLACE FUNCTION respond_to_event_invitation(
  p_invitation_id UUID,
  p_user_id UUID,
  p_response TEXT,
  p_comment TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  invitee_profile RECORD;
  invitee_name TEXT;
BEGIN
  -- Validate response
  IF p_response NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Invalid response. Must be accepted or declined.';
  END IF;
  
  -- Get invitation details
  SELECT em.*, e.title as event_title, e.created_by as event_host
  INTO invitation_record
  FROM event_members em
  JOIN events e ON em.event_id = e.id
  WHERE em.id = p_invitation_id 
    AND em.user_id = p_user_id 
    AND em.status = 'pending';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already responded to.';
  END IF;
  
  -- Update invitation status
  UPDATE event_members 
  SET 
    status = p_response,
    invitation_comment = p_comment,
    invitation_responded_at = NOW()
  WHERE id = p_invitation_id;
  
  -- Get user profile with comprehensive fallback
  SELECT display_name, username INTO invitee_profile 
  FROM user_profiles 
  WHERE user_id = p_user_id;
  
  -- Create the best possible user name (NO MORE "Someone"!)
  invitee_name := COALESCE(
    invitee_profile.display_name,
    invitee_profile.username,
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = p_user_id),
    'A user'
  );
  
  -- Notify the inviter about the response
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    invitation_record.invited_by,
    'event_invitation_response',
    CASE
      WHEN p_response = 'accepted' THEN '🎉 ' || invitee_name || ' accepted your invitation to "' || invitation_record.event_title || '"'
      ELSE '😔 ' || invitee_name || ' declined your invitation to "' || invitation_record.event_title || '"'
    END,
    CASE
      WHEN p_response = 'accepted' THEN 'They''re ready to raise hell!'
      ELSE 'They won''t be able to make it this time.'
    END || CASE WHEN p_comment IS NOT NULL THEN ' Message: "' || p_comment || '"' ELSE '' END,
    jsonb_build_object(
      'event_id', invitation_record.event_id,
      'event_title', invitation_record.event_title,
      'invitation_id', p_invitation_id,
      'response', p_response,
      'comment', p_comment,
      'show_view_event_button', true
    )
  );

  -- CRITICAL: Update the original invitation notification to show response
  UPDATE notifications
  SET data = data || jsonb_build_object(
    'user_response', p_response,
    'responded_at', NOW()::text
  )
  WHERE user_id = p_user_id
    AND type = 'event_invitation'
    AND data->>'invitation_id' = p_invitation_id::text;

  -- Also try to update by event_id if invitation_id doesn't match
  UPDATE notifications
  SET data = data || jsonb_build_object(
    'user_response', p_response,
    'responded_at', NOW()::text
  )
  WHERE user_id = p_user_id
    AND type = 'event_invitation'
    AND data->>'event_id' = invitation_record.event_id::text
    AND (data->>'user_response' IS NULL OR data->>'user_response' = '');

  RETURN TRUE;
END;
$$;

-- 2. Fix send_event_invitations_to_crew function
DROP FUNCTION IF EXISTS send_event_invitations_to_crew(UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION send_event_invitations_to_crew(
    p_event_id UUID,
    p_crew_id UUID,
    p_invited_by UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    crew_member RECORD;
    event_record RECORD;
    inviter_profile RECORD;
    invitation_id UUID;
    invitations_sent INTEGER := 0;
    inviter_name TEXT;
BEGIN
    -- Get event details
    SELECT * INTO event_record FROM events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;
    
    -- Get inviter profile with proper fallback
    SELECT display_name, username INTO inviter_profile 
    FROM user_profiles WHERE user_id = p_invited_by;
    
    -- Create inviter name (NO MORE "Someone"!)
    inviter_name := COALESCE(
        inviter_profile.display_name,
        inviter_profile.username,
        (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = p_invited_by),
        'A user'
    );
    
    -- Loop through crew members
    FOR crew_member IN 
        SELECT cm.user_id, up.display_name, up.username, up.email
        FROM crew_members cm
        JOIN user_profiles up ON cm.user_id = up.user_id
        WHERE cm.crew_id = p_crew_id 
        AND cm.status = 'accepted'
        AND cm.user_id != p_invited_by
    LOOP
        -- Check if already invited
        IF NOT EXISTS (
            SELECT 1 FROM event_members 
            WHERE event_id = p_event_id AND user_id = crew_member.user_id
        ) THEN
            -- Create invitation
            INSERT INTO event_members (event_id, user_id, invited_by, status)
            VALUES (p_event_id, crew_member.user_id, p_invited_by, 'pending')
            RETURNING id INTO invitation_id;
            
            -- Create notification with proper invitation_id and user name
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                data
            ) VALUES (
                crew_member.user_id,
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
            
            invitations_sent := invitations_sent + 1;
        END IF;
    END LOOP;
    
    RETURN invitations_sent;
END;
$$;

-- 3. Fix handle_event_invitation_notification function
-- Drop the trigger first, then the function
DROP TRIGGER IF EXISTS event_invitation_notification_trigger ON event_members;
DROP FUNCTION IF EXISTS handle_event_invitation_notification(UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS handle_event_invitation_notification(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS handle_event_invitation_notification;

CREATE OR REPLACE FUNCTION handle_event_invitation_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    event_record RECORD;
    inviter_profile RECORD;
    inviter_name TEXT;
BEGIN
    -- Get event details
    SELECT * INTO event_record FROM events WHERE id = NEW.event_id;

    -- Get inviter profile with proper fallback
    SELECT display_name, username INTO inviter_profile
    FROM user_profiles WHERE user_id = NEW.invited_by;

    -- Create inviter name (NO MORE "Someone"!)
    inviter_name := COALESCE(
        inviter_profile.display_name,
        inviter_profile.username,
        (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = NEW.invited_by),
        'A user'
    );

    -- Create notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
    ) VALUES (
        NEW.user_id,
        'event_invitation',
        '🍺 ' || inviter_name || ' invited you to a session',
        'Join the session: ' || event_record.title,
        jsonb_build_object(
            'event_id', NEW.event_id,
            'event_title', event_record.title,
            'invitation_id', NEW.id,
            'invited_by', NEW.invited_by,
            'show_join_decline_buttons', true
        )
    );

    RETURN NEW;
END;
$$;

-- 4. Recreate the trigger for event invitation notifications
CREATE OR REPLACE TRIGGER event_invitation_notification_trigger
    AFTER INSERT ON event_members
    FOR EACH ROW
    WHEN (NEW.status = 'pending' AND NEW.invited_by IS NOT NULL)
    EXECUTE FUNCTION handle_event_invitation_notification();

-- Grant permissions
GRANT EXECUTE ON FUNCTION respond_to_event_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew TO authenticated;
GRANT EXECUTE ON FUNCTION handle_event_invitation_notification TO authenticated;

SELECT 'All major "Someone" notification functions fixed!' as status;
