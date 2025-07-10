-- FIX: Update process_event_invitation_token function to resolve email invitation issues
-- This fixes the redirect URLs, event slug references, and ensures consistency

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
    v_event_slug TEXT;
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
            'message', 'Invalid or expired invitation link',
            'error', 'Token not found or expired'
        );
    END IF;
    
    -- Check if token belongs to current user
    IF v_token_record.user_id != v_current_user_id THEN
        RETURN json_build_object(
            'success', false,
            'message', 'This invitation is not for you',
            'error', 'User mismatch'
        );
    END IF;
    
    -- Get invitation record
    SELECT * INTO v_invitation_record
    FROM event_members
    WHERE id = v_token_record.invitation_id::UUID
        AND user_id = v_current_user_id
        AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Invitation not found or already responded to',
            'error', 'Invitation not available'
        );
    END IF;
    
    -- Get event details with proper slug fields
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
        updated_at = NOW()
    WHERE token = p_token;
    
    -- Get the correct event slug (use the proper field names)
    v_event_slug := COALESCE(
        v_event_record.public_slug, 
        v_event_record.private_slug, 
        v_event_record.event_code,
        v_event_record.id::text
    );
    
    -- Return success response with FIXED redirect URLs
    RETURN json_build_object(
        'success', true,
        'action', v_action || 'ed',
        'message', CASE 
            WHEN v_action = 'accept' THEN 'Successfully joined the session! 🍻'
            ELSE 'Invitation declined successfully'
        END,
        'event_title', v_event_record.title,
        'event_slug', v_event_slug,
        'event_id', v_event_record.id,
        'redirect_url', '/event/' || v_event_slug  -- FIXED: Use /event/ not /session/
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_event_invitation_token TO authenticated;

-- Add comment
COMMENT ON FUNCTION process_event_invitation_token IS 'FIXED VERSION: Correct redirect URLs (/event/ not /session/), proper event slug handling, and consistent with respond_to_event_invitation function.';

SELECT 'process_event_invitation_token function updated successfully!' as status;
