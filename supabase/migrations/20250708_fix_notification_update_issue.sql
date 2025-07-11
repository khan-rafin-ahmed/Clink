-- FIX: Notification update issue - ensure email responses update original notifications
-- The issue is that the database function isn't updating the original invitation notification

-- Update the respond_to_event_invitation function to ALSO update the original notification
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
  
  -- CRITICAL: Update the original invitation notification to show response
  UPDATE notifications
  SET data = data || jsonb_build_object(
    'user_response', p_response,
    'responded_at', NOW()::text
  )
  WHERE user_id = p_user_id
    AND type = 'event_invitation'
    AND data->>'invitation_id' = p_invitation_id::text;
  
  -- Also try to update by event_id if invitation_id doesn't match
  UPDATE notifications
  SET data = data || jsonb_build_object(
    'user_response', p_response,
    'responded_at', NOW()::text
  )
  WHERE user_id = p_user_id
    AND type = 'event_invitation'
    AND data->>'event_id' = invitation_record.event_id::text
    AND (data->>'user_response' IS NULL OR data->>'user_response' = '');
  
  RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION respond_to_event_invitation TO authenticated;

-- Test the notification update logic
SELECT 
    'Testing notification update - checking recent invitations:' as info,
    id,
    user_id,
    LEFT(title, 40) as title_preview,
    data->>'invitation_id' as invitation_id,
    data->>'user_response' as user_response,
    data->>'responded_at' as responded_at
FROM notifications 
WHERE type = 'event_invitation'
AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 5;

SELECT 'Notification update function enhanced - should now update original invitations!' as status;
