-- Award badges to existing users based on their activity
-- This migration runs the badge checking function for all existing users
-- to ensure they receive badges they've already earned through past activity
-- NOTE: This is a SILENT migration - no notifications will be sent to avoid spamming users

-- Function to award badges to all existing users
CREATE OR REPLACE FUNCTION award_badges_to_existing_users()
RETURNS TABLE(user_id UUID, badges_awarded INTEGER) AS $$
DECLARE
  user_record RECORD;
  badge_count INTEGER;
BEGIN
  -- Loop through all users with profiles
  FOR user_record IN 
    SELECT DISTINCT up.user_id
    FROM user_profiles up
    WHERE up.user_id IS NOT NULL
  LOOP
    -- Check and award badges for this user
    SELECT COUNT(*) INTO badge_count
    FROM check_and_award_badges(user_record.user_id);
    
    -- Return the result
    RETURN QUERY SELECT user_record.user_id, badge_count;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION award_badges_to_existing_users TO authenticated;
GRANT EXECUTE ON FUNCTION award_badges_to_existing_users TO service_role;

-- Run the function to award badges to existing users
SELECT 
  'Starting badge award process for existing users...' as status,
  COUNT(*) as total_users
FROM user_profiles;

-- Execute the badge awarding
SELECT 
  user_id,
  badges_awarded,
  CASE 
    WHEN badges_awarded > 0 THEN 'Badges awarded!'
    ELSE 'No new badges'
  END as result
FROM award_badges_to_existing_users()
ORDER BY badges_awarded DESC;

-- Show summary statistics
SELECT 
  'Badge award summary:' as info,
  COUNT(*) as users_processed,
  SUM(badges_awarded) as total_badges_awarded,
  AVG(badges_awarded) as avg_badges_per_user
FROM award_badges_to_existing_users();

-- Clean up the temporary function
DROP FUNCTION IF EXISTS award_badges_to_existing_users;

-- Final status message
SELECT 'Badge migration completed! All existing users have been checked for badge eligibility.' as final_status;
