-- Fix Crew RLS Infinite Recursion Issue
-- Run this in Supabase SQL Editor to fix the crew visibility problem

-- ========================================
-- STEP 1: Check current policies causing issues
-- ========================================
SELECT 
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

-- ========================================
-- STEP 2: Drop all existing problematic policies
-- ========================================

-- Drop crew policies
DROP POLICY IF EXISTS "Public crews are viewable by everyone" ON crews;
DROP POLICY IF EXISTS "Private crews are viewable by members" ON crews;
DROP POLICY IF EXISTS "Users can view crews they have access to" ON crews;

-- Drop crew_members policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own memberships" ON crew_members;
DROP POLICY IF EXISTS "Crew creators can view all memberships" ON crew_members;

-- ========================================
-- STEP 3: Create simple, non-recursive policies
-- ========================================

-- Simple policy for crew_members: users can see their own memberships
CREATE POLICY "Users can view their own crew memberships" ON crew_members
FOR SELECT USING (user_id = auth.uid());

-- Simple policy for crew_members: crew creators can see memberships in their crews
CREATE POLICY "Crew creators can view memberships in their crews" ON crew_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM crews c
    WHERE c.id = crew_members.crew_id
    AND c.created_by = auth.uid()
  )
);

-- Simple policy for crews: public crews are visible to everyone
CREATE POLICY "Public crews are visible to everyone" ON crews
FOR SELECT USING (visibility = 'public');

-- Simple policy for crews: users can see crews they created
CREATE POLICY "Users can view crews they created" ON crews
FOR SELECT USING (created_by = auth.uid());

-- Simple policy for crews: users can see private crews they are members of
-- This uses a direct subquery without referencing crew_members policies
CREATE POLICY "Users can view private crews they are members of" ON crews
FOR SELECT USING (
  visibility = 'private' AND
  id IN (
    SELECT crew_id 
    FROM crew_members 
    WHERE user_id = auth.uid() 
    AND status = 'accepted'
  )
);

-- ========================================
-- STEP 4: Verify the fix
-- ========================================

-- Test query to see what crews a user should be able to access
-- Replace 'd4521365-eba5-4e4e-ae8b-e371546f91d8' with your actual user ID
/*
SELECT 
    c.id,
    c.name,
    c.visibility,
    c.created_by,
    CASE 
        WHEN c.created_by = 'd4521365-eba5-4e4e-ae8b-e371546f91d8' THEN 'Creator'
        WHEN c.visibility = 'public' THEN 'Public Access'
        WHEN c.id IN (
            SELECT crew_id 
            FROM crew_members 
            WHERE user_id = 'd4521365-eba5-4e4e-ae8b-e371546f91d8' 
            AND status = 'accepted'
        ) THEN 'Member Access'
        ELSE 'No Access'
    END as access_type
FROM crews c
ORDER BY c.created_at DESC;
*/

-- ========================================
-- INSTRUCTIONS:
-- 1. Copy and paste this entire SQL into Supabase SQL Editor
-- 2. Click "Run" to execute
-- 3. Check the results of the test query above
-- 4. Go back to your app and refresh the profile page
-- ========================================
