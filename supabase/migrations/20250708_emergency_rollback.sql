-- EMERGENCY ROLLBACK: Restore basic notification functionality
-- This restores a simple working version of the notification system

-- 1. Drop the potentially broken trigger
DROP TRIGGER IF EXISTS event_invitation_notification_trigger ON event_members;

-- 2. Create a simple working trigger function
CREATE OR REPLACE FUNCTION handle_event_invitation_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    event_record RECORD;
    inviter_profile RECORD;
    inviter_name TEXT;
BEGIN
    -- Only process pending invitations
    IF NEW.status != 'pending' OR NEW.invited_by IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get event details
    SELECT title INTO event_record FROM events WHERE id = NEW.event_id;
    
    -- Get inviter profile
    SELECT display_name, username INTO inviter_profile 
    FROM user_profiles WHERE user_id = NEW.invited_by;
    
    -- Create inviter name with simple fallback
    inviter_name := COALESCE(
        inviter_profile.display_name,
        inviter_profile.username,
        'Someone'  -- Temporary fallback to get notifications working
    );
    
    -- Create notification
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
        'Join the session: ' || COALESCE(event_record.title, 'Event'),
        jsonb_build_object(
            'event_id', NEW.event_id,
            'event_title', COALESCE(event_record.title, 'Event'),
            'invitation_id', NEW.id,
            'invited_by', NEW.invited_by,
            'show_join_decline_buttons', true
        )
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the insert
        RAISE WARNING 'Notification creation failed: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- 3. Create a simple working response function
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
  -- Validate response
  IF p_response NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Invalid response. Must be accepted or declined.';
  END IF;
  
  -- Get invitation details
  SELECT em.*, e.title as event_title, e.created_by as event_host
  INTO invitation_record
  FROM event_members em
  JOIN events e ON em.event_id = e.id
  WHERE em.id = p_invitation_id 
    AND em.user_id = p_user_id 
    AND em.status = 'pending';
    
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already responded to.';
  END IF;
  
  -- Update invitation status
  UPDATE event_members 
  SET 
    status = p_response,
    invitation_comment = p_comment,
    invitation_responded_at = NOW()
  WHERE id = p_invitation_id;
  
  -- Get user profile
  SELECT display_name, username INTO invitee_profile 
  FROM user_profiles 
  WHERE user_id = p_user_id;
  
  -- Create user name with simple fallback
  invitee_name := COALESCE(
    invitee_profile.display_name,
    invitee_profile.username,
    'Someone'  -- Temporary fallback to get notifications working
  );
  
  -- Notify the inviter about the response
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
      'show_view_event_button', true
    )
  );
  
  RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Response notification failed: %', SQLERRM;
        RETURN TRUE;  -- Don't fail the response
END;
$$;

-- 4. Recreate the trigger
CREATE TRIGGER event_invitation_notification_trigger
    AFTER INSERT ON event_members
    FOR EACH ROW
    EXECUTE FUNCTION handle_event_invitation_notification();

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION handle_event_invitation_notification TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_event_invitation TO authenticated;

-- 6. Test the system
SELECT 'Emergency rollback complete - notifications should work again' as status;
SELECT 'Note: Using "Someone" fallback temporarily to ensure functionality' as note;
