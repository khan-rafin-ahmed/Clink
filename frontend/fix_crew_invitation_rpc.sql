-- Fix Crew Invitation RPC Function
-- This fixes the "column ei.user_id does not exist" error

-- ============================================================================
-- DROP AND RECREATE THE CORRECT RPC FUNCTION
-- ============================================================================

-- Drop all existing functions if they exist
DROP FUNCTION IF EXISTS send_event_invitations_to_crew(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS respond_to_event_invitation(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS respond_to_event_invitation(uuid, uuid, text);
DROP FUNCTION IF EXISTS get_user_pending_event_invitations(uuid);

-- Create the corrected function using event_members table (not event_invitations)
CREATE OR REPLACE FUNCTION send_event_invitations_to_crew(
  p_event_id UUID,
  p_crew_id UUID,
  p_inviter_id UUID
)
RETURNS TABLE (
  invited_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invited_count INTEGER := 0;
  v_crew_member RECORD;
BEGIN
  -- Validate that the event exists
  IF NOT EXISTS (SELECT 1 FROM events WHERE id = p_event_id) THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  -- Validate that the crew exists
  IF NOT EXISTS (SELECT 1 FROM crews WHERE id = p_crew_id) THEN
    RAISE EXCEPTION 'Crew not found';
  END IF;
  
  -- Validate that the inviter is the event creator or has permission
  IF NOT EXISTS (
    SELECT 1 FROM events 
    WHERE id = p_event_id 
    AND created_by = p_inviter_id
  ) THEN
    RAISE EXCEPTION 'Only event creator can send invitations';
  END IF;
  
  -- Loop through crew members and create invitations
  FOR v_crew_member IN 
    SELECT cm.user_id
    FROM crew_members cm
    WHERE cm.crew_id = p_crew_id 
      AND cm.status = 'accepted'
      AND cm.user_id != p_inviter_id  -- Don't invite the inviter
  LOOP
    -- Check if user is already invited or joined
    IF NOT EXISTS (
      SELECT 1 FROM event_members em
      WHERE em.event_id = p_event_id 
        AND em.user_id = v_crew_member.user_id
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
        v_crew_member.user_id,
        p_inviter_id,
        'pending',
        NOW()
      );
      
      v_invited_count := v_invited_count + 1;
    END IF;
  END LOOP;
  
  -- Return the result
  RETURN QUERY SELECT 
    v_invited_count,
    CASE 
      WHEN v_invited_count > 0 THEN 
        'Invitations sent to ' || v_invited_count || ' crew member' || 
        CASE WHEN v_invited_count > 1 THEN 's' ELSE '' END
      ELSE 
        'No new invitations sent (all crew members already invited or joined)'
    END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew(UUID, UUID, UUID) TO service_role;

-- ============================================================================
-- CREATE RESPOND TO EVENT INVITATION FUNCTION
-- ============================================================================

-- Create function to respond to event invitations
CREATE OR REPLACE FUNCTION respond_to_event_invitation(
  p_invitation_id UUID,
  p_user_id UUID,
  p_response TEXT,
  p_comment TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Validate response
  IF p_response NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Invalid response. Must be "accepted" or "declined"';
  END IF;
  
  -- Get the invitation
  SELECT * INTO v_invitation
  FROM event_members
  WHERE id = p_invitation_id
    AND user_id = p_user_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already responded to';
  END IF;
  
  -- Update the invitation
  UPDATE event_members
  SET 
    status = p_response,
    invitation_comment = p_comment,
    invitation_responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_invitation_id;
  
  -- Return success
  RETURN QUERY SELECT 
    TRUE,
    'Invitation ' || p_response || ' successfully';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION respond_to_event_invitation(UUID, UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- CREATE GET USER PENDING INVITATIONS FUNCTION
-- ============================================================================

-- Create function to get user's pending event invitations
CREATE OR REPLACE FUNCTION get_user_pending_event_invitations(p_user_id UUID)
RETURNS TABLE (
  invitation_id UUID,
  event_id UUID,
  event_title TEXT,
  event_date_time TIMESTAMPTZ,
  event_location TEXT,
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
    up.display_name as inviter_name,
    em.invitation_sent_at
  FROM event_members em
  JOIN events e ON em.event_id = e.id
  JOIN user_profiles up ON em.invited_by = up.user_id
  WHERE em.user_id = p_user_id
    AND em.status = 'pending'
    AND e.date_time > NOW()  -- Only future events
  ORDER BY em.invitation_sent_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_pending_event_invitations(UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test that the functions were created successfully
DO $$
BEGIN
  -- Check if functions exist
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'send_event_invitations_to_crew'
  ) THEN
    RAISE NOTICE '✅ send_event_invitations_to_crew function created successfully';
  ELSE
    RAISE NOTICE '❌ send_event_invitations_to_crew function creation failed';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'respond_to_event_invitation'
  ) THEN
    RAISE NOTICE '✅ respond_to_event_invitation function created successfully';
  ELSE
    RAISE NOTICE '❌ respond_to_event_invitation function creation failed';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'get_user_pending_event_invitations'
  ) THEN
    RAISE NOTICE '✅ get_user_pending_event_invitations function created successfully';
  ELSE
    RAISE NOTICE '❌ get_user_pending_event_invitations function creation failed';
  END IF;
END $$;
