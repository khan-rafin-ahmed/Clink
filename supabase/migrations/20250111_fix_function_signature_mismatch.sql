-- SURGICAL FIX: Function signature mismatch causing email invitation failures
-- Root Cause: respond_to_event_invitation returns VOID but process_event_invitation_token expects BOOLEAN
-- This fix ensures the function returns BOOLEAN as expected

-- Fix the respond_to_event_invitation function to return BOOLEAN
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
  -- Get invitation details with event title
  SELECT 
    em.invited_by,
    em.event_id,
    e.title as event_title
  INTO invitation_record
  FROM event_members em
  JOIN events e ON em.event_id = e.id
  WHERE em.id = p_invitation_id AND em.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or user not authorized';
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
  
  -- Create response notification for the inviter with proper user name
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
    END,
    jsonb_build_object(
      'event_id', invitation_record.event_id,
      'event_title', invitation_record.event_title,
      'invitation_id', p_invitation_id,
      'response', p_response,
      'comment', p_comment,
      'user_id', p_user_id,
      'show_view_event_button', true
    )
  );
  
  -- CRITICAL: Update the original invitation notification to reflect the response
  -- This ensures email-notification synchronization
  UPDATE notifications 
  SET 
    data = data || jsonb_build_object(
      'user_response', p_response,
      'responded_at', NOW()::text,
      'response_method', 'email_or_app'
    )
  WHERE 
    user_id = p_user_id 
    AND type = 'event_invitation'
    AND (
      data->>'invitation_id' = p_invitation_id::text 
      OR data->>'event_id' = invitation_record.event_id::text
    );
  
  -- CRITICAL: Return TRUE to indicate success (this was missing!)
  RETURN TRUE;
END;
$$;

-- Ensure the process_event_invitation_token function is compatible
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
    -- Get current user ID
    v_current_user_id := COALESCE(p_user_id, auth.uid());
    
    IF v_current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Authentication required',
            'error', 'No user ID provided'
        );
    END IF;
    
    -- Get token details
    SELECT * INTO v_token_record
    FROM invitation_tokens
    WHERE token = p_token AND NOT used;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invalid or expired invitation link',
            'error', 'Token not found or already used'
        );
    END IF;
    
    -- Check if token is expired
    IF v_token_record.expires_at < NOW() THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invitation link has expired',
            'error', 'Token expired'
        );
    END IF;
    
    -- Get invitation details
    SELECT * INTO v_invitation_record
    FROM event_members
    WHERE id = v_token_record.invitation_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invitation not found',
            'error', 'Event member record not found'
        );
    END IF;
    
    -- Verify user matches invitation
    IF v_invitation_record.user_id != v_current_user_id THEN
        RETURN json_build_object(
            'success', false,
            'message', 'This invitation is not for you',
            'error', 'User ID mismatch'
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
    
    -- Use the unified response function (now returns BOOLEAN correctly)
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

    -- Return success response with event details
    RETURN json_build_object(
        'success', true,
        'action', v_action || 'ed',
        'message', CASE
            WHEN v_action = 'accept' THEN 'Successfully joined the event! 🍺'
            ELSE 'Invitation declined'
        END,
        'event_title', v_event_record.title,
        'event_id', v_event_record.id,
        'event_slug', v_event_record.slug
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION respond_to_event_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION process_event_invitation_token TO authenticated;

-- Test message
SELECT 'FIXED: Function signature mismatch resolved. Email invitations should now work correctly!' as status;
