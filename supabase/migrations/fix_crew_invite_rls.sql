-- ========================================
-- FIX CREW INVITATION NOTIFICATION ERROR
-- ========================================
--
-- PROBLEM: "new row violates check constraint notifications_type_check"
-- SOLUTION: Add 'crew_invitation' to allowed notification types
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your Thirstee project
-- 3. Go to SQL Editor
-- 4. Copy and paste the SQL below
-- 5. Click "Run" to execute
-- 6. Test crew invitations - they should work now!
--
-- ========================================

-- Add 'crew_invitation' to the allowed notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN ('follow_request', 'follow_accepted', 'event_invitation', 'event_update', 'crew_invitation'));

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can join crews when invited" ON crew_members;

-- Create new policy that allows:
-- 1. Users to join crews themselves (for invite links)
-- 2. Crew creators to invite others
CREATE POLICY "Users can join crews or be invited by creators" ON crew_members
FOR INSERT WITH CHECK (
  -- User can add themselves (for invite links)
  user_id = auth.uid()
  OR
  -- Crew creator can invite others
  EXISTS (
    SELECT 1 FROM crews
    WHERE id = crew_members.crew_id
    AND created_by = auth.uid()
  )
);

-- Fix the notification trigger function to handle missing notifications table
CREATE OR REPLACE FUNCTION handle_crew_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
  crew_name TEXT;
  inviter_name TEXT;
  notifications_exists BOOLEAN;
BEGIN
  -- Check if notifications table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'notifications'
  ) INTO notifications_exists;

  -- Only create notification if table exists
  IF notifications_exists THEN
    -- Get crew name
    SELECT name INTO crew_name
    FROM crews
    WHERE id = NEW.crew_id;

    -- Get inviter's display name
    SELECT COALESCE(display_name, 'Someone') INTO inviter_name
    FROM user_profiles
    WHERE user_id = NEW.invited_by;

    -- Check if create_notification function exists and create notification
    IF EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_name = 'create_notification'
    ) THEN
      PERFORM create_notification(
        NEW.user_id,
        'crew_invitation',
        'New Crew Invitation',
        inviter_name || ' invited you to join "' || crew_name || '" crew',
        jsonb_build_object('crew_id', NEW.crew_id, 'crew_member_id', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- VERIFICATION
-- ========================================
-- After running this, you should be able to:
-- ✅ Invite users to crews you created
-- ✅ Use bulk invite functionality
-- ✅ Join crews via invite links
-- ✅ No more "row violates row-level security policy" errors
-- ========================================
