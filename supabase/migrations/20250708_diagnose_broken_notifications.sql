-- URGENT DIAGNOSTIC: Find out why notifications stopped working entirely

-- 1. Check if the trigger is working
SELECT 
    'Trigger status:' as info,
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'event_invitation_notification_trigger';

-- 2. Check if the trigger function exists and works
SELECT 
    'Trigger function status:' as info,
    routine_name,
    routine_type,
    CASE 
        WHEN routine_definition IS NOT NULL THEN 'Function exists'
        ELSE 'Function missing'
    END as status
FROM information_schema.routines 
WHERE routine_name = 'handle_event_invitation_notification';

-- 3. Test creating a simple notification manually
INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data
) VALUES (
    (SELECT user_id FROM user_profiles LIMIT 1),
    'event_invitation',
    'Test notification',
    'Testing if notifications work at all',
    jsonb_build_object('test', true)
);

-- 4. Check recent event_members inserts (should trigger notifications)
SELECT 
    'Recent event member inserts:' as info,
    id,
    event_id,
    user_id,
    invited_by,
    status,
    created_at
FROM event_members 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check recent notifications (should show if any are being created)
SELECT 
    'Recent notifications:' as info,
    id,
    user_id,
    type,
    title,
    created_at
FROM notifications 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check if there are any errors in the trigger function
DO $$
BEGIN
    -- Try to manually call the trigger function
    PERFORM handle_event_invitation_notification();
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Trigger function error: %', SQLERRM;
END $$;

-- 7. Check if email functions exist
SELECT 
    'Email functions status:' as info,
    routine_name,
    CASE 
        WHEN routine_definition IS NOT NULL THEN 'Exists'
        ELSE 'Missing'
    END as status
FROM information_schema.routines 
WHERE routine_name IN (
    'send_event_invitation_emails',
    'send_event_invitations_to_crew'
)
ORDER BY routine_name;

-- Clean up the test notification
DELETE FROM notifications WHERE title = 'Test notification' AND data->>'test' = 'true';

SELECT 'Diagnostic complete - check results above' as status;
