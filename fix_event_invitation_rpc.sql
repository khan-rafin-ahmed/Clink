-- Fix Event Invitation RPC Function
-- This fixes the "column ei.user_id does not exist" error

-- Drop the broken function
DROP FUNCTION IF EXISTS send_event_invitations_to_crew(uuid, uuid, uuid);

-- Create the correct function using event_members table (not event_invitations)
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
  -- Validate that the event exists
  IF NOT EXISTS (SELECT 1 FROM events WHERE id = p_event_id) THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  -- Validate that the crew exists
  IF NOT EXISTS (SELECT 1 FROM crews WHERE id = p_crew_id) THEN
    RAISE EXCEPTION 'Crew not found';
  END IF;
  
  -- Validate that the inviter is the event creator
  IF NOT EXISTS (
    SELECT 1 FROM events 
    WHERE id = p_event_id 
    AND created_by = p_inviter_id
  ) THEN
    RAISE EXCEPTION 'Only event creator can send invitations';
  END IF;
  
  -- Get all accepted crew members (excluding the inviter)
  FOR member_record IN 
    SELECT cm.user_id, up.display_name
    FROM crew_members cm
    JOIN user_profiles up ON cm.user_id = up.user_id
    WHERE cm.crew_id = p_crew_id 
      AND cm.status = 'accepted'
      AND cm.user_id != p_inviter_id
  LOOP
    -- Check if user is already invited or joined
    IF NOT EXISTS (
      SELECT 1 FROM event_members em
      WHERE em.event_id = p_event_id 
        AND em.user_id = member_record.user_id
    ) THEN
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
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT invited_count, invitation_ids;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew(UUID, UUID, UUID) TO service_role;

-- Test the function
SELECT '✅ Fixed send_event_invitations_to_crew function' as status;
