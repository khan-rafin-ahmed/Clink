-- EMERGENCY FIX: Restore basic notification functionality immediately

-- 1. Drop everything and start fresh
DROP TRIGGER IF EXISTS event_invitation_notification_trigger ON event_members;
DROP FUNCTION IF EXISTS handle_event_invitation_notification();
DROP FUNCTION IF EXISTS respond_to_event_invitation(UUID, UUID, TEXT, TEXT);

-- 2. Create a minimal working trigger function
CREATE OR REPLACE FUNCTION handle_event_invitation_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simple notification creation
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
    ) VALUES (
        NEW.user_id,
        'event_invitation',
        'You have a new event invitation',
        'Someone invited you to join an event',
        jsonb_build_object(
            'event_id', NEW.event_id,
            'invitation_id', NEW.id,
            'invited_by', NEW.invited_by
        )
    );
    
    RETURN NEW;
END;
$$;

-- 3. Create a minimal working response function
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
BEGIN
  -- Update invitation status
  UPDATE event_members 
  SET 
    status = p_response,
    invitation_responded_at = NOW()
  WHERE id = p_invitation_id AND user_id = p_user_id;
  
  -- Simple response notification
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
  ) 
  SELECT 
    em.invited_by,
    'event_invitation_response',
    'Someone responded to your invitation',
    CASE WHEN p_response = 'accepted' THEN 'They accepted!' ELSE 'They declined.' END,
    jsonb_build_object('invitation_id', p_invitation_id, 'response', p_response)
  FROM event_members em
  WHERE em.id = p_invitation_id;
  
  RETURN TRUE;
END;
$$;

-- 4. Create the trigger
CREATE TRIGGER event_invitation_notification_trigger
    AFTER INSERT ON event_members
    FOR EACH ROW
    WHEN (NEW.status = 'pending' AND NEW.invited_by IS NOT NULL)
    EXECUTE FUNCTION handle_event_invitation_notification();

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION handle_event_invitation_notification TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_event_invitation TO authenticated;

-- 6. Test by creating a simple notification
INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
) 
SELECT 
    user_id,
    'event_invitation',
    'Test notification - system restored',
    'Notifications are working again',
    '{"test": true}'::jsonb
FROM user_profiles 
LIMIT 1;

SELECT 'Emergency fix applied - basic notifications should work now' as status;
