-- CLEANUP: Remove old follow notifications and create cleaner constraint
-- Option B: Delete legacy follow notifications and exclude them from constraint

-- Step 1: Show what we're about to delete
SELECT 
    'Before cleanup:' as status,
    type,
    COUNT(*) as count
FROM notifications 
WHERE type IN ('follow_request', 'follow_accepted')
GROUP BY type;

-- Step 2: Delete all old follow notifications (since you don't use this feature)
DELETE FROM notifications 
WHERE type IN ('follow_request', 'follow_accepted');

-- Step 3: Show deletion completed
SELECT 'Deleted follow notifications' as status;

-- Step 4: Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Step 5: Create the clean constraint without follow types
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
    'crew_join'
));

-- Step 6: Verify the cleanup worked
SELECT 
    'After cleanup:' as status,
    type,
    COUNT(*) as count
FROM notifications 
GROUP BY type 
ORDER BY count DESC;

-- Step 7: Verify no follow notifications remain
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All follow notifications successfully removed'
        ELSE '❌ Some follow notifications still exist'
    END as cleanup_status
FROM notifications 
WHERE type IN ('follow_request', 'follow_accepted');

-- Step 8: Show final constraint
SELECT 
    'Final constraint:' as status,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

COMMENT ON CONSTRAINT notifications_type_check ON notifications IS 'Clean constraint without legacy follow types - follow notifications removed 2025-07-08';
