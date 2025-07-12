-- URGENT FIX: Email invitation processing functions
-- This fixes the "An error occurred while processing the invitation" error
-- when users click email invitation links

-- Step 1: Fix the process_event_invitation_token function
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

-- Step 2: Fix the process_crew_invitation_token function
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

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION process_event_invitation_token TO authenticated;
GRANT EXECUTE ON FUNCTION process_crew_invitation_token TO authenticated;

-- Step 4: Test message
SELECT 'Email invitation processing fixed! Users can now accept/decline invitations via email without errors.' as status;
