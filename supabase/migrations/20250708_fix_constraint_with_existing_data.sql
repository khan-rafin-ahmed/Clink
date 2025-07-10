-- FIX: Handle existing follow notifications and update constraint
-- This migration safely handles the existing follow_request and follow_accepted notifications

-- Step 1: Drop the existing constraint first
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 2: Create the correct constraint that includes the existing follow types
-- (even though you don't use them anymore, they exist in your database)
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
    'crew_join',
    'follow_request',      -- ← Keep these because they exist in your DB
    'follow_accepted'      -- ← Keep these because they exist in your DB
));

-- Step 3: Verify the constraint works with existing data
SELECT 
    'Constraint updated successfully' as status,
    COUNT(*) as total_notifications
FROM notifications;

-- Step 4: Show breakdown of notification types
SELECT 
    type,
    COUNT(*) as count
FROM notifications 
GROUP BY type 
ORDER BY count DESC;

-- Step 5: Optional - Mark old follow notifications as read (since you don't use this feature)
-- Uncomment the next line if you want to mark all follow notifications as read
-- UPDATE notifications SET read = true WHERE type IN ('follow_request', 'follow_accepted');

COMMENT ON CONSTRAINT notifications_type_check ON notifications IS 'Includes legacy follow types for existing data compatibility';
