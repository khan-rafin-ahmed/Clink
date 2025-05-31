-- Add privacy controls to user profiles
-- This migration adds profile visibility settings

-- Add profile privacy fields to user_profiles table (only if they don't exist)
DO $$
BEGIN
    -- Add profile_visibility column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'profile_visibility') THEN
        ALTER TABLE user_profiles ADD COLUMN profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'crew_only', 'private'));
    END IF;

    -- Add show_crews_publicly column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'show_crews_publicly') THEN
        ALTER TABLE user_profiles ADD COLUMN show_crews_publicly BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Create index for better query performance (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS user_profiles_visibility_idx ON user_profiles(profile_visibility);

-- Update RLS policies for user_profiles to respect privacy settings
DROP POLICY IF EXISTS "User profiles are publicly readable" ON user_profiles;
DROP POLICY IF EXISTS "User profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Crew-only profiles are viewable by crew members" ON user_profiles;
DROP POLICY IF EXISTS "Private profiles are viewable by owner only" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Policy: Public profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
FOR SELECT USING (profile_visibility = 'public');

-- Policy: Crew-only profiles are viewable by crew members
CREATE POLICY "Crew-only profiles are viewable by crew members" ON user_profiles
FOR SELECT USING (
  profile_visibility = 'crew_only' AND (
    -- User can always see their own profile
    auth.uid() = user_id OR
    -- User can see profiles of people in their crews
    EXISTS (
      SELECT 1 FROM crew_members cm1
      JOIN crew_members cm2 ON cm1.crew_id = cm2.crew_id
      WHERE cm1.user_id = auth.uid()
      AND cm2.user_id = user_profiles.user_id
      AND cm1.status = 'accepted'
      AND cm2.status = 'accepted'
    )
  )
);

-- Policy: Private profiles are only viewable by the owner
CREATE POLICY "Private profiles are viewable by owner only" ON user_profiles
FOR SELECT USING (
  profile_visibility = 'private' AND auth.uid() = user_id
);

-- Policy: Users can always view their own profile (regardless of privacy setting)
CREATE POLICY "Users can view their own profile" ON user_profiles
FOR SELECT USING (auth.uid() = user_id);

-- Keep existing policies for insert/update
CREATE POLICY "Users can create their own profile" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
FOR UPDATE USING (auth.uid() = user_id);
