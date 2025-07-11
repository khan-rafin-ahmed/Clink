-- Find the source of "Someone" notifications
-- Run this in Supabase SQL Editor to identify which functions are creating "Someone" notifications

-- 1. Check all database functions that might create notifications
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%Someone%'
   AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 2. Check all triggers that might create notifications
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE action_statement ILIKE '%Someone%'
ORDER BY trigger_name;

-- 3. Check the current respond_to_event_invitation function
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'respond_to_event_invitation';

-- 4. Check the current handle_event_invitation_notification function
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_event_invitation_notification';

-- 5. Check for any functions with COALESCE and 'Someone'
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%COALESCE%Someone%'
ORDER BY routine_name;

-- 6. Look at the specific "Someone" notifications to understand their data structure
SELECT 
    id,
    user_id,
    type,
    title,
    message,
    data,
    created_at
FROM notifications 
WHERE title ILIKE '%Someone%'
ORDER BY created_at DESC;

-- 7. Check if there's a notify_event_rsvp function (mentioned in memories)
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'notify_event_rsvp';

-- 8. Check all notification-related functions
SELECT 
    routine_name,
    routine_type,
    LEFT(routine_definition, 200) as definition_preview
FROM information_schema.routines 
WHERE routine_name ILIKE '%notification%'
   OR routine_name ILIKE '%notify%'
   OR routine_definition ILIKE '%notifications%'
ORDER BY routine_name;
