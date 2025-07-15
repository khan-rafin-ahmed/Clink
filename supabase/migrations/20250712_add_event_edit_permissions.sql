-- Add missing event edit permission functions
-- This migration creates the missing can_user_edit_event and get_user_event_role functions

-- First, ensure event_members table has the role column
ALTER TABLE event_members 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'attendee' 
CHECK (role IN ('attendee', 'co_host', 'host'));

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_event_members_role ON event_members(event_id, user_id, role);

-- Function to get user's role in an event
CREATE OR REPLACE FUNCTION get_user_event_role(
  p_event_id UUID,
  p_user_id UUID
) RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check if user is the event creator (host)
  SELECT 'host' INTO user_role
  FROM events 
  WHERE id = p_event_id AND created_by = p_user_id;
  
  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;
  
  -- Check if user has a role in event_members table
  SELECT role INTO user_role
  FROM event_members 
  WHERE event_id = p_event_id 
    AND user_id = p_user_id 
    AND status = 'accepted';
  
  -- Return the role or 'none' if not found
  RETURN COALESCE(user_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can edit an event
CREATE OR REPLACE FUNCTION can_user_edit_event(
  p_event_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user's role in the event
  user_role := get_user_event_role(p_event_id, p_user_id);
  
  -- Hosts and co-hosts can edit events
  RETURN user_role IN ('host', 'co_host');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_event_role(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_edit_event(UUID, UUID) TO authenticated;

-- Update RLS policies to allow co-hosts to edit events
-- First drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can update their own events" ON events;
DROP POLICY IF EXISTS "event_hosts_and_cohosts_can_update" ON events;

-- Create new policy that allows hosts and co-hosts to update events
CREATE POLICY "event_hosts_and_cohosts_can_update" ON events
  FOR UPDATE USING (
    -- User is the creator (host)
    created_by = auth.uid()
    OR
    -- User is a co-host
    id IN (
      SELECT event_id FROM event_members 
      WHERE user_id = auth.uid() 
      AND role = 'co_host'
      AND status = 'accepted'
    )
  );

-- Ensure event creators are automatically added as hosts in event_members
-- This function will be called when events are created
CREATE OR REPLACE FUNCTION ensure_event_host_membership()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert the event creator as a host in event_members
  INSERT INTO event_members (event_id, user_id, invited_by, status, role)
  VALUES (NEW.id, NEW.created_by, NEW.created_by, 'accepted', 'host')
  ON CONFLICT (event_id, user_id) DO UPDATE SET
    role = 'host',
    status = 'accepted';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add event creators as hosts
DROP TRIGGER IF EXISTS ensure_event_host_membership_trigger ON events;
CREATE TRIGGER ensure_event_host_membership_trigger
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION ensure_event_host_membership();

-- Drop existing functions if they exist with different signatures
DROP FUNCTION IF EXISTS promote_event_member_to_cohost(UUID, UUID, UUID);
DROP FUNCTION IF EXISTS demote_event_cohost(UUID, UUID, UUID);

-- Function to promote an event member to co-host
CREATE OR REPLACE FUNCTION promote_event_member_to_cohost(
  p_event_id UUID,
  p_user_id UUID,
  p_promoted_by UUID
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if promoter has permission (must be host)
  IF get_user_event_role(p_event_id, p_promoted_by) != 'host' THEN
    RETURN json_build_object('success', false, 'error', 'Only hosts can promote members to co-host');
  END IF;

  -- Check if user is already a member
  IF NOT EXISTS (
    SELECT 1 FROM event_members
    WHERE event_id = p_event_id AND user_id = p_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'User is not a member of this event');
  END IF;

  -- Update user role to co_host
  UPDATE event_members
  SET role = 'co_host', updated_at = NOW()
  WHERE event_id = p_event_id AND user_id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Member promoted to co-host successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to demote a co-host to attendee
CREATE OR REPLACE FUNCTION demote_event_cohost(
  p_event_id UUID,
  p_user_id UUID,
  p_demoted_by UUID
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if demoter has permission (must be host)
  IF get_user_event_role(p_event_id, p_demoted_by) != 'host' THEN
    RETURN json_build_object('success', false, 'error', 'Only hosts can demote co-hosts');
  END IF;

  -- Check if user is actually a co-host
  IF get_user_event_role(p_event_id, p_user_id) != 'co_host' THEN
    RETURN json_build_object('success', false, 'error', 'User is not a co-host of this event');
  END IF;

  -- Update user role to attendee
  UPDATE event_members
  SET role = 'attendee', updated_at = NOW()
  WHERE event_id = p_event_id AND user_id = p_user_id;

  RETURN json_build_object('success', true, 'message', 'Co-host demoted to attendee successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for co-host management functions
GRANT EXECUTE ON FUNCTION promote_event_member_to_cohost(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION demote_event_cohost(UUID, UUID, UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_user_event_role IS 'Get user role in an event (host, co_host, attendee, or none)';
COMMENT ON FUNCTION can_user_edit_event IS 'Check if user can edit an event (hosts and co-hosts only)';
COMMENT ON FUNCTION ensure_event_host_membership IS 'Automatically add event creators as hosts in event_members table';
COMMENT ON FUNCTION promote_event_member_to_cohost IS 'Promote an event member to co-host (hosts only)';
COMMENT ON FUNCTION demote_event_cohost IS 'Demote a co-host to attendee (hosts only)';
