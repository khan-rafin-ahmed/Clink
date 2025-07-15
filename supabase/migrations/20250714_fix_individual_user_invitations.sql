-- Fix Individual User Event Invitations
-- This migration creates the missing send_event_invitations_to_users function
-- and ensures individual user invitations work consistently with crew invitations

-- ============================================================================
-- STEP 1: Check current state of invitation functions
-- ============================================================================

-- Check what invitation-related functions currently exist
SELECT 
    routine_name,
    routine_type,
    specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%event%invitation%'
ORDER BY routine_name;

-- Check if the trigger exists and is active
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'event_invitation_notification_trigger';

-- ============================================================================
-- STEP 2: Create the missing send_event_invitations_to_users function
-- ============================================================================

-- Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS send_event_invitations_to_users(UUID, UUID[], UUID);

CREATE OR REPLACE FUNCTION send_event_invitations_to_users(
  p_event_id UUID,
  p_user_ids UUID[],
  p_invited_by UUID
)
RETURNS TABLE (
  invited_count INTEGER,
  invitation_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  invitation_id UUID;
  invited_count INTEGER := 0;
  invitation_ids UUID[] := '{}';
  event_record RECORD;
  inviter_profile RECORD;
  inviter_name TEXT;
BEGIN
  -- Get event details
  SELECT * INTO event_record FROM events WHERE id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found with ID: %', p_event_id;
  END IF;

  -- Get inviter profile with proper fallback
  SELECT display_name, username INTO inviter_profile
  FROM user_profiles WHERE user_id = p_invited_by;

  -- Create inviter name (consistent with crew invitation logic)
  inviter_name := COALESCE(
    inviter_profile.display_name,
    inviter_profile.username,
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = p_invited_by),
    'A user'
  );

  -- Process each user ID
  FOREACH user_id IN ARRAY p_user_ids
  LOOP
    -- Check if user is already invited or joined
    IF NOT EXISTS (
      SELECT 1 FROM event_members em
      WHERE em.event_id = p_event_id
        AND em.user_id = user_id
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
        user_id,
        p_invited_by,
        'pending',
        NOW()
      ) RETURNING id INTO invitation_id;

      -- Add to results
      invited_count := invited_count + 1;
      invitation_ids := array_append(invitation_ids, invitation_id);

      -- Create notification for the invited user (consistent with crew invitations)
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        user_id,
        'event_invitation',
        '🍺 ' || inviter_name || ' invited you to a session',
        'Join the session: ' || event_record.title,
        jsonb_build_object(
          'event_id', p_event_id,
          'event_title', event_record.title,
          'invitation_id', invitation_id,
          'invited_by', p_invited_by,
          'show_join_decline_buttons', true
        )
      );
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT invited_count, invitation_ids;
END;
$$;

-- ============================================================================
-- STEP 3: Grant permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION send_event_invitations_to_users(UUID, UUID[], UUID) TO authenticated;

-- ============================================================================
-- STEP 4: Add documentation
-- ============================================================================

COMMENT ON FUNCTION send_event_invitations_to_users IS 'Send event invitations to individual users with consistent notification creation';

-- ============================================================================
-- STEP 5: Test the function (optional - can be run manually)
-- ============================================================================

-- Uncomment to test with actual data:
-- SELECT * FROM send_event_invitations_to_users(
--   'your-event-id'::UUID,
--   ARRAY['user-id-1'::UUID, 'user-id-2'::UUID],
--   'inviter-user-id'::UUID
-- );
