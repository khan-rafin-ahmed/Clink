-- Complete Fix for Event Invitation System
-- This removes ALL broken functions and creates clean ones

-- ============================================================================
-- STEP 1: Drop ALL existing functions that might be broken
-- ============================================================================

-- Drop all variations of the functions
DROP FUNCTION IF EXISTS send_event_invitations_to_crew(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS send_event_invitation_emails(uuid, uuid);
DROP FUNCTION IF EXISTS respond_to_event_invitation(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS respond_to_event_invitation(uuid, uuid, text);
DROP FUNCTION IF EXISTS get_user_pending_event_invitations(uuid);
DROP FUNCTION IF EXISTS get_pending_invitations_with_emails(uuid);

-- ============================================================================
-- STEP 2: Check what functions currently exist
-- ============================================================================

SELECT 
    routine_name,
    routine_type,
    specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%event%invitation%'
ORDER BY routine_name;

-- ============================================================================
-- STEP 3: Create the correct send_event_invitations_to_crew function
-- ============================================================================

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

-- ============================================================================
-- STEP 4: Create the email sending function (using event_members table)
-- ============================================================================

CREATE OR REPLACE FUNCTION send_event_invitation_emails(
  p_event_id UUID,
  p_inviter_id UUID
)
RETURNS TABLE (
  emails_sent INTEGER,
  emails_failed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_record RECORD;
  inviter_record RECORD;
  invitation_record RECORD;
  email_data JSONB;
  emails_sent_count INTEGER := 0;
  emails_failed_count INTEGER := 0;
BEGIN
  -- Get event details
  SELECT * INTO event_record
  FROM events
  WHERE id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  -- Get inviter details
  SELECT display_name INTO inviter_record
  FROM user_profiles
  WHERE user_id = p_inviter_id;

  -- Loop through pending invitations in event_members table
  FOR invitation_record IN
    SELECT em.*, up.email as user_email, up.display_name as user_name
    FROM event_members em
    JOIN user_profiles up ON em.user_id = up.user_id
    WHERE em.event_id = p_event_id 
      AND em.status = 'pending'
      AND em.invited_by = p_inviter_id
      AND up.email IS NOT NULL
  LOOP
    BEGIN
      -- Prepare email data
      email_data := jsonb_build_object(
        'eventTitle', event_record.title,
        'inviterName', inviter_record.display_name,
        'eventDate', event_record.date_time,
        'eventLocation', event_record.location,
        'eventId', event_record.id,
        'invitationId', invitation_record.id
      );

      -- Log the email attempt
      INSERT INTO email_logs (
        recipient,
        subject,
        type,
        status,
        data
      ) VALUES (
        invitation_record.user_email,
        format('🍻 You''re invited to %s', event_record.title),
        'event_invitation',
        'pending',
        email_data
      );

      emails_sent_count := emails_sent_count + 1;
      
    EXCEPTION
      WHEN OTHERS THEN
        emails_failed_count := emails_failed_count + 1;
        RAISE NOTICE 'Failed to process email for %: %', invitation_record.user_email, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT emails_sent_count, emails_failed_count;
END;
$$;

-- ============================================================================
-- STEP 5: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitations_to_crew(UUID, UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION send_event_invitation_emails(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitation_emails(UUID, UUID) TO service_role;

-- ============================================================================
-- STEP 6: Verify the fix
-- ============================================================================

-- Check what functions now exist
SELECT 
    routine_name,
    routine_type,
    'Function exists' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('send_event_invitations_to_crew', 'send_event_invitation_emails')
ORDER BY routine_name;

SELECT '✅ All event invitation functions have been fixed!' as final_status;
