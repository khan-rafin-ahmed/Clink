-- ========================================
-- FIX CREW PROMOTION NOTIFICATION ERROR
-- ========================================
--
-- PROBLEM: "new row violates check constraint notifications_type_check"
-- CAUSE: 'crew_promotion' notification type is not included in the constraint
-- SOLUTION: Add 'crew_promotion' to allowed notification types
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your Thirstee project
-- 3. Go to SQL Editor
-- 4. Copy and paste the SQL below
-- 5. Click "Run" to execute
-- 6. Test crew member promotion - notifications should work now!
--
-- ========================================

-- First, let's see what notification types currently exist in the database
SELECT DISTINCT type, COUNT(*) as count
FROM notifications
GROUP BY type
ORDER BY type;

-- Drop the existing constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add the updated constraint with all existing types plus crew_promotion
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

-- Verify the constraint was updated
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'notifications_type_check';
