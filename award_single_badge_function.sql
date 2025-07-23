-- Create function to award a single badge (bypasses RLS)
-- This function can be run directly in Supabase SQL editor

CREATE OR REPLACE FUNCTION award_single_badge(p_user_id UUID, p_badge_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if badge already exists
  IF EXISTS (
    SELECT 1 FROM user_badges 
    WHERE user_id = p_user_id AND badge_id = p_badge_id
  ) THEN
    RETURN FALSE; -- Badge already exists
  END IF;
  
  -- Insert the badge
  INSERT INTO user_badges (user_id, badge_id, is_visible_on_profile)
  VALUES (p_user_id, p_badge_id, true);
  
  RETURN TRUE; -- Badge awarded successfully
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE; -- Error occurred
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION award_single_badge TO authenticated;
GRANT EXECUTE ON FUNCTION award_single_badge TO service_role;

SELECT 'award_single_badge function created successfully!' as status;
