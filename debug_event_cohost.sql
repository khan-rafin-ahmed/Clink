-- Debug Event Co-Host System
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if the event exists and who created it
SELECT 
    id,
    title,
    created_by,
    created_at
FROM events 
WHERE id = '8fb9dc21-5cc5-4a44-a1ae-c2924f2669a0';

-- 2. Check if event_members table has the role column
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'event_members' 
AND column_name = 'role';

-- 3. Check current event_members for this event
SELECT 
    em.*,
    up.username,
    up.display_name
FROM event_members em
LEFT JOIN user_profiles up ON em.user_id = up.user_id
WHERE em.event_id = '8fb9dc21-5cc5-4a44-a1ae-c2924f2669a0';

-- 4. Check if the database functions exist
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name IN (
    'get_user_event_role',
    'can_user_edit_event',
    'promote_event_member_to_cohost',
    'demote_event_cohost'
);

-- 5. Test the get_user_event_role function (replace USER_ID with your actual user ID)
-- SELECT get_user_event_role('8fb9dc21-5cc5-4a44-a1ae-c2924f2669a0', 'YOUR_USER_ID_HERE');

-- 6. Check current user (if you're logged in via RLS)
SELECT auth.uid() as current_user_id;

-- 7. Check if there are any constraints on event_members
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%event_members%';
