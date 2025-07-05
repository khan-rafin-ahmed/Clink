-- ========================================
-- SAFE FIX FOR CREW PROMOTION NOTIFICATIONS
-- ========================================
--
-- This migration safely handles existing notification types
-- and adds crew_promotion without breaking existing data
--
-- ========================================

-- Step 1: Drop the existing constraint and create the new one
DO $$
BEGIN
    -- Drop the existing constraint
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

    -- Create a comprehensive constraint that includes all known types
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

    RAISE NOTICE 'Successfully updated notifications_type_check constraint';
END $$;

-- Step 2: Verify no constraint violations exist
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN 'All notification types are valid'
        ELSE 'WARNING: ' || COUNT(*) || ' rows have invalid notification types'
    END as validation_result
FROM notifications
WHERE type NOT IN (
    'follow_request', 'follow_accepted', 'event_invitation', 'event_update',
    'crew_invitation', 'event_rsvp', 'event_reminder', 'crew_invite_accepted',
    'event_cancelled', 'event_rating_reminder', 'event_invitation_response',
    'crew_invitation_response', 'crew_promotion'
);

-- Step 3: Show any problematic notification types (if any)
SELECT
    'Unrecognized notification type' as issue,
    type,
    COUNT(*) as count
FROM notifications
WHERE type NOT IN (
    'follow_request', 'follow_accepted', 'event_invitation', 'event_update',
    'crew_invitation', 'event_rsvp', 'event_reminder', 'crew_invite_accepted',
    'event_cancelled', 'event_rating_reminder', 'event_invitation_response',
    'crew_invitation_response', 'crew_promotion'
)
GROUP BY type
ORDER BY type;

-- Step 4: Show final constraint definition
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'notifications_type_check';

-- Step 5: Show summary of all notification types
SELECT
    type,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM notifications
GROUP BY type
ORDER BY type;
