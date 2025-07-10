-- DIAGNOSTIC: Find all notification types currently in the database
-- Run this first to see what types exist before fixing the constraint

-- 1. Show all distinct notification types currently in your database
SELECT 
    type,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM notifications 
GROUP BY type 
ORDER BY count DESC;

-- 2. Show the current constraint (if any)
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- 3. Show sample notifications for each type
SELECT DISTINCT 
    type,
    title,
    LEFT(message, 50) as message_preview
FROM notifications 
ORDER BY type;

-- 4. Check for any unusual or unexpected types
SELECT 
    type,
    COUNT(*) as count
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
)
GROUP BY type
ORDER BY count DESC;
