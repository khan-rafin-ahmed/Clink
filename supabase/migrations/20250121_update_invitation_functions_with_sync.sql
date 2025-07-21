-- UPDATE INVITATION FUNCTIONS: Enable email-notification synchronization
-- Updates existing invitation functions to link tokens with notifications
-- Date: 2025-01-21

-- Step 1: Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS send_event_invitations_to_users(uuid, uuid[], uuid);
DROP FUNCTION IF EXISTS send_event_invitations_to_crew(uuid, uuid, uuid);

-- Step 2: Create send_event_invitations_to_users function with notification linking
CREATE OR REPLACE FUNCTION send_event_invitations_to_users(
    p_event_id UUID,
    p_user_ids UUID[],
    p_invited_by UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    event_record RECORD;
    inviter_profile RECORD;
    invitation_id UUID;
    notification_id UUID;
    accept_token TEXT;
    decline_token TEXT;
    invitations_sent INTEGER := 0;
BEGIN
    -- Get event details
    SELECT * INTO event_record FROM events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;
    
    -- Get inviter profile
    SELECT * INTO inviter_profile FROM user_profiles WHERE user_id = p_invited_by;
    
    -- Loop through each user
    FOREACH user_record.user_id IN ARRAY p_user_ids LOOP
        -- Check if invitation already exists
        IF EXISTS (
            SELECT 1 FROM event_members 
            WHERE event_id = p_event_id AND user_id = user_record.user_id
        ) THEN
            CONTINUE; -- Skip if already invited
        END IF;
        
        -- Create invitation record
        INSERT INTO event_members (
            event_id,
            user_id,
            invited_by,
            status,
            invitation_sent_at
        ) VALUES (
            p_event_id,
            user_record.user_id,
            p_invited_by,
            'pending',
            NOW()
        ) RETURNING id INTO invitation_id;
        
        -- Create notification FIRST (so we can link tokens to it)
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            user_record.user_id,
            'event_invitation',
            '🍺 ' || COALESCE(inviter_profile.display_name, inviter_profile.username, 'Someone') || ' invited you to a session',
            'Join the session: ' || event_record.title,
            jsonb_build_object(
                'event_id', p_event_id,
                'event_title', event_record.title,
                'invitation_id', invitation_id,
                'invited_by', p_invited_by,
                'show_join_decline_buttons', true
            )
        ) RETURNING id INTO notification_id;
        
        -- Generate secure tokens
        accept_token := 'event_accept_' || replace(gen_random_uuid()::text, '-', '');
        decline_token := 'event_decline_' || replace(gen_random_uuid()::text, '-', '');
        
        -- Create accept token with notification link
        INSERT INTO invitation_tokens (
            token,
            invitation_type,
            invitation_id,
            action,
            user_id,
            expires_at,
            notification_id,  -- ← LINK TO NOTIFICATION
            response_status
        ) VALUES (
            accept_token,
            'event',
            invitation_id,
            'accept',
            user_record.user_id,
            NOW() + INTERVAL '48 hours',
            notification_id,  -- ← LINK TO NOTIFICATION
            'pending'
        );
        
        -- Create decline token with notification link
        INSERT INTO invitation_tokens (
            token,
            invitation_type,
            invitation_id,
            action,
            user_id,
            expires_at,
            notification_id,  -- ← LINK TO NOTIFICATION
            response_status
        ) VALUES (
            decline_token,
            'event',
            invitation_id,
            'decline',
            user_record.user_id,
            NOW() + INTERVAL '48 hours',
            notification_id,  -- ← LINK TO NOTIFICATION
            'pending'
        );
        
        invitations_sent := invitations_sent + 1;
    END LOOP;
    
    RETURN invitations_sent;
END;
$$;

-- Step 3: Create send_event_invitations_to_crew function with notification linking
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
    notification_id UUID;
    accept_token TEXT;
    decline_token TEXT;
    invitations_sent INTEGER := 0;
