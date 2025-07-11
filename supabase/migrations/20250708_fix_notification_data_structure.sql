-- FIX: Notification data structure and missing invitation_id issue
-- This fixes both the "Someone" notifications and the notification update problem

-- 1. First, let's see what's in the data field of recent notifications
SELECT 
    'Current notification data structure:' as info,
    id,
    type,
    title,
    data,
    created_at
FROM notifications 
WHERE 
    type = 'event_invitation'
    AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 3;

-- 2. Check what functions are creating notifications without invitation_id
SELECT 
    routine_name,
    LEFT(routine_definition, 200) as definition_preview
FROM information_schema.routines 
WHERE 
    routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_definition ILIKE '%INSERT INTO notifications%'
    AND routine_definition ILIKE '%event_invitation%'
ORDER BY routine_name;

-- 3. Find the function that creates event invitations (likely missing invitation_id)
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE 
    routine_schema = 'public' 
    AND routine_name IN (
        'send_event_invitations_to_crew',
        'handle_event_invitation_notification',
        'notify_event_invitation'
    )
ORDER BY routine_name;

-- 4. Check recent event_invitation_response notifications to see if they have proper user names
SELECT 
    'Recent response notifications:' as info,
    id,
    type,
    title,
    message,
    data->>'event_title' as event_title,
    data->>'invitation_id' as invitation_id,
    created_at
FROM notifications 
WHERE 
    type = 'event_invitation_response'
    AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Show the current respond_to_event_invitation function to verify it's correct
SELECT 
    'Current respond_to_event_invitation function:' as info,
    routine_definition
FROM information_schema.routines 
WHERE 
    routine_schema = 'public' 
    AND routine_name = 'respond_to_event_invitation'
LIMIT 1;
