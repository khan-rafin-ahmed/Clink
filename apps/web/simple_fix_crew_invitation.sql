-- Simple Fix for Crew Invitation RPC Function
-- This fixes the "column ei.user_id does not exist" error

-- ============================================================================
-- STEP 1: Drop existing functions completely
-- ============================================================================

-- Drop all variations of the functions
DROP FUNCTION IF EXISTS send_event_invitations_to_crew(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS respond_to_event_invitation(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS respond_to_event_invitation(uuid, uuid, text);
DROP FUNCTION IF EXISTS get_user_pending_event_invitations(uuid);

-- ============================================================================
-- STEP 2: Create the corrected send_event_invitations_to_crew function
-- ============================================================================

CREATE OR REPLACE FUNCTION send_event_invitations_to_crew(
  p_event_id UUID,
  p_crew_id UUID,
  p_inviter_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invited_count INTEGER := 0;
  v_crew_member RECORD;
  v_result JSON;
BEGIN
  -- Validate that the event exists
  IF NOT EXISTS (SELECT 1 FROM events WHERE id = p_event_id) THEN
    RETURN json_build_object('success', false, 'error', 'Event not found');
  END IF;
  
  -- Validate that the crew exists
  IF NOT EXISTS (SELECT 1 FROM crews WHERE id = p_crew_id) THEN
    RETURN json_build_object('success', false, 'error', 'Crew not found');
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
  
  -- Return the result as JSON
  v_result := json_build_object(
    'success', true,
    'invited_count', v_invited_count,
    'message', CASE 
      WHEN v_invited_count > 0 THEN 
        'Invitations sent to ' || v_invited_count || ' crew member' || 
        CASE WHEN v_invited_count > 1 THEN 's' ELSE '' END
      ELSE 
        'No new invitations sent (all crew members already invited or joined)'
    END
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew(UUID, UUID, UUID) TO service_role;

-- ============================================================================
-- STEP 3: Create simple respond function
-- ============================================================================

CREATE OR REPLACE FUNCTION respond_to_event_invitation(
  p_invitation_id UUID,
  p_user_id UUID,
  p_response TEXT,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Validate response
  IF p_response NOT IN ('accepted', 'declined') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid response');
  END IF;
  
  -- Get the invitation
  SELECT * INTO v_invitation
  FROM event_members
  WHERE id = p_invitation_id
    AND user_id = p_user_id
    AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invitation not found');
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
  RETURN json_build_object(
    'success', true,
    'message', 'Invitation ' || p_response || ' successfully'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION respond_to_event_invitation(UUID, UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

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
END $$;
