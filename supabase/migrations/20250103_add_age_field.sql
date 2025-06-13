-- Add age field to user_profiles table for Age Gate feature
-- This migration adds the age field required for age verification

-- Add age column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN age SMALLINT CHECK (age >= 19 OR age IS NULL);

-- Create index for better query performance on age field
CREATE INDEX user_profiles_age_idx ON user_profiles(age);

-- Add comment to document the purpose
COMMENT ON COLUMN user_profiles.age IS 'User age for age verification (minimum 19 years old)';

-- Update the updated_at trigger to include the new column
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at_trigger ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at_trigger
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_profiles_updated_at();
