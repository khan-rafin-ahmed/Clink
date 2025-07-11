-- DIAGNOSTIC: Find what's creating "Someone" notifications and why notifications aren't updating

-- 1. Check recent notifications with "Someone"
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    data,
    created_at
FROM notifications 
WHERE 
    title ILIKE '%someone%' 
    OR message ILIKE '%someone%'
    OR title ILIKE '%Session v%'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check what database functions currently exist for invitation processing
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE 
    routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name ILIKE '%invitation%'
ORDER BY routine_name;

-- 3. Check if there are multiple versions of respond_to_event_invitation
SELECT 
    routine_name,
    specific_name,
    routine_definition
FROM information_schema.routines 
WHERE 
    routine_schema = 'public' 
    AND routine_name = 'respond_to_event_invitation'
ORDER BY specific_name;

-- 4. Check recent event_invitation_response notifications
SELECT 
    id,
    user_id,
    type,
    title,
    LEFT(message, 50) as message_preview,
    data->>'event_title' as event_title,
    data->>'invitation_id' as invitation_id,
    created_at
FROM notifications 
WHERE 
    type = 'event_invitation_response'
    AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check if there are any notifications that should be updated but aren't
SELECT 
    'Invitation notifications that might need updating:' as info,
    id,
    user_id,
    type,
    title,
    data->>'invitation_id' as invitation_id,
    data->>'user_response' as user_response,
    data->>'responded_at' as responded_at,
    created_at
FROM notifications 
WHERE 
    type = 'event_invitation'
    AND (data->>'user_response' IS NULL OR data->>'user_response' = '')
    AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 10;
