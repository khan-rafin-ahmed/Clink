-- Debug User Crews Issue
-- Run this in Supabase SQL Editor to check what crews a specific user should see

-- Replace 'd4521365-eba5-4e4e-ae8b-e371546f91d8' with your actual user ID
-- You can get your user ID from the browser console logs

-- 1. Check user's crew memberships
SELECT 
    'User Memberships' as check_type,
    cm.id,
    cm.crew_id,
    cm.user_id,
    cm.status,
    cm.invited_by,
    cm.created_at
FROM crew_members cm
WHERE cm.user_id = 'd4521365-eba5-4e4e-ae8b-e371546f91d8'
ORDER BY cm.created_at DESC;

-- 2. Check crews that user should be able to see (with crew details)
SELECT 
    'Crews User Should See' as check_type,
    c.id,
    c.name,
    c.vibe,
    c.visibility,
    c.created_by,
    cm.status as membership_status,
    CASE 
        WHEN c.created_by = 'd4521365-eba5-4e4e-ae8b-e371546f91d8' THEN 'Creator'
        WHEN cm.user_id = 'd4521365-eba5-4e4e-ae8b-e371546f91d8' AND cm.status = 'accepted' THEN 'Member'
        ELSE 'No Access'
    END as access_reason
FROM crews c
LEFT JOIN crew_members cm ON c.id = cm.crew_id AND cm.user_id = 'd4521365-eba5-4e4e-ae8b-e371546f91d8'
WHERE 
    -- User created the crew
    c.created_by = 'd4521365-eba5-4e4e-ae8b-e371546f91d8'
    OR 
    -- User is an accepted member
    (cm.user_id = 'd4521365-eba5-4e4e-ae8b-e371546f91d8' AND cm.status = 'accepted')
    OR
    -- Public crew (should be visible to everyone)
    c.visibility = 'public'
ORDER BY c.created_at DESC;

-- 3. Test the exact RLS policies manually
-- This simulates what the RLS policies should allow

-- Public crews (should be visible to everyone)
SELECT 
    'Public Crews Test' as test_type,
    c.*
FROM crews c
WHERE c.visibility = 'public';

-- Private crews where user is creator
SELECT 
    'Private Crews (Creator)' as test_type,
    c.*
FROM crews c
WHERE c.visibility = 'private' 
    AND c.created_by = 'd4521365-eba5-4e4e-ae8b-e371546f91d8';

-- Private crews where user is member
SELECT 
    'Private Crews (Member)' as test_type,
    c.*
FROM crews c
WHERE c.visibility = 'private' 
    AND EXISTS (
        SELECT 1 FROM crew_members cm
        WHERE cm.crew_id = c.id
        AND cm.user_id = 'd4521365-eba5-4e4e-ae8b-e371546f91d8'
        AND cm.status = 'accepted'
    );

-- 4. Check if there are any orphaned crew_members records
SELECT 
    'Orphaned Memberships' as check_type,
    cm.*
FROM crew_members cm
LEFT JOIN crews c ON cm.crew_id = c.id
WHERE c.id IS NULL;

-- 5. Check current RLS policies
SELECT
    'Current RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('crews', 'crew_members')
ORDER BY tablename, policyname;
