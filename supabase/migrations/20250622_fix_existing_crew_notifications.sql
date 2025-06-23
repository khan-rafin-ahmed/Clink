-- Fix existing crew invitation notifications
-- This migration marks existing crew invitation notifications as unread
-- so that the accept/decline buttons become visible again

-- Mark all crew invitation notifications as unread if they haven't been responded to
UPDATE notifications
SET read = false
WHERE type = 'crew_invitation'
  AND read = true
  AND data IS NOT NULL
  AND (
    -- Check if the crew invitation is still pending
    EXISTS (
      SELECT 1 FROM crew_members cm
      WHERE cm.crew_id = (notifications.data->>'crew_id')::UUID
        AND cm.user_id = notifications.user_id
        AND cm.status = 'pending'
    )
    OR
    -- Or if there's a crew_member_id in the data and it's still pending
    EXISTS (
      SELECT 1 FROM crew_members cm
      WHERE cm.id = (notifications.data->>'crew_member_id')::UUID
        AND cm.status = 'pending'
    )
  );

-- Also mark event invitation notifications as unread if they're still pending
UPDATE notifications
SET read = false
WHERE type = 'event_invitation'
  AND read = true
  AND data IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM event_members em
    WHERE em.id = (notifications.data->>'invitation_id')::UUID
      AND em.status = 'pending'
  );

-- Add a comment explaining what this migration does
COMMENT ON TABLE notifications IS 'Stores user notifications. Updated to fix existing crew/event invitations that were marked as read but still need user response.';
