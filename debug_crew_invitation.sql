-- Debug crew invitation system
-- Run this in your Supabase SQL editor to check the current state

-- 1. Check if the correct function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'send_event_invitations_to_crew'
ORDER BY routine_name;

-- 2. Check recent events and their creators
SELECT 
    'Recent Events' as check_type,
    e.id,
    e.title,
    e.created_by,
    up.display_name as creator_name,
    e.created_at
FROM events e
LEFT JOIN user_profiles up ON e.created_by = up.user_id
ORDER BY e.created_at DESC
LIMIT 5;

-- 3. Check crews and their creators
SELECT 
    'User Crews' as check_type,
    c.id,
    c.name,
    c.created_by,
    up.display_name as creator_name,
    COUNT(cm.id) FILTER (WHERE cm.status = 'accepted') as member_count
FROM crews c
LEFT JOIN user_profiles up ON c.created_by = up.user_id
LEFT JOIN crew_members cm ON c.id = cm.crew_id
GROUP BY c.id, c.name, c.created_by, up.display_name
ORDER BY c.created_at DESC;

-- 4. Check crew members for a specific crew (replace with actual crew ID)
-- SELECT 
--     'Crew Members' as check_type,
--     cm.crew_id,
--     cm.user_id,
--     cm.status,
--     up.display_name,
--     c.name as crew_name
-- FROM crew_members cm
-- JOIN user_profiles up ON cm.user_id = up.user_id
-- JOIN crews c ON cm.crew_id = c.id
-- WHERE cm.crew_id = 'YOUR_CREW_ID_HERE'
-- ORDER BY cm.created_at;

-- 5. Check if there are any existing event invitations
SELECT 
    'Existing Event Invitations' as check_type,
    em.event_id,
    em.user_id,
    em.invited_by,
    em.status,
    e.title as event_title,
    up.display_name as invitee_name
FROM event_members em
JOIN events e ON em.event_id = e.id
LEFT JOIN user_profiles up ON em.user_id = up.user_id
ORDER BY em.created_at DESC
LIMIT 10;

-- 6. Test the function with sample data (you'll need to replace with real IDs)
-- This will show you what the function expects
SELECT 
    'Function Test Info' as info,
    'Replace the UUIDs below with real values from your database' as instruction;

-- Example function call (commented out - replace with real values):
-- SELECT * FROM send_event_invitations_to_crew(
--     'YOUR_EVENT_ID'::UUID,
--     'YOUR_CREW_ID'::UUID, 
--     'YOUR_USER_ID'::UUID
-- );
