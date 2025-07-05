-- ========================================
-- DIAGNOSTIC: CHECK EXISTING NOTIFICATION TYPES
-- ========================================
--
-- Run this first to see what notification types exist
-- in your database before applying the fix
--
-- ========================================

-- 1. Show all distinct notification types and their counts
SELECT 
    type,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM notifications 
GROUP BY type 
ORDER BY count DESC, type;

-- 2. Show current constraint definition
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'notifications_type_check';

-- 3. Check for any unusual notification types
SELECT DISTINCT type
FROM notifications 
WHERE type NOT IN (
    'follow_request', 
    'follow_accepted', 
    'event_invitation', 
    'event_update', 
    'crew_invitation', 
    'event_rsvp', 
    'event_reminder', 
    'crew_invite_accepted', 
    'event_cancelled', 
    'event_rating_reminder'
)
ORDER BY type;
