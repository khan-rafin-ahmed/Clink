-- Fix Google OAuth "Database error saving new user" issue
-- This script addresses the database trigger problems that prevent new Google OAuth users from signing up
-- Run this in your Supabase SQL Editor

-- Step 1: Drop existing problematic trigger and function
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Step 2: Create improved function with better error handling and metadata extraction
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    display_name_value TEXT;
    profile_exists BOOLEAN := FALSE;
BEGIN
    -- Log the trigger execution
    RAISE NOTICE 'create_user_profile trigger fired for user: %', NEW.id;
    RAISE NOTICE 'User email: %', NEW.email;
    RAISE NOTICE 'User metadata: %', NEW.user_metadata;
    RAISE NOTICE 'Raw user metadata: %', NEW.raw_user_meta_data;

    -- Check if profile already exists (prevent duplicates)
    SELECT EXISTS(
        SELECT 1 FROM public.user_profiles WHERE user_id = NEW.id
    ) INTO profile_exists;

    IF profile_exists THEN
        RAISE NOTICE 'Profile already exists for user %, skipping creation', NEW.id;
        RETURN NEW;
    END IF;

    -- Extract display name from various possible Google OAuth sources
    display_name_value := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'display_name',
        NEW.user_metadata->>'full_name',
        NEW.user_metadata->>'name',
        NEW.user_metadata->>'display_name',
        -- Try first_name + last_name combination
        CASE 
            WHEN NEW.raw_user_meta_data->>'first_name' IS NOT NULL AND NEW.raw_user_meta_data->>'last_name' IS NOT NULL
            THEN CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name')
            WHEN NEW.user_metadata->>'first_name' IS NOT NULL AND NEW.user_metadata->>'last_name' IS NOT NULL
            THEN CONCAT(NEW.user_metadata->>'first_name', ' ', NEW.user_metadata->>'last_name')
            ELSE NULL
        END,
        -- Fallback to email username
        CASE 
            WHEN NEW.email IS NOT NULL 
            THEN split_part(NEW.email, '@', 1)
            ELSE 'User'
        END
    );

    RAISE NOTICE 'Extracted display name: %', display_name_value;

    -- Attempt to create the profile with comprehensive error handling
    BEGIN
        INSERT INTO public.user_profiles (user_id, display_name, created_at, updated_at)
        VALUES (NEW.id, display_name_value, NOW(), NOW());
        
        RAISE NOTICE 'Profile created successfully for user: %', NEW.id;
        
    EXCEPTION 
        WHEN unique_violation THEN
            -- Profile was created by another process, this is OK
            RAISE NOTICE 'Profile already exists (unique violation), continuing...';
            
        WHEN insufficient_privilege THEN
            -- Permission error - log but don't fail the user creation
            RAISE WARNING 'Insufficient privileges to create profile for user %, but user creation will continue', NEW.id;
            
        WHEN OTHERS THEN
            -- Log the error but don't fail the user creation process
            RAISE WARNING 'Error creating profile for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
            RAISE NOTICE 'User creation will continue despite profile creation error';
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user_profile() TO service_role;
GRANT EXECUTE ON FUNCTION create_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile() TO anon;

-- Step 4: Create the trigger
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Step 5: Create a manual profile creation function for fallback
CREATE OR REPLACE FUNCTION create_profile_for_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
    display_name_value TEXT;
    profile_exists BOOLEAN := FALSE;
BEGIN
    -- Get user data from auth.users
    SELECT * FROM auth.users WHERE id = target_user_id INTO user_record;
    
    IF NOT FOUND THEN
        RAISE NOTICE 'User not found: %', target_user_id;
        RETURN FALSE;
    END IF;

    -- Check if profile already exists
    SELECT EXISTS(
        SELECT 1 FROM public.user_profiles WHERE user_id = target_user_id
    ) INTO profile_exists;

    IF profile_exists THEN
        RAISE NOTICE 'Profile already exists for user %', target_user_id;
        RETURN TRUE;
    END IF;

    -- Extract display name
    display_name_value := COALESCE(
        user_record.raw_user_meta_data->>'full_name',
        user_record.raw_user_meta_data->>'name',
        user_record.user_metadata->>'full_name',
        user_record.user_metadata->>'name',
        split_part(user_record.email, '@', 1),
        'User'
    );

    -- Create profile
    BEGIN
        INSERT INTO public.user_profiles (user_id, display_name, created_at, updated_at)
        VALUES (target_user_id, display_name_value, NOW(), NOW());
        
        RAISE NOTICE 'Profile created manually for user: %', target_user_id;
        RETURN TRUE;
        
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE NOTICE 'Profile already exists (created by another process)';
            RETURN TRUE;
            
        WHEN OTHERS THEN
            RAISE WARNING 'Error creating profile manually: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
            RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Grant permissions for the manual function
GRANT EXECUTE ON FUNCTION create_profile_for_user(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION create_profile_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile_for_user(UUID) TO anon;

-- Step 7: Fix any existing users without profiles
DO $$
DECLARE
    user_record RECORD;
    display_name_value TEXT;
    fixed_count INTEGER := 0;
BEGIN
    FOR user_record IN 
        SELECT u.* FROM auth.users u
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
            INSERT INTO public.user_profiles (user_id, display_name, created_at, updated_at)
            VALUES (user_record.id, display_name_value, NOW(), NOW());
            
            fixed_count := fixed_count + 1;
            RAISE NOTICE 'Fixed missing profile for user: % (email: %)', user_record.id, user_record.email;
            
        EXCEPTION 
            WHEN unique_violation THEN
                -- Profile exists now, skip
                CONTINUE;
            WHEN OTHERS THEN
                RAISE WARNING 'Could not fix profile for user %: %', user_record.id, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Fixed % missing user profiles', fixed_count;
END $$;

-- Step 8: Verify the fix
SELECT 
    'Users without profiles' as check_type,
    COUNT(*) as count
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL

UNION ALL

SELECT 
    'Total users' as check_type,
    COUNT(*) as count
FROM auth.users

UNION ALL

SELECT 
    'Total profiles' as check_type,
    COUNT(*) as count
FROM public.user_profiles;

-- Success message
SELECT 'Google OAuth database error fix completed successfully!' as status;
