-- BASIC DIAGNOSTIC: Check fundamental database state

-- 1. Simple check - do we have any users?
SELECT 'Users check:' as info, COUNT(*) as count FROM user_profiles;

-- 2. Simple check - do we have any notifications?
SELECT 'Notifications check:' as info, COUNT(*) as count FROM notifications;

-- 3. Simple check - do we have any events?
SELECT 'Events check:' as info, COUNT(*) as count FROM events;

-- 4. Check if basic tables exist
SELECT 
    'Tables exist:' as info,
    table_name,
    'exists' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'events', 'event_members', 'user_profiles')
ORDER BY table_name;

-- 5. Check if we can insert a simple notification
BEGIN;
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data
    ) 
    SELECT 
        user_id,
        'event_invitation',
        'Test notification',
        'Testing basic insert',
        '{"test": true}'::jsonb
    FROM user_profiles 
    LIMIT 1;
    
    -- Check if it was inserted
    SELECT 'Test insert result:' as info, COUNT(*) as inserted_count 
    FROM notifications 
    WHERE title = 'Test notification';
    
    -- Clean up
    DELETE FROM notifications WHERE title = 'Test notification';
ROLLBACK;

-- 6. List all functions that contain 'notification'
SELECT 
    'Functions with notification:' as info,
    routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name ILIKE '%notification%'
ORDER BY routine_name;

-- 7. Check if the trigger exists
SELECT 
    'Triggers:' as info,
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

SELECT 'Basic diagnostic complete' as final_status;
