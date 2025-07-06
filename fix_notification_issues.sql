-- Quick fix for notification issues
-- Run this in Supabase SQL Editor

-- Fix 1: Update respond_to_event_invitation to use proper user name resolution
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
  invitee_profile TEXT;
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
  
  -- Get user profiles for notification (FIXED: proper user name resolution)
  SELECT display_name INTO inviter_profile 
  FROM user_profiles 
  WHERE user_id = invitation_record.invited_by;
  
  SELECT COALESCE(nickname, username, display_name, email) INTO invitee_profile 
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
      WHEN p_response = 'accepted' THEN '🎉 ' || invitee_profile || ' accepted your invitation to "' || invitation_record.event_title || '"'
      ELSE '😔 ' || invitee_profile || ' declined your invitation to "' || invitation_record.event_title || '"'
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
  
  -- FIXED: Update the original invitation notification with response status
  UPDATE notifications
  SET
    data = data || jsonb_build_object(
      'user_response', p_response,
      'responded_at', NOW()::text
    )
  WHERE user_id = p_user_id
    AND type = 'event_invitation'
    AND data->>'invitation_id' = p_invitation_id::text;
  
  RETURN TRUE;
END;
$$;

-- Fix 2: Update email token function to use unified service
CREATE OR REPLACE FUNCTION process_event_invitation_token(
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
    v_event_record RECORD;
    v_current_user_id UUID;
    v_action TEXT;
    v_response_success BOOLEAN;
BEGIN
    -- Get current user ID (from auth or parameter)
    v_current_user_id := COALESCE(p_user_id, auth.uid());
    
    -- If no user is authenticated, return auth required
    IF v_current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'requires_auth', true,
            'message', 'Please log in to respond to this invitation',
            'error', 'Authentication required'
        );
    END IF;
    
    -- Validate and get token
    SELECT * INTO v_token_record
    FROM invitation_tokens
    WHERE token = p_token
        AND invitation_type = 'event'
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
    FROM event_members
    WHERE id = v_token_record.invitation_id::UUID
        AND user_id = v_current_user_id
        AND status = 'pending';

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invitation not found or already responded to',
            'error', 'Invalid invitation state'
        );
    END IF;

    -- Get event details
    SELECT * INTO v_event_record
    FROM events
    WHERE id = v_invitation_record.event_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Event not found',
            'error', 'Event does not exist'
        );
    END IF;

    -- Get action from token
    v_action := v_token_record.action;
    
    -- FIXED: Use the unified response function (single source of truth)
    SELECT respond_to_event_invitation(
        v_invitation_record.id,
        v_current_user_id,
        v_action || 'ed', -- 'accept' -> 'accepted', 'decline' -> 'declined'
        NULL  -- No comment from email responses
    ) INTO v_response_success;

    -- Check if the response was successful
    IF NOT v_response_success THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Failed to process invitation response'
        );
    END IF;

    -- Mark token as used
    UPDATE invitation_tokens
    SET 
        used = true,
        used_at = NOW()
    WHERE token = p_token;

    -- Return success with redirect info
    RETURN json_build_object(
        'success', true,
        'action', v_action,
        'message', CASE 
            WHEN v_action = 'accept' THEN 'Invitation accepted! See you at the event!'
            ELSE 'Invitation declined. Thanks for letting us know!'
        END,
        'event_title', v_event_record.title,
        'event_id', v_event_record.id,
        'redirect_url', '/event/' || COALESCE(v_event_record.public_slug, v_event_record.private_slug, v_event_record.event_code)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Failed to process invitation',
            'error', SQLERRM
        );
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION respond_to_event_invitation IS 'FIXED: Single source of truth for all event invitation responses with proper user name resolution';
COMMENT ON FUNCTION process_event_invitation_token IS 'FIXED: Email token processing now uses unified response function';
