-- Fix Badge Progress RLS Policies
-- Add missing INSERT and UPDATE policies for badge_progress table

-- Check current policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'badge_progress';

-- Add INSERT policy for badge_progress
-- Users can create progress records for themselves
CREATE POLICY "Users can create their own progress" ON badge_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for badge_progress  
-- Users can update their own progress records
CREATE POLICY "Users can update their own progress" ON badge_progress
FOR UPDATE USING (auth.uid() = user_id);

-- Verify the policies were created
SELECT 
    'After fix:' as status,
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd
FROM pg_policies 
WHERE tablename = 'badge_progress'
ORDER BY policyname;
