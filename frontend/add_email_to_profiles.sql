-- Add email field to user_profiles for easy access
-- Run this in Supabase SQL Editor

-- ============================================================================
-- ADD EMAIL COLUMN TO USER_PROFILES
-- ============================================================================

-- Add email column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- ============================================================================
-- POPULATE EXISTING USER EMAILS
-- ============================================================================

-- Copy emails from auth.users to user_profiles for existing users
UPDATE user_profiles 
SET email = au.email
FROM auth.users au 
WHERE user_profiles.user_id = au.id 
  AND user_profiles.email IS NULL
  AND au.email IS NOT NULL;

-- ============================================================================
-- CREATE TRIGGER TO SYNC EMAILS
-- ============================================================================

-- Function to sync email when user profile is created
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get email from auth.users and set it in user_profiles
  UPDATE user_profiles 
  SET email = au.email
  FROM auth.users au 
  WHERE user_profiles.user_id = NEW.user_id 
    AND au.id = NEW.user_id
    AND au.email IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-sync emails for new users
DROP TRIGGER IF EXISTS sync_user_email_trigger ON user_profiles;
CREATE TRIGGER sync_user_email_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email();

-- ============================================================================
-- UPDATE RLS POLICIES (if needed)
-- ============================================================================

-- The email column will inherit the same RLS policies as the rest of user_profiles
-- No additional policies needed since emails are already accessible in many contexts

-- ============================================================================
-- TEST THE SETUP
-- ============================================================================

-- Check if emails were populated
SELECT 'EMAIL SYNC TEST' as test_name;

SELECT 
  COUNT(*) as total_users,
  COUNT(email) as users_with_email,
  ROUND(COUNT(email) * 100.0 / COUNT(*), 2) as email_percentage
FROM user_profiles;

-- Show sample of users with emails
SELECT 'SAMPLE USERS WITH EMAILS' as test_name;
SELECT 
  user_id,
  display_name,
  CASE WHEN email IS NOT NULL THEN 'Has email' ELSE 'No email' END as email_status,
  created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '🎉 Email sync setup complete!' as status;
SELECT 'Existing users now have emails in user_profiles' as step_1;
SELECT 'New users will automatically get emails synced' as step_2;
SELECT 'Frontend can now access emails directly from user_profiles' as step_3;