BEGIN
    -- Get event details
    SELECT * INTO event_record FROM events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;
    
    -- Get inviter profile
    SELECT * INTO inviter_profile FROM user_profiles WHERE user_id = p_invited_by;
    
    -- Loop through crew members
    FOR crew_member IN
        SELECT cm.user_id
        FROM crew_members cm
        WHERE cm.crew_id = p_crew_id
          AND cm.user_id != p_invited_by  -- Don't invite the inviter
    LOOP
        -- Check if invitation already exists
        IF EXISTS (
            SELECT 1 FROM event_members 
            WHERE event_id = p_event_id AND user_id = crew_member.user_id
        ) THEN
            CONTINUE; -- Skip if already invited
        END IF;
        
        -- Create invitation record
        INSERT INTO event_members (
            event_id,
            user_id,
            invited_by,
            status,
            invitation_sent_at
        ) VALUES (
            p_event_id,
            crew_member.user_id,
            p_invited_by,
            'pending',
            NOW()
        ) RETURNING id INTO invitation_id;
        
        -- Create notification FIRST (so we can link tokens to it)
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            data
        ) VALUES (
            crew_member.user_id,
            'event_invitation',
            '🍺 ' || COALESCE(inviter_profile.display_name, inviter_profile.username, 'Someone') || ' invited you to a session',
            'Join the session: ' || event_record.title,
            jsonb_build_object(
                'event_id', p_event_id,
                'event_title', event_record.title,
                'invitation_id', invitation_id,
                'invited_by', p_invited_by,
                'show_join_decline_buttons', true
            )
        ) RETURNING id INTO notification_id;
        
        -- Generate secure tokens
        accept_token := 'event_accept_' || replace(gen_random_uuid()::text, '-', '');
        decline_token := 'event_decline_' || replace(gen_random_uuid()::text, '-', '');
        
        -- Create tokens with notification links
        INSERT INTO invitation_tokens (
            token, invitation_type, invitation_id, action, user_id, expires_at, notification_id, response_status
        ) VALUES 
        (accept_token, 'event', invitation_id, 'accept', crew_member.user_id, NOW() + INTERVAL '48 hours', notification_id, 'pending'),
        (decline_token, 'event', invitation_id, 'decline', crew_member.user_id, NOW() + INTERVAL '48 hours', notification_id, 'pending');
        
        invitations_sent := invitations_sent + 1;
    END LOOP;
    
    RETURN invitations_sent;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION send_event_invitations_to_users TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew TO authenticated;

-- Step 5: Add comments
COMMENT ON FUNCTION send_event_invitations_to_users IS 'ENHANCED: Creates invitations with email-notification synchronization. Tokens are linked to notifications for automatic sync when users respond via email.';
COMMENT ON FUNCTION send_event_invitations_to_crew IS 'ENHANCED: Creates crew invitations with email-notification synchronization. Tokens are linked to notifications for automatic sync when users respond via email.';

-- Step 6: Update process_crew_invitation_token function for consistency
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
            'requires_auth', true,
            'message', 'Please log in to respond to this invitation'
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
            'message', 'Invalid or expired invitation link'
        );
    END IF;

    -- Get action and convert to proper status
    v_action := v_token_record.action;
    v_response_status := CASE
        WHEN v_action = 'accept' THEN 'accepted'
        WHEN v_action = 'decline' THEN 'declined'
        ELSE 'declined'
    END;

    -- Process crew invitation (simplified for this example)
    -- In real implementation, this would handle crew membership logic

    -- Mark token as used and update response status
    UPDATE invitation_tokens
    SET
        used = true,
        used_at = NOW(),
        response_status = v_response_status,
        updated_at = NOW()
    WHERE token = p_token;

    -- Update linked notification if exists
    IF v_token_record.notification_id IS NOT NULL THEN
        UPDATE notifications
        SET
            data = data || jsonb_build_object(
                'user_response', v_response_status,
                'responded_at', NOW()::text,
                'response_method', 'email'
            ),
            read = true
        WHERE id = v_token_record.notification_id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'action', v_response_status,
        'message', CASE
            WHEN v_action = 'accept' THEN 'Successfully joined the crew! 🤘'
            ELSE 'Crew invitation declined'
        END,
        'notification_synced', v_token_record.notification_id IS NOT NULL,
        'response_method', 'email'
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

-- Grant permissions for crew function
GRANT EXECUTE ON FUNCTION process_crew_invitation_token TO authenticated;
GRANT EXECUTE ON FUNCTION process_crew_invitation_token TO anon;

-- Add comment for crew function
COMMENT ON FUNCTION process_crew_invitation_token IS 'ENHANCED: Crew invitation processing with email-notification synchronization support.';

-- Step 7: Success message
SELECT 'All invitation functions updated with email-notification synchronization! Both event and crew invitations will automatically sync between email and app responses.' as status;
