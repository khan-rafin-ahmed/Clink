-- Fix user profile creation trigger to handle Google OAuth users properly
-- Run this in Supabase SQL Editor

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Create improved function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    display_name_value TEXT;
BEGIN
    -- Extract display name from various possible sources
    display_name_value := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.user_metadata->>'full_name',
        NEW.user_metadata->>'name',
        split_part(NEW.email, '@', 1),
        'User'
    );

    -- Insert user profile with error handling
    BEGIN
        INSERT INTO public.user_profiles (user_id, display_name)
        VALUES (NEW.id, display_name_value);
    EXCEPTION 
        WHEN unique_violation THEN
            -- Profile already exists, update it instead
            UPDATE public.user_profiles 
            SET display_name = COALESCE(display_name, display_name_value),
                updated_at = NOW()
            WHERE user_id = NEW.id;
        WHEN OTHERS THEN
            -- Log error but don't fail the user creation
            RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION create_user_profile() TO service_role;
GRANT EXECUTE ON FUNCTION create_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile() TO anon;

-- Create trigger to automatically create user profile
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Also create a function to manually fix any users without profiles
CREATE OR REPLACE FUNCTION fix_missing_user_profiles()
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    fixed_count INTEGER := 0;
    display_name_value TEXT;
BEGIN
    -- Find users without profiles
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data, u.user_metadata
        FROM auth.users u
        LEFT JOIN public.user_profiles p ON u.id = p.user_id
        WHERE p.user_id IS NULL
    LOOP
        -- Extract display name
        display_name_value := COALESCE(
            user_record.raw_user_meta_data->>'full_name',
            user_record.raw_user_meta_data->>'name',
            user_record.user_metadata->>'full_name',
            user_record.user_metadata->>'name',
            split_part(user_record.email, '@', 1),
            'User'
        );

        -- Create missing profile
        BEGIN
            INSERT INTO public.user_profiles (user_id, display_name)
            VALUES (user_record.id, display_name_value);
            fixed_count := fixed_count + 1;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create profile for user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
    
    RETURN fixed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for the fix function
GRANT EXECUTE ON FUNCTION fix_missing_user_profiles() TO service_role;
GRANT EXECUTE ON FUNCTION fix_missing_user_profiles() TO authenticated;

-- Run the fix function to create profiles for any existing users without them
SELECT fix_missing_user_profiles() as profiles_created;

-- Ensure RLS policies allow the trigger to work
-- Update the INSERT policy to allow the trigger function
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
CREATE POLICY "Users can create their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR 
        current_setting('role') = 'service_role'
    );

-- Also ensure the trigger can update existing profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (
        auth.uid() = user_id OR 
        current_setting('role') = 'service_role'
    );
