-- Create Badge Progress Management Function
-- This function allows creating/updating badge progress with proper permissions

-- First, add the missing RLS policies for badge_progress table
-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can create their own progress" ON badge_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON badge_progress;

CREATE POLICY "Users can create their own progress" ON badge_progress
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON badge_progress
FOR UPDATE USING (auth.uid() = user_id);

-- Create function to manage badge progress (with SECURITY DEFINER for admin operations)
CREATE OR REPLACE FUNCTION create_badge_progress(
  p_user_id UUID,
  p_badge_id UUID,
  p_current_progress INTEGER,
  p_target_progress INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Insert or update badge progress
  INSERT INTO badge_progress (
    user_id,
    badge_id,
    current_progress,
    target_progress,
    last_updated
  ) VALUES (
    p_user_id,
    p_badge_id,
    p_current_progress,
    p_target_progress,
    NOW()
  )
  ON CONFLICT (user_id, badge_id) 
  DO UPDATE SET
    current_progress = EXCLUDED.current_progress,
    target_progress = EXCLUDED.target_progress,
    last_updated = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_badge_progress(UUID, UUID, INTEGER, INTEGER) TO authenticated;

-- Test the function (optional - remove in production)
-- SELECT create_badge_progress(
--   (SELECT user_id FROM user_profiles LIMIT 1),
--   (SELECT id FROM badges LIMIT 1),
--   2,
--   5
-- ) as test_result;
