-- Debug Crew Membership Issue
-- Run this in Supabase SQL Editor to check crew membership data

-- 1. Check if crew_members table exists and has data
SELECT 
    'crew_members table check' as check_type,
    COUNT(*) as total_records
FROM crew_members;

-- 2. Check all crew_members records with status
SELECT 
    'crew_members by status' as check_type,
    status,
    COUNT(*) as count
FROM crew_members
GROUP BY status;

-- 3. Check specific user's crew memberships (replace with actual user ID)
-- You can get your user ID from the browser console or auth.users table
SELECT 
    cm.id,
    cm.user_id,
    cm.crew_id,
    cm.status,
    cm.invited_by,
    cm.created_at,
    c.name as crew_name,
    c.vibe,
    c.visibility
FROM crew_members cm
LEFT JOIN crews c ON cm.crew_id = c.id
WHERE cm.status = 'accepted'
ORDER BY cm.created_at DESC;

-- 4. Check if there are any pending invitations
SELECT 
    cm.id,
    cm.user_id,
    cm.crew_id,
    cm.status,
    cm.invited_by,
    cm.created_at,
    c.name as crew_name
FROM crew_members cm
LEFT JOIN crews c ON cm.crew_id = c.id
WHERE cm.status = 'pending'
ORDER BY cm.created_at DESC;

-- 5. Check crews table
SELECT 
    'crews table check' as check_type,
    COUNT(*) as total_crews
FROM crews;

-- 6. List all crews with their member counts
SELECT 
    c.id,
    c.name,
    c.vibe,
    c.visibility,
    c.created_by,
    COUNT(cm.id) FILTER (WHERE cm.status = 'accepted') as accepted_members,
    COUNT(cm.id) FILTER (WHERE cm.status = 'pending') as pending_members
FROM crews c
LEFT JOIN crew_members cm ON c.id = cm.crew_id
GROUP BY c.id, c.name, c.vibe, c.visibility, c.created_by
ORDER BY c.created_at DESC;

-- 7. Check RLS policies on crew_members table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'crew_members';

-- 8. Check if user_profiles exist for crew members
SELECT 
    cm.user_id,
    up.display_name,
    up.avatar_url,
    cm.status,
    c.name as crew_name
FROM crew_members cm
LEFT JOIN user_profiles up ON cm.user_id = up.user_id
LEFT JOIN crews c ON cm.crew_id = c.id
WHERE cm.status = 'accepted'
ORDER BY cm.created_at DESC;

-- 9. Test the exact query used by getUserCrews function
-- This simulates the Supabase query from the frontend
SELECT 
    json_build_object(
        'id', c.id,
        'name', c.name,
        'vibe', c.vibe,
        'visibility', c.visibility,
        'description', c.description,
        'created_by', c.created_by,
        'created_at', c.created_at,
        'updated_at', c.updated_at
    ) as crew
FROM crew_members cm
JOIN crews c ON cm.crew_id = c.id
WHERE cm.status = 'accepted'
ORDER BY cm.created_at DESC;
