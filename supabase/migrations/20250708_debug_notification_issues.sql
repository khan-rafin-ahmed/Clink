-- DEBUG: Find out why notifications aren't updating and who's creating "Someone" notifications

-- 1. Check the specific Session v11 notifications
SELECT 
    'Session v11 notifications:' as info,
    id,
    user_id,
    type,
    title,
    message,
    data,
    created_at
FROM notifications 
WHERE (title ILIKE '%Session v11%' OR data->>'event_title' ILIKE '%Session v11%')
ORDER BY created_at DESC;

-- 2. Check recent event_invitation_response notifications (the "Someone" ones)
SELECT 
    'Recent response notifications (Someone issue):' as info,
    id,
    user_id,
    type,
    title,
    message,
    data->>'invitation_id' as invitation_id,
    data->>'event_title' as event_title,
    created_at
FROM notifications 
WHERE type = 'event_invitation_response'
AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check if there are multiple respond_to_event_invitation functions
SELECT 
    'Database functions that create notifications:' as info,
    routine_name,
    specific_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_definition ILIKE '%INSERT INTO notifications%'
AND routine_definition ILIKE '%event_invitation%'
ORDER BY routine_name;

-- 4. Check the event_members table for Session v11 to see the actual invitation status
SELECT 
    'Event members for Session v11:' as info,
    em.id as invitation_id,
    em.user_id,
    em.status,
    em.invitation_responded_at,
    e.title as event_title,
    up.display_name,
    up.username
FROM event_members em
JOIN events e ON em.event_id = e.id
JOIN user_profiles up ON em.user_id = up.user_id
WHERE e.title ILIKE '%Session v11%'
ORDER BY em.created_at DESC;

-- 5. Check if the process_event_invitation_token function is being used
SELECT 
    'process_event_invitation_token function:' as info,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'process_event_invitation_token'
AND routine_schema = 'public';

-- 6. Look for any other functions that might be creating "Someone" notifications
SELECT 
    'Functions with "Someone" in definition:' as info,
    routine_name,
    CASE 
        WHEN routine_definition ILIKE '%Someone%' THEN 'Contains "Someone"'
        ELSE 'Clean'
    END as someone_status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_definition ILIKE '%Someone%';
