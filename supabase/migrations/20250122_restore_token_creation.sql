-- RESTORE TOKEN CREATION FOR EMAIL ACCEPT/DECLINE BUTTONS
-- The June 2025 migration removed token creation, breaking email buttons
-- This restores the January 2025 version that creates invitation tokens
-- Date: 2025-01-22

-- Drop the current function that doesn't create tokens
DROP FUNCTION IF EXISTS send_event_invitations_to_crew(uuid, uuid, uuid);

-- Restore the token-creating version from January 2025
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
          AND cm.status = 'accepted'
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

-- Also restore the user invitations function with token creation
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
    
    -- Loop through user IDs
    FOR user_record IN
        SELECT unnest(p_user_ids) as user_id
    LOOP
        -- Skip if user is the inviter
        IF user_record.user_id = p_invited_by THEN
            CONTINUE;
        END IF;
        
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
            notification_id,
            response_status
        ) VALUES (
            accept_token,
            'event',
            invitation_id,
            'accept',
            user_record.user_id,
            NOW() + INTERVAL '48 hours',
            notification_id,
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
            notification_id,
            response_status
        ) VALUES (
            decline_token,
            'event',
            invitation_id,
            'decline',
            user_record.user_id,
            NOW() + INTERVAL '48 hours',
            notification_id,
            'pending'
        );
        
        invitations_sent := invitations_sent + 1;
    END LOOP;
    
    RETURN invitations_sent;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitations_to_users TO authenticated;

-- Add comments
COMMENT ON FUNCTION send_event_invitations_to_crew IS 'RESTORED: Creates invitations with email tokens for Accept/Decline buttons. Fixed from June 2025 migration that removed token creation.';
COMMENT ON FUNCTION send_event_invitations_to_users IS 'RESTORED: Creates invitations with email tokens for Accept/Decline buttons. Fixed from June 2025 migration that removed token creation.';

-- Success message
SELECT 'Invitation token creation restored! Email Accept/Decline buttons will now work.' as status;
