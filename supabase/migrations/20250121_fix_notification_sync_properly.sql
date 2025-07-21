-- PROPER FIX: Email-Notification Synchronization without breaking existing system
-- Integrates with existing trigger system instead of replacing it
-- Date: 2025-01-21

-- Step 1: Drop the conflicting functions that create duplicate notifications
DROP FUNCTION IF EXISTS send_event_invitations_to_users(uuid, uuid[], uuid);
DROP FUNCTION IF EXISTS send_event_invitations_to_crew(uuid, uuid, uuid);

-- Step 2: Update the existing trigger function to support notification linking
CREATE OR REPLACE FUNCTION handle_event_invitation_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    event_record RECORD;
    inviter_profile RECORD;
    inviter_name TEXT;
    notification_id UUID;
    accept_token TEXT;
    decline_token TEXT;
BEGIN
    -- Only process pending invitations
    IF NEW.status != 'pending' OR NEW.invited_by IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get event details
    SELECT * INTO event_record FROM events WHERE id = NEW.event_id;

    -- Get inviter profile with proper fallback
    SELECT display_name, username INTO inviter_profile
    FROM user_profiles WHERE user_id = NEW.invited_by;

    -- Create inviter name (NO MORE "Someone"!)
    inviter_name := COALESCE(
        inviter_profile.display_name,
        inviter_profile.username,
        (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = NEW.invited_by),
        'A user'
    );

    -- Create notification FIRST (so we can link tokens to it)
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
    ) VALUES (
        NEW.user_id,
        'event_invitation',
        '🍺 ' || inviter_name || ' invited you to a session',
        'Join the session: ' || event_record.title,
        jsonb_build_object(
            'event_id', NEW.event_id,
            'event_title', event_record.title,
            'invitation_id', NEW.id,
            'invited_by', NEW.invited_by,
            'show_join_decline_buttons', true
        )
    ) RETURNING id INTO notification_id;

    -- Generate secure tokens and link them to the notification
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
        NEW.id,
        'accept',
        NEW.user_id,
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
        NEW.id,
        'decline',
        NEW.user_id,
        NOW() + INTERVAL '48 hours',
        notification_id,  -- ← LINK TO NOTIFICATION
        'pending'
    );

    -- Note: Email sending is handled separately by the frontend service
    -- The trigger only creates notifications and tokens for email-notification synchronization

    RETURN NEW;
END;
$$;

-- Step 3: Recreate the original invitation functions WITHOUT notification creation
-- (Let the trigger handle notifications)
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
    invitation_id UUID;
    invitations_sent INTEGER := 0;
BEGIN
    -- Loop through each user
    FOREACH user_record.user_id IN ARRAY p_user_ids LOOP
        -- Check if invitation already exists
        IF EXISTS (
            SELECT 1 FROM event_members 
            WHERE event_id = p_event_id AND user_id = user_record.user_id
        ) THEN
            CONTINUE; -- Skip if already invited
        END IF;
        
        -- Create invitation record (trigger will handle notification + tokens)
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
        );
        
        invitations_sent := invitations_sent + 1;
    END LOOP;
    
    RETURN invitations_sent;
END;
$$;

-- Step 4: Recreate crew invitation function WITHOUT notification creation
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
    invitations_sent INTEGER := 0;
BEGIN
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
        
        -- Create invitation record (trigger will handle notification + tokens)
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
        );
        
        invitations_sent := invitations_sent + 1;
    END LOOP;
    
    RETURN invitations_sent;
END;
$$;

-- Step 5: Ensure the trigger is active
DROP TRIGGER IF EXISTS event_invitation_notification_trigger ON event_members;
CREATE TRIGGER event_invitation_notification_trigger
    AFTER INSERT ON event_members
    FOR EACH ROW
    WHEN (NEW.status = 'pending' AND NEW.invited_by IS NOT NULL)
    EXECUTE FUNCTION handle_event_invitation_notification();

-- Step 6: Grant permissions
GRANT EXECUTE ON FUNCTION handle_event_invitation_notification TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitations_to_users TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew TO authenticated;

-- Step 7: Add comments
COMMENT ON FUNCTION handle_event_invitation_notification IS 'ENHANCED TRIGGER: Creates notifications with email-notification synchronization. Automatically links invitation tokens to notifications for email-app sync.';
COMMENT ON FUNCTION send_event_invitations_to_users IS 'SIMPLIFIED: Creates invitations only. Notifications and tokens are handled by trigger system.';
COMMENT ON FUNCTION send_event_invitations_to_crew IS 'SIMPLIFIED: Creates crew invitations only. Notifications and tokens are handled by trigger system.';

-- Step 8: Success message
SELECT 'Email-notification synchronization integrated with existing trigger system! Notifications and email tokens will be created automatically.' as status;
