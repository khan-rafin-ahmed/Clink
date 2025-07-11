-- COMPREHENSIVE FIX: Fix all notification creation functions
-- This addresses both missing invitation_id and "Someone" notifications

-- 1. Fix the send_event_invitations_to_crew function to include invitation_id
-- Drop existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS send_event_invitations_to_crew(UUID, UUID, UUID);

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
    invitations_sent INTEGER := 0;
BEGIN
    -- Get event details
    SELECT * INTO event_record FROM events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Event not found';
    END IF;
    
    -- Get inviter profile
    SELECT display_name, username INTO inviter_profile 
    FROM user_profiles WHERE user_id = p_invited_by;
    
    -- Loop through crew members
    FOR crew_member IN 
        SELECT cm.user_id, up.display_name, up.username, up.email
        FROM crew_members cm
        JOIN user_profiles up ON cm.user_id = up.user_id
        WHERE cm.crew_id = p_crew_id 
        AND cm.status = 'accepted'
        AND cm.user_id != p_invited_by  -- Don't invite the inviter
    LOOP
        -- Check if already invited
        IF NOT EXISTS (
            SELECT 1 FROM event_members 
            WHERE event_id = p_event_id AND user_id = crew_member.user_id
        ) THEN
            -- Create invitation
            INSERT INTO event_members (event_id, user_id, invited_by, status)
            VALUES (p_event_id, crew_member.user_id, p_invited_by, 'pending')
            RETURNING id INTO invitation_id;
            
            -- Create notification with proper invitation_id
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
                    'invitation_id', invitation_id,  -- ← CRITICAL: Include invitation_id
                    'invited_by', p_invited_by,
                    'show_join_decline_buttons', true
                )
            );
            
            invitations_sent := invitations_sent + 1;
        END IF;
    END LOOP;
    
    RETURN invitations_sent;
END;
$$;

-- 2. Create a function to fix existing notifications that are missing invitation_id
CREATE OR REPLACE FUNCTION fix_missing_invitation_ids()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_record RECORD;
    invitation_record RECORD;
    fixed_count INTEGER := 0;
BEGIN
    -- Find notifications missing invitation_id
    FOR notification_record IN
        SELECT id, user_id, data
        FROM notifications
        WHERE type = 'event_invitation'
        AND (data->>'invitation_id' IS NULL OR data->>'invitation_id' = '')
        AND created_at > NOW() - INTERVAL '7 days'  -- Only recent ones
    LOOP
        -- Try to find the corresponding invitation
        SELECT em.id INTO invitation_record
        FROM event_members em
        WHERE em.user_id = notification_record.user_id
        AND em.event_id = (notification_record.data->>'event_id')::UUID
        AND em.status IN ('pending', 'accepted', 'declined')
        ORDER BY em.created_at DESC
        LIMIT 1;
        
        -- If found, update the notification
        IF invitation_record.id IS NOT NULL THEN
            UPDATE notifications
            SET data = data || jsonb_build_object('invitation_id', invitation_record.id)
            WHERE id = notification_record.id;
            
            fixed_count := fixed_count + 1;
        END IF;
    END LOOP;
    
    RETURN fixed_count;
END;
$$;

-- 3. Fix any other functions that might be creating "Someone" notifications
-- Check if there's a handle_event_invitation_notification function
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_event_invitation_notification'
    ) THEN
        -- Drop and recreate with proper user name handling
        DROP FUNCTION IF EXISTS handle_event_invitation_notification;
        
        CREATE OR REPLACE FUNCTION handle_event_invitation_notification(
            p_event_id UUID,
            p_user_id UUID,
            p_invited_by UUID,
            p_invitation_id UUID
        )
        RETURNS VOID
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        DECLARE
            event_record RECORD;
            inviter_profile RECORD;
        BEGIN
            -- Get event details
            SELECT * INTO event_record FROM events WHERE id = p_event_id;
            
            -- Get inviter profile with proper fallback
            SELECT display_name, username INTO inviter_profile 
            FROM user_profiles WHERE user_id = p_invited_by;
            
            -- Create notification with proper user name and invitation_id
            INSERT INTO notifications (
                user_id,
                type,
                title,
                message,
                data
            ) VALUES (
                p_user_id,
                'event_invitation',
                '🍺 ' || COALESCE(inviter_profile.display_name, inviter_profile.username, 'A user') || ' invited you to a session',
                'Join the session: ' || event_record.title,
                jsonb_build_object(
                    'event_id', p_event_id,
                    'event_title', event_record.title,
                    'invitation_id', p_invitation_id,
                    'invited_by', p_invited_by,
                    'show_join_decline_buttons', true
                )
            );
        END;
        $func$;
    END IF;
END $$;

-- 4. Run the fix for existing notifications
SELECT fix_missing_invitation_ids() as fixed_notifications_count;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew TO authenticated;
GRANT EXECUTE ON FUNCTION fix_missing_invitation_ids TO authenticated;

-- 6. Clean up the fix function (we only need it once)
DROP FUNCTION IF EXISTS fix_missing_invitation_ids;

SELECT 'Invitation notification functions fixed - invitation_id included, proper user names' as status;
