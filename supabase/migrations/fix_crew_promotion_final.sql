-- ========================================
-- FINAL FIX FOR CREW PROMOTION NOTIFICATIONS
-- ========================================
--
-- Based on your actual database data, you have these notification types:
-- - crew_invitation (67)
-- - crew_invitation_response (4)
-- - crew_invite_accepted (4)
-- - event_invitation (105)
-- - event_invitation_response (59)
-- - event_rsvp (44)
-- - follow_accepted (9)
-- - follow_request (10)
--
-- This migration adds crew_promotion to work with your existing data
--
-- ========================================

-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint with ALL your existing types plus crew_promotion
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN (
    'crew_invitation',
    'crew_invitation_response',
    'crew_invite_accepted',
    'event_invitation',
    'event_invitation_response',
    'event_rsvp',
    'follow_accepted',
    'follow_request',
    'crew_promotion'
));

-- Verify the constraint was created successfully
SELECT 
    'Constraint created successfully' as status,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Verify all existing notifications are still valid
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ All existing notifications are valid with new constraint'
        ELSE '❌ ' || COUNT(*) || ' notifications would violate the new constraint'
    END as validation_result
FROM notifications 
WHERE type NOT IN (
    'crew_invitation',
    'crew_invitation_response', 
    'crew_invite_accepted',
    'event_invitation',
    'event_invitation_response',
    'event_rsvp',
    'follow_accepted',
    'follow_request',
    'crew_promotion'
);

-- Show final summary of all notification types
SELECT 
    '📊 Final notification type summary' as info,
    type,
    COUNT(*) as count
FROM notifications 
GROUP BY type 
ORDER BY type;
