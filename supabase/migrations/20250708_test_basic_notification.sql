-- TEST: Can we create notifications at all?

-- 1. Check if we can see existing notifications
SELECT COUNT(*) as existing_notifications FROM notifications;

-- 2. Get a user ID to test with
SELECT user_id, display_name FROM user_profiles LIMIT 1;

-- 3. Try to insert a simple notification manually
INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
) VALUES (
    (SELECT user_id FROM user_profiles LIMIT 1),
    'event_invitation',
    'Manual test notification',
    'Testing if we can create notifications at all',
    '{"manual_test": true}'::jsonb
);

-- 4. Check if the notification was created
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    created_at
FROM notifications 
WHERE title = 'Manual test notification'
ORDER BY created_at DESC;

-- 5. Check total notifications after insert
SELECT COUNT(*) as total_notifications_after_insert FROM notifications;

SELECT 'Manual notification test complete' as status;
