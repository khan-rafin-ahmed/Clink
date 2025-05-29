-- Debug Google Login Issues
-- Run this in Supabase SQL Editor to help diagnose profile creation problems

-- 1. Check if there are users without profiles
SELECT 
    u.id,
    u.email,
    u.created_at as user_created_at,
    u.raw_user_meta_data,
    u.user_metadata,
    p.id as profile_id,
    p.display_name,
    p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ORDER BY u.created_at DESC
LIMIT 10;

-- 2. Check recent users and their profiles
SELECT 
    u.id,
    u.email,
    u.created_at as user_created_at,
    u.raw_user_meta_data->>'full_name' as google_name,
    u.raw_user_meta_data->>'avatar_url' as google_avatar,
    p.id as profile_id,
    p.display_name,
    p.created_at as profile_created_at,
    CASE 
        WHEN p.user_id IS NULL THEN 'NO PROFILE'
        ELSE 'HAS PROFILE'
    END as status
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.created_at > NOW() - INTERVAL '24 hours'
ORDER BY u.created_at DESC;

-- 3. Check if the trigger exists and is working
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'create_user_profile_trigger';

-- 4. Test the profile creation function manually (if needed)
-- Uncomment and modify the user_id below to test
/*
DO $$
DECLARE
    test_user_id UUID := 'YOUR_USER_ID_HERE'; -- Replace with actual user ID
    display_name_value TEXT;
    user_record RECORD;
BEGIN
    -- Get user data
    SELECT * INTO user_record FROM auth.users WHERE id = test_user_id;
    
    IF user_record.id IS NULL THEN
        RAISE NOTICE 'User not found: %', test_user_id;
        RETURN;
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
    
    RAISE NOTICE 'User: %, Email: %, Display Name: %', 
        user_record.id, user_record.email, display_name_value;
    
    -- Try to create profile
    BEGIN
        INSERT INTO public.user_profiles (user_id, display_name)
        VALUES (user_record.id, display_name_value);
        RAISE NOTICE 'Profile created successfully';
    EXCEPTION 
        WHEN unique_violation THEN
            RAISE NOTICE 'Profile already exists';
        WHEN OTHERS THEN
            RAISE NOTICE 'Error creating profile: %', SQLERRM;
    END;
END $$;
*/

-- 5. Check RLS policies on user_profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 6. Check table permissions
SELECT 
    grantee,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public';
