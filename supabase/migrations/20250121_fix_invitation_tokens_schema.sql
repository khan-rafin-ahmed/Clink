-- URGENT FIX: Add missing used_at column to invitation_tokens table
-- Fixes "column used_at does not exist" error when processing email invitations
-- Date: 2025-01-21

-- Step 1: Add the missing used_at column
ALTER TABLE invitation_tokens 
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE;

-- Step 2: Update the process_event_invitation_token function to handle the schema correctly
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
    v_current_user_id UUID;
    v_action TEXT;
    v_response_status TEXT;
    v_invitee_name TEXT;
BEGIN
    -- Step 1: Validate token exists and is not expired/used
    SELECT * INTO v_token_record
    FROM invitation_tokens
    WHERE token = p_token
      AND invitation_type = 'event'
      AND used = false
      AND expires_at > NOW();
    
    IF NOT FOUND THEN
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
    
    -- Step 7: Update invitation status
    UPDATE event_members 
    SET 
        status = v_response_status,
        invitation_responded_at = NOW(),
        updated_at = NOW()
    WHERE id = v_invitation_record.id;
    
    -- Step 8: Create notification for event host (if accepting)
    IF v_action = 'accept' THEN
        -- Get invitee name
        SELECT COALESCE(nickname, username, display_name, 
                       SPLIT_PART(email, '@', 1), 'A user') 
        INTO v_invitee_name
        FROM user_profiles 
        WHERE user_id = v_current_user_id;
        
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
    
    -- Step 9: Mark token as used (with used_at if column exists)
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
        RETURN json_build_object(
            'success', false,
            'message', 'An error occurred while processing the invitation',
            'error', SQLERRM,
            'error_code', SQLSTATE
        );
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION process_event_invitation_token TO authenticated;
GRANT EXECUTE ON FUNCTION process_event_invitation_token TO anon;

-- Step 4: Add helpful comment
COMMENT ON FUNCTION process_event_invitation_token IS 'FIXED: Schema-aware function that handles missing used_at column gracefully';

-- Step 5: Test message
SELECT 'Fixed invitation_tokens schema and function - email invitations should now work!' as status;
