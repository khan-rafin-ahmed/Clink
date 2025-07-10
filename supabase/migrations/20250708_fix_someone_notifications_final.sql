-- FINAL FIX: Eliminate all "Someone" notifications
-- This migration ensures the correct respond_to_event_invitation function is active
-- and fixes any remaining "Someone" fallback patterns

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
  event_record RECORD;
  inviter_profile RECORD;
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
  
  -- Get user profiles for notification with comprehensive fallback
  SELECT display_name, username INTO inviter_profile 
  FROM user_profiles 
  WHERE user_id = invitation_record.invited_by;
  
  SELECT display_name, username INTO invitee_profile 
  FROM user_profiles 
  WHERE user_id = p_user_id;
  
  -- Create the best possible user name with multiple fallbacks
  invitee_name := COALESCE(
    invitee_profile.display_name,
    invitee_profile.username,
    (SELECT email FROM auth.users WHERE id = p_user_id),
    'A user'
  );
  
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
  
  -- NOTE: Original invitation notification updates are handled by frontend updateNotificationState
  -- This ensures single-source response handling and avoids duplicate updates
  
  RETURN TRUE;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION respond_to_event_invitation TO authenticated;

-- CRITICAL: Update the notifications_type_check constraint (removed unused follow types)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN (
    'event_invitation',
    'event_invitation_response',
    'event_update',
    'event_rsvp',
    'event_reminder',
    'event_cancelled',
    'event_rating_reminder',
    'crew_invitation',
    'crew_invitation_response',
    'crew_invite_accepted',
    'crew_promotion',
    'event_promotion',
    'crew_join'
));

-- Add comment for documentation
COMMENT ON FUNCTION respond_to_event_invitation IS 'FINAL VERSION: Process event invitation responses with comprehensive user name fallback. No more "Someone" notifications. Frontend handles notification state updates.';

-- Also ensure the user_profiles table has username column for fallback
DO $$
BEGIN
    -- Check if username column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'username'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN username TEXT;
        
        -- Populate username from email for existing users
        UPDATE user_profiles 
        SET username = split_part(au.email, '@', 1)
        FROM auth.users au 
        WHERE user_profiles.user_id = au.id 
        AND user_profiles.username IS NULL;
    END IF;
END $$;
