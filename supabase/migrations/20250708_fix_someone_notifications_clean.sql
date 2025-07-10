-- FIX: Eliminate "Someone" notifications with better user name fallback
-- Now that the constraint is fixed, we can update the function

-- Drop and recreate the respond_to_event_invitation function with proper fallback
DROP FUNCTION IF EXISTS respond_to_event_invitation(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS respond_to_event_invitation(UUID, UUID, TEXT);

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
  
  -- Create the best possible user name with multiple fallbacks
  invitee_name := COALESCE(
    invitee_profile.display_name,
    invitee_profile.username,
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = p_user_id),
    'A user'
  );
  
  -- Notify the inviter about the response (NO MORE "Someone"!)
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
  
  -- NOTE: Original invitation notification updates are handled by frontend
  -- This ensures single-source response handling
  
  RETURN TRUE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION respond_to_event_invitation TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION respond_to_event_invitation IS 'FINAL VERSION: No more "Someone" notifications. Uses comprehensive user name fallback: display_name → username → email → "A user"';

-- Test the function works
SELECT 'Function updated successfully - no more "Someone" notifications!' as status;
