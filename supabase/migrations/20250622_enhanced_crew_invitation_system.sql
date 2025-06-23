-- Enhanced Crew Invitation System
-- This migration modifies the event creation flow to send invitations instead of auto-adding crew members

-- Add comment field to event_members table for invitation responses
ALTER TABLE event_members 
ADD COLUMN IF NOT EXISTS invitation_comment TEXT;

-- Add invitation_sent_at timestamp
ALTER TABLE event_members 
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ DEFAULT NOW();

-- Add invitation_responded_at timestamp
ALTER TABLE event_members 
ADD COLUMN IF NOT EXISTS invitation_responded_at TIMESTAMPTZ;

-- Update the status check constraint to ensure proper invitation flow
ALTER TABLE event_members DROP CONSTRAINT IF EXISTS event_members_status_check;
ALTER TABLE event_members ADD CONSTRAINT event_members_status_check 
CHECK (status IN ('pending', 'accepted', 'declined'));

-- Create index for better performance on invitation queries
CREATE INDEX IF NOT EXISTS idx_event_members_status_pending ON event_members (status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_event_members_invitation_sent ON event_members (invitation_sent_at);

-- Add notification types for event invitations
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN (
    'follow_request', 'follow_accepted', 'event_invitation', 'event_update', 
    'crew_invitation', 'event_rsvp', 'event_reminder', 'crew_invite_accepted', 
    'event_cancelled', 'event_rating_reminder', 'event_invitation_response'
));

-- Function to send event invitations to crew members
CREATE OR REPLACE FUNCTION send_event_invitations_to_crew(
  p_event_id UUID,
  p_crew_id UUID,
  p_inviter_id UUID
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
BEGIN
  -- Get all accepted crew members (excluding the inviter)
  FOR member_record IN 
    SELECT cm.user_id, up.display_name
    FROM crew_members cm
    JOIN user_profiles up ON cm.user_id = up.user_id
    WHERE cm.crew_id = p_crew_id 
      AND cm.status = 'accepted'
      AND cm.user_id != p_inviter_id
  LOOP
    -- Create event invitation
    INSERT INTO event_members (
      event_id, 
      user_id, 
      invited_by, 
      status, 
      invitation_sent_at
    ) VALUES (
      p_event_id,
      member_record.user_id,
      p_inviter_id,
      'pending',
      NOW()
    ) RETURNING id INTO invitation_id;
    
    -- Add to results
    invited_count := invited_count + 1;
    invitation_ids := array_append(invitation_ids, invitation_id);
    
    -- Create notification for the invited user
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      member_record.user_id,
      'event_invitation',
      '🍺 You''re invited to a session!',
      'Your crew member invited you to join their drinking session',
      jsonb_build_object(
        'event_id', p_event_id,
        'inviter_id', p_inviter_id,
        'invitation_id', invitation_id
      )
    );
  END LOOP;
  
  RETURN QUERY SELECT invited_count, invitation_ids;
END;
$$;

-- Function to respond to event invitation
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

-- Function to get pending event invitations for a user
CREATE OR REPLACE FUNCTION get_user_pending_event_invitations(p_user_id UUID)
RETURNS TABLE (
  invitation_id UUID,
  event_id UUID,
  event_title TEXT,
  event_date_time TIMESTAMPTZ,
  event_location TEXT,
  inviter_id UUID,
  inviter_name TEXT,
  invitation_sent_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    em.id as invitation_id,
    e.id as event_id,
    e.title as event_title,
    e.date_time as event_date_time,
    e.location as event_location,
    em.invited_by as inviter_id,
    up.display_name as inviter_name,
    em.invitation_sent_at
  FROM event_members em
  JOIN events e ON em.event_id = e.id
  JOIN user_profiles up ON em.invited_by = up.user_id
  WHERE em.user_id = p_user_id 
    AND em.status = 'pending'
    AND e.date_time > NOW() -- Only future events
  ORDER BY em.invitation_sent_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_event_invitation(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_pending_event_invitations(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION send_event_invitations_to_crew IS 'Send event invitations to all crew members when creating an event';
COMMENT ON FUNCTION respond_to_event_invitation IS 'Allow users to accept or decline event invitations with optional comments';
COMMENT ON FUNCTION get_user_pending_event_invitations IS 'Get all pending event invitations for a user';

-- Add RLS policies for event_members invitation system
DROP POLICY IF EXISTS "Users can view their own event invitations" ON event_members;
CREATE POLICY "Users can view their own event invitations" ON event_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    invited_by = auth.uid() OR
    event_id IN (
      SELECT id FROM events WHERE created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can respond to their own invitations" ON event_members;
CREATE POLICY "Users can respond to their own invitations" ON event_members
  FOR UPDATE USING (user_id = auth.uid());
