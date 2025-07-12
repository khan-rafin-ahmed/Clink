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

-- Step 8: Test message
SELECT 'Notification system fixed! Eliminated duplicate notifications and fixed user data issues.' as status;
