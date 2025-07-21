-- COMPREHENSIVE FIX: Email invitation processing errors
-- Fixes "An error occurred while processing the invitation" when clicking Accept/Decline in emails
-- Date: 2025-01-21

-- Step 1: Enhanced process_event_invitation_token function with detailed error handling
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
    v_response_status TEXT;
    v_inviter_name TEXT;
    v_invitee_name TEXT;
BEGIN
    -- Enhanced logging for debugging
    RAISE NOTICE 'Processing token: %, user_id: %', p_token, p_user_id;
    
    -- Step 1: Validate token exists and is not expired/used
    SELECT * INTO v_token_record
    FROM invitation_tokens
    WHERE token = p_token
      AND invitation_type = 'event'
      AND used = false
      AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RAISE NOTICE 'Token validation failed: token=%, found=%', p_token, FOUND;
        RETURN json_build_object(
            'success', false,
            'message', 'Invalid or expired invitation link',
            'error', 'TOKEN_INVALID'
        );
    END IF;
    
    -- Step 2: Get current user (from token or parameter)
    v_current_user_id := COALESCE(p_user_id, v_token_record.user_id);
    
    IF v_current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Authentication required',
            'error', 'AUTH_REQUIRED',
            'requires_auth', true
        );
    END IF;
    
    -- Step 3: Validate token belongs to current user
    IF v_token_record.user_id != v_current_user_id THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invalid invitation link',
            'error', 'USER_MISMATCH'
        );
    END IF;
    
    -- Step 4: Get invitation details from event_members table
    SELECT em.*, e.title as event_title, e.id as event_id
    INTO v_invitation_record
    FROM event_members em
    JOIN events e ON em.event_id = e.id
    WHERE em.id = v_token_record.invitation_id::uuid;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invitation not found',
            'error', 'INVITATION_NOT_FOUND'
        );
    END IF;
    
    -- Step 5: Check if invitation already responded to
    IF v_invitation_record.status != 'pending' THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invitation already responded to',
            'error', 'ALREADY_RESPONDED',
            'current_status', v_invitation_record.status
        );
    END IF;
    
    -- Step 6: Get action and convert to proper status
    v_action := v_token_record.action;
    v_response_status := CASE 
        WHEN v_action = 'accept' THEN 'accepted'
        WHEN v_action = 'decline' THEN 'declined'
        ELSE 'declined'
    END;
    
    RAISE NOTICE 'Processing action: % -> status: %', v_action, v_response_status;
    
    -- Step 7: Update invitation status
    UPDATE event_members 
    SET 
        status = v_response_status,
        invitation_responded_at = NOW(),
        updated_at = NOW()
    WHERE id = v_invitation_record.id;
    
    -- Step 8: Get user names for notifications (if accepting)
    IF v_action = 'accept' THEN
        -- Get invitee name
        SELECT COALESCE(nickname, username, display_name, 
                       SPLIT_PART(email, '@', 1), 'A user') 
        INTO v_invitee_name
        FROM user_profiles 
        WHERE user_id = v_current_user_id;
        
        -- Get inviter name  
        SELECT COALESCE(nickname, username, display_name,
                       SPLIT_PART(email, '@', 1), 'Someone')
        INTO v_inviter_name
        FROM user_profiles 
        WHERE user_id = v_invitation_record.invited_by;
        
        -- Create notification for event host
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            v_invitation_record.invited_by,
            'event_invitation_response',
            v_invitee_name || ' accepted your invitation to ' || v_invitation_record.event_title,
            'They''re ready to raise hell!',
            jsonb_build_object(
                'event_id', v_invitation_record.event_id,
                'event_title', v_invitation_record.event_title,
                'user_id', v_current_user_id,
                'user_name', v_invitee_name,
                'invitation_id', v_invitation_record.id,
                'response', v_response_status,
                'show_view_event_button', true
            )
        );
    END IF;
    
    -- Step 9: Mark token as used
    UPDATE invitation_tokens
    SET 
        used = true,
        used_at = NOW(),
        updated_at = NOW()
    WHERE token = p_token;
    
    -- Step 10: Return success response
    RETURN json_build_object(
        'success', true,
        'action', v_response_status,
        'message', CASE
            WHEN v_action = 'accept' THEN 'Successfully joined the event! 🍺'
            ELSE 'Invitation declined'
        END,
        'event_title', v_invitation_record.event_title,
        'event_id', v_invitation_record.event_id,
        'redirect_url', '/event/' || v_invitation_record.event_id
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Enhanced error logging
        RAISE NOTICE 'Error processing token: %, SQLSTATE: %, SQLERRM: %', p_token, SQLSTATE, SQLERRM;
        RETURN json_build_object(
            'success', false,
            'message', 'An error occurred while processing the invitation',
            'error', SQLERRM,
            'error_code', SQLSTATE,
            'debug_info', jsonb_build_object(
                'token', p_token,
                'user_id', p_user_id,
                'action', v_action,
                'status', v_response_status
            )
        );
END;
$$;

-- Step 2: Grant permissions
GRANT EXECUTE ON FUNCTION process_event_invitation_token TO authenticated;
GRANT EXECUTE ON FUNCTION process_event_invitation_token TO anon;

-- Step 3: Add helpful comment
COMMENT ON FUNCTION process_event_invitation_token IS 'COMPREHENSIVE FIX: Enhanced error handling and debugging for email invitation processing. Handles all edge cases and provides detailed error messages.';

-- Step 4: Test message
SELECT 'Email invitation processing function updated with comprehensive error handling!' as status;
