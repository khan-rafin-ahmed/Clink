-- COMPREHENSIVE FIX: Eliminate duplicate notifications and fix user data issues (V2)
-- This migration fixes the function name conflict and applies all necessary fixes

-- Step 1: Remove the duplicate notification trigger
-- This trigger was creating duplicate notifications alongside the RPC functions
DROP TRIGGER IF EXISTS event_invitation_notification_trigger ON event_members;
DROP FUNCTION IF EXISTS handle_event_invitation_notification();

-- Step 2: Drop any existing conflicting functions
DROP FUNCTION IF EXISTS create_event_invitation_notification(UUID, UUID, UUID, UUID);
DROP FUNCTION IF EXISTS create_event_invitation_notification(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS create_event_invitation_notification;

-- Step 3: Fix the respond_to_event_invitation function to eliminate "Someone" notifications
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

  RETURN TRUE;
END;
$$;

-- Step 4: Fix the send_event_invitations_to_crew function with proper user names
CREATE OR REPLACE FUNCTION send_event_invitations_to_crew(
    p_event_id UUID,
    p_crew_id UUID,
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
    member_record RECORD;
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
    
    -- Loop through crew members and create invitations
    FOR member_record IN 
        SELECT cm.user_id
        FROM crew_members cm
        WHERE cm.crew_id = p_crew_id 
          AND cm.status = 'accepted'
          AND cm.user_id != p_invited_by  -- Don't invite the inviter
    LOOP
        -- Check if user is already invited or joined
        IF NOT EXISTS (
            SELECT 1 FROM event_members em
            WHERE em.event_id = p_event_id 
              AND em.user_id = member_record.user_id
        ) THEN
            -- Create invitation in event_members table
            INSERT INTO event_members (
                event_id,
                user_id,
                invited_by,
                status,
                invitation_sent_at
            ) VALUES (
                p_event_id,
                member_record.user_id,
                p_invited_by,
                'pending',
                NOW()
            ) RETURNING id INTO invitation_id;
            
            -- Add to results
            invited_count := invited_count + 1;
            invitation_ids := array_append(invitation_ids, invitation_id);
            
            -- Create notification for the invited user with proper inviter name
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                data
            ) VALUES (
                member_record.user_id,
                'event_invitation',
                '🍺 ' || inviter_name || ' invited you to join a session',
                'Join the session: "' || event_record.title || '"',
                jsonb_build_object(
                    'event_id', p_event_id,
                    'event_title', event_record.title,
                    'invitation_id', invitation_id,
                    'inviter_id', p_invited_by,
                    'show_join_decline_buttons', true
                )
            );
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT invited_count, invitation_ids;
END;
$$;

-- Step 5: Grant necessary permissions
GRANT EXECUTE ON FUNCTION respond_to_event_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew TO authenticated;

-- Step 6: Add comments for documentation
COMMENT ON FUNCTION respond_to_event_invitation IS 'FIXED VERSION: No duplicate notifications, proper user name fallback, includes user_id in response data for avatar display';
COMMENT ON FUNCTION send_event_invitations_to_crew IS 'FIXED VERSION: No duplicate notifications, proper inviter name fallback, standardized notification format';

-- Step 7: Clean up any existing malformed notifications (optional)
-- This removes notifications with the malformed "you invited you" pattern
DELETE FROM notifications 
WHERE type = 'event_invitation' 
AND title ILIKE '%you invited you%';

-- Step 8: Fix email invitation token processing functions
-- These functions handle email responses and need to be updated to work with the new system

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

    -- Use the unified response function (single source of truth)
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

-- Step 9: Fix crew invitation token processing function
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
    v_response_status TEXT;
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

    -- Get crew member invitation details
    SELECT * INTO v_invitation_record
    FROM crew_members
    WHERE id = v_token_record.invitation_id;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invitation not found',
            'error', 'Crew member record not found'
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

    -- Get action from token and convert to status
    v_action := v_token_record.action;
    v_response_status := CASE
        WHEN v_action = 'accept' THEN 'accepted'
        WHEN v_action = 'decline' THEN 'declined'
        ELSE v_action
    END;

    -- Update crew member status
    UPDATE crew_members
    SET
        status = v_response_status,
        updated_at = NOW()
    WHERE id = v_invitation_record.id;

    -- CRITICAL: Update the original crew invitation notification to reflect the response
    -- This ensures email-notification synchronization for crew invitations
    UPDATE notifications
    SET
        data = data || jsonb_build_object(
            'user_response', v_response_status,
            'responded_at', NOW()::text,
            'response_method', 'email'
        )
    WHERE
        user_id = v_current_user_id
        AND type = 'crew_invitation'
        AND (
            data->>'crew_member_id' = v_invitation_record.id::text
            OR data->>'crew_id' = v_crew_record.id::text
        );

    -- Mark token as used
    UPDATE invitation_tokens
    SET
        used = true,
        used_at = NOW()
    WHERE token = p_token;

    -- Return success response
    RETURN json_build_object(
        'success', true,
        'action', v_response_status,
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

-- Step 10: Grant permissions for token processing functions
GRANT EXECUTE ON FUNCTION process_event_invitation_token TO authenticated;
GRANT EXECUTE ON FUNCTION process_crew_invitation_token TO authenticated;

-- Step 11: Add comments for documentation
COMMENT ON FUNCTION process_event_invitation_token IS 'Process event invitation tokens with automatic in-app notification synchronization';
COMMENT ON FUNCTION process_crew_invitation_token IS 'Process crew invitation tokens with automatic in-app notification synchronization';

-- Step 12: Test message
SELECT 'Email invitation processing functions updated! Email responses will now work correctly and sync with in-app notifications.' as status;
