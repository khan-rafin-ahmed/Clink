-- Create missing invitation token processing functions
-- These functions handle email invitation tokens for events and crews

-- Only create the missing functions since table and policies already exist

-- Function to process event invitation tokens
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
    
    -- Update invitation status
    UPDATE event_members
    SET 
        status = v_action || 'ed', -- 'accept' -> 'accepted', 'decline' -> 'declined'
        invitation_responded_at = NOW(),
        updated_at = NOW()
    WHERE id = v_invitation_record.id;
    
    -- Mark token as used
    UPDATE invitation_tokens
    SET 
        used = true,
        used_at = NOW()
    WHERE token = p_token;
    
    -- Create success notification for event host (if accepting)
    IF v_action = 'accept' THEN
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            v_event_record.created_by,
            'event_rsvp',
            '🎉 Someone joined your session!',
            'A crew member accepted your invitation to ' || v_event_record.title,
            jsonb_build_object(
                'event_id', v_event_record.id,
                'event_slug', v_event_record.slug,
                'user_id', v_current_user_id
            )
        );
    END IF;
    
    -- Return success response
    RETURN json_build_object(
        'success', true,
        'action', v_action || 'ed',
        'message', CASE 
            WHEN v_action = 'accept' THEN 'Successfully joined the session! 🍻'
            ELSE 'Invitation declined'
        END,
        'event_title', v_event_record.title,
        'event_slug', v_event_record.slug,
        'event_id', v_event_record.id,
        'redirect_url', CASE 
            WHEN v_action = 'accept' THEN '/session/' || v_event_record.slug
            ELSE '/dashboard'
        END
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

-- Function to process crew invitation tokens
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
        AND invitation_type = 'crew'
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
    FROM crew_members
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
            'Someone joined your crew ' || v_crew_record.name,
            jsonb_build_object(
                'crew_id', v_crew_record.id,
                'user_id', v_current_user_id
            )
        );
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
        'crew_id', v_crew_record.id,
        'redirect_url', CASE
            WHEN v_action = 'accept' THEN '/crew/' || v_crew_record.id
            ELSE '/dashboard'
        END
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

-- Function to cleanup expired invitation tokens
CREATE OR REPLACE FUNCTION cleanup_expired_invitation_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM invitation_tokens
    WHERE expires_at < NOW() - INTERVAL '7 days'; -- Keep expired tokens for 7 days for debugging

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;
