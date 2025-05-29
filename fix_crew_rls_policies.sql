-- Fix Crew RLS Policies
-- This fixes the issue where users can't see crews they're members of

-- Drop existing policies for crews table
DROP POLICY IF EXISTS "Public crews are viewable by everyone" ON crews;
DROP POLICY IF EXISTS "Private crews are viewable by members" ON crews;

-- Create comprehensive policy that covers all cases
CREATE POLICY "Users can view crews they have access to" ON crews
FOR SELECT USING (
  -- Public crews are viewable by everyone
  visibility = 'public'
  OR
  -- Private crews are viewable by creator
  created_by = auth.uid()
  OR
  -- Private crews are viewable by accepted members
  (
    visibility = 'private' AND
    EXISTS (
      SELECT 1 FROM crew_members
      WHERE crew_id = crews.id
      AND user_id = auth.uid()
      AND status = 'accepted'
    )
  )
);

-- Verify the policy works by testing it
-- This should return crews that the current user can see
-- (Run this after applying the policy to test)

/*
-- Test query (replace with actual user ID):
SELECT 
    c.id,
    c.name,
    c.visibility,
    c.created_by,
    CASE 
        WHEN c.created_by = 'd4521365-eba5-4e4e-ae8b-e371546f91d8' THEN 'Creator'
        WHEN c.visibility = 'public' THEN 'Public'
        WHEN EXISTS (
            SELECT 1 FROM crew_members cm 
            WHERE cm.crew_id = c.id 
            AND cm.user_id = 'd4521365-eba5-4e4e-ae8b-e371546f91d8' 
            AND cm.status = 'accepted'
        ) THEN 'Member'
        ELSE 'No Access'
    END as access_type
FROM crews c
ORDER BY c.created_at DESC;
*/
