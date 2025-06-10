-- EMERGENCY FIX: Disable trigger and rely on application-level profile creation
-- This completely bypasses the problematic database trigger
-- Run this in your Supabase SQL Editor IMMEDIATELY

-- Step 1: DISABLE the problematic trigger completely
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- Step 2: Keep the manual profile creation function (this works)
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

-- Step 3: Grant permissions for the manual function
GRANT EXECUTE ON FUNCTION create_profile_for_user(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION create_profile_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_profile_for_user(UUID) TO anon;

-- Step 4: Ensure RLS policies allow profile creation
-- Check current policies
SELECT policyname, cmd, roles, qual FROM pg_policies WHERE tablename = 'user_profiles';

-- Create or update RLS policy to allow authenticated users to insert their own profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure users can read their own profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Ensure users can update their own profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Allow public read access for profiles (needed for app functionality)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
    FOR SELECT USING (true);

-- Step 5: Fix any existing users without profiles
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

-- Step 6: Verify the fix
SELECT 
    'Trigger Status' as check_type,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'create_user_profile_trigger'
        ) THEN 'STILL ACTIVE (BAD)'
        ELSE 'DISABLED (GOOD)'
    END as status

UNION ALL

SELECT 
    'Users without profiles' as check_type,
    COUNT(*)::text as status
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL

UNION ALL

SELECT 
    'Manual function available' as check_type,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'create_profile_for_user'
        ) THEN 'YES (GOOD)'
        ELSE 'NO (BAD)'
    END as status

UNION ALL

SELECT 
    'RLS Policies' as check_type,
    COUNT(*)::text || ' policies active' as status
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Success message
SELECT 'EMERGENCY FIX APPLIED: Trigger disabled, application will handle profile creation' as status;
