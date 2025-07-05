-- ========================================
-- SIMPLE FIX FOR CREW PROMOTION NOTIFICATIONS
-- ========================================
--
-- Based on your diagnostic results, you have:
-- - crew_invitation_response
-- - event_invitation_response
--
-- This migration adds crew_promotion to the existing types
--
-- ========================================

-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint with all known types including crew_promotion
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN (
    'follow_request', 
    'follow_accepted', 
    'event_invitation', 
    'event_update', 
    'crew_invitation', 
    'event_rsvp', 
    'event_reminder', 
    'crew_invite_accepted', 
    'event_cancelled', 
    'event_rating_reminder',
    'event_invitation_response',
    'crew_invitation_response',
    'crew_promotion'
));

-- Verify the constraint was created successfully
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- Show all notification types to confirm everything is working
SELECT 
    type,
    COUNT(*) as count
FROM notifications 
GROUP BY type 
ORDER BY type;
