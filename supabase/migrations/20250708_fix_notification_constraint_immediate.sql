-- IMMEDIATE FIX: Update notification constraint to match actual usage
-- This fixes the constraint violation error from 20250622_enhanced_crew_invitation_system.sql

-- Drop the problematic constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the correct constraint with only the types you actually use
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

-- Verify the constraint is working
SELECT 
    'Constraint updated successfully' as status,
    COUNT(*) as total_notifications
FROM notifications;

-- Show any notification types that might not be covered (should be empty)
SELECT DISTINCT type as uncovered_types
FROM notifications 
WHERE type NOT IN (
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
);
