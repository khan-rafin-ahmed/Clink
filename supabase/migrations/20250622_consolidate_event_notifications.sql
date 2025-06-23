-- Consolidate Event Invitation Notifications
-- This migration updates the respond_to_event_invitation function to create consolidated notifications
-- that include the event title and a "View Event" button, eliminating duplicate notifications

-- Update the respond_to_event_invitation function with consolidated notification
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
  event_record RECORD;
  inviter_profile RECORD;
  invitee_profile RECORD;
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
  
  -- Get user profiles for notification
  SELECT display_name INTO inviter_profile 
  FROM user_profiles 
  WHERE user_id = invitation_record.invited_by;
  
  SELECT display_name INTO invitee_profile 
  FROM user_profiles 
  WHERE user_id = p_user_id;
  
  -- Notify the inviter about the response (consolidated notification with event title)
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
      WHEN p_response = 'accepted' THEN '🎉 ' || COALESCE(invitee_profile.display_name, 'Someone') || ' accepted your invitation to "' || invitation_record.event_title || '"'
      ELSE '😔 ' || COALESCE(invitee_profile.display_name, 'Someone') || ' declined your invitation to "' || invitation_record.event_title || '"'
    END,
    CASE 
      WHEN p_response = 'accepted' THEN 'They''re ready to raise hell!'
      ELSE 'They won''t be able to make it this time.'
    END || CASE WHEN p_comment IS NOT NULL THEN ' Message: "' || p_comment || '"' ELSE '' END,
    jsonb_build_object(
      'event_id', invitation_record.event_id,
      'event_title', invitation_record.event_title,
      'invitation_id', p_invitation_id,
      'response', p_response,
      'comment', p_comment,
      'show_view_event_button', true
    )
  );
  
  RETURN TRUE;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION respond_to_event_invitation IS 'Allow users to accept or decline event invitations with consolidated notifications that include event title and View Event button';
