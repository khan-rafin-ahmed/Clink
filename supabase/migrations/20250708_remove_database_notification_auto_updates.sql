-- Remove Database Auto-Update for Notifications
-- This migration implements Option A: Frontend-only notification updates
-- Ensures single-source response handling and avoids duplicate updates

-- Update the respond_to_event_invitation function to remove auto-notification updates
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
  event_record RECORD;
  inviter_profile RECORD;
  invitee_profile RECORD;
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
  
  -- Get user profiles for notification with better fallback
  SELECT display_name, username INTO inviter_profile
  FROM user_profiles
  WHERE user_id = invitation_record.invited_by;

  SELECT display_name, username INTO invitee_profile
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Notify the inviter about the response (consolidated notification with event title)
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
      WHEN p_response = 'accepted' THEN '🎉 ' || COALESCE(invitee_profile.display_name, invitee_profile.username, 'A user') || ' accepted your invitation to "' || invitation_record.event_title || '"'
      ELSE '😔 ' || COALESCE(invitee_profile.display_name, invitee_profile.username, 'A user') || ' declined your invitation to "' || invitation_record.event_title || '"'
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
  
  -- NOTE: Original invitation notification updates are now handled by frontend updateNotificationState function
  -- This ensures single-source response handling and avoids duplicate updates
  
  RETURN TRUE;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION respond_to_event_invitation IS 'Process event invitation responses. Notification state updates are handled by frontend for single-source response handling.';

-- Also fix the crew notification that uses "Someone" fallback
-- Update the process_crew_invitation_token function to use better user name fallback
CREATE OR REPLACE FUNCTION process_crew_invitation_token(
    p_token TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token_record RECORD;
    v_invitation_record RECORD;
    v_crew_record RECORD;
    v_current_user_id UUID;
    v_action TEXT;
BEGIN
    -- Get current user ID (from parameter or auth context)
    v_current_user_id := COALESCE(p_user_id, auth.uid());

    IF v_current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Authentication required',
            'error', 'User not authenticated'
        );
    END IF;

    -- Get token details
    SELECT * INTO v_token_record
    FROM invitation_tokens
    WHERE token = p_token
        AND type = 'crew'
        AND used = false
        AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invalid or expired invitation token',
            'error', 'Token not found or expired'
        );
    END IF;

    -- Get invitation details
    SELECT * INTO v_invitation_record
    FROM crew_members
    WHERE id = v_token_record.invitation_id
        AND user_id = v_current_user_id
        AND status = 'pending';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invitation not found or already responded to',
            'error', 'Invitation not available'
        );
    END IF;

    -- Get crew details
    SELECT * INTO v_crew_record
    FROM crews
    WHERE id = v_invitation_record.crew_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Crew not found',
            'error', 'Crew does not exist'
        );
    END IF;

    -- Get action from token
    v_action := v_token_record.action;

    -- Update invitation status
    UPDATE crew_members
    SET
        status = v_action || 'ed', -- 'accept' -> 'accepted', 'decline' -> 'declined'
        updated_at = NOW()
    WHERE id = v_invitation_record.id;

    -- Mark token as used
    UPDATE invitation_tokens
    SET
        used = true,
        used_at = NOW()
    WHERE token = p_token;

    -- Create success notification for crew creator (if accepting)
    IF v_action = 'accept' THEN
        DECLARE
            v_user_name TEXT;
        BEGIN
            -- Get user's display name with better fallback
            SELECT COALESCE(display_name, username, 'A user') INTO v_user_name
            FROM user_profiles
            WHERE user_id = v_current_user_id;

            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                data
            ) VALUES (
                v_crew_record.created_by,
                'crew_join',
                '🤘 New crew member!',
                v_user_name || ' joined your crew ' || v_crew_record.name,
                jsonb_build_object(
                    'crew_id', v_crew_record.id,
                    'user_id', v_current_user_id
                )
            );
        END;
    END IF;

    -- Return success response
    RETURN json_build_object(
        'success', true,
        'action', v_action || 'ed',
        'message', CASE
            WHEN v_action = 'accept' THEN 'Successfully joined the crew! 🤘'
            ELSE 'Invitation declined'
        END,
        'crew_name', v_crew_record.name,
        'crew_id', v_crew_record.id
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'An error occurred while processing the invitation',
            'error', SQLERRM
        );
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION process_crew_invitation_token IS 'Process crew invitation tokens with improved user name fallback (no more "Someone" notifications).';
