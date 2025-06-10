-- Test script to verify Google OAuth fix is working
-- Run this in Supabase SQL Editor after applying the fix

-- 1. Check if the trigger exists and is properly configured
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'create_user_profile_trigger'
AND event_object_table = 'users'
AND event_object_schema = 'auth';

-- 2. Check if the functions exist
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_name IN ('create_user_profile', 'create_profile_for_user')
AND routine_schema = 'public';

-- 3. Check RLS policies on user_profiles table
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles'
AND schemaname = 'public';

-- 4. Test the manual profile creation function
-- (This simulates what happens when the trigger fails)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    result BOOLEAN;
BEGIN
    -- Create a test user record (simulating Google OAuth user)
    INSERT INTO auth.users (
        id, 
        email, 
        raw_user_meta_data, 
        user_metadata,
        created_at,
        updated_at,
        email_confirmed_at,
        aud,
        role
    ) VALUES (
        test_user_id,
        'test-google-user@example.com',
        '{"full_name": "Test Google User", "picture": "https://example.com/avatar.jpg", "email": "test-google-user@example.com"}',
        '{"full_name": "Test Google User", "picture": "https://example.com/avatar.jpg"}',
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );

    -- Test manual profile creation
    SELECT create_profile_for_user(test_user_id) INTO result;
    
    IF result THEN
        RAISE NOTICE 'SUCCESS: Manual profile creation test passed';
        
        -- Verify profile was created
        IF EXISTS(SELECT 1 FROM public.user_profiles WHERE user_id = test_user_id) THEN
            RAISE NOTICE 'SUCCESS: Profile exists in database';
        ELSE
            RAISE WARNING 'FAILURE: Profile not found after creation';
        END IF;
    ELSE
        RAISE WARNING 'FAILURE: Manual profile creation test failed';
    END IF;

    -- Clean up test data
    DELETE FROM public.user_profiles WHERE user_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RAISE NOTICE 'Test cleanup completed';
END $$;

-- 5. Check for any users without profiles (should be 0 after fix)
SELECT 
    u.id,
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'full_name' as google_name,
    CASE WHEN p.user_id IS NULL THEN 'MISSING PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
ORDER BY u.created_at DESC
LIMIT 10;

-- 6. Show recent user signups and their profile status
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    p.created_at as profile_created,
    p.display_name,
    u.raw_user_meta_data->>'full_name' as google_name,
    CASE 
        WHEN p.user_id IS NOT NULL THEN 'SUCCESS'
        ELSE 'MISSING PROFILE'
    END as status
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.created_at > NOW() - INTERVAL '7 days'
ORDER BY u.created_at DESC
LIMIT 20;

-- 7. Test trigger functionality with a simulated insert
-- (This tests if the trigger would work for new users)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    profile_count INTEGER;
BEGIN
    -- Insert a test user (this should trigger profile creation)
    INSERT INTO auth.users (
        id, 
        email, 
        raw_user_meta_data, 
        user_metadata,
        created_at,
        updated_at,
        email_confirmed_at,
        aud,
        role
    ) VALUES (
        test_user_id,
        'trigger-test@example.com',
        '{"full_name": "Trigger Test User", "email": "trigger-test@example.com"}',
        '{"full_name": "Trigger Test User"}',
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );

    -- Wait a moment for trigger to execute
    PERFORM pg_sleep(0.1);

    -- Check if profile was created by trigger
    SELECT COUNT(*) FROM public.user_profiles WHERE user_id = test_user_id INTO profile_count;
    
    IF profile_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Trigger created profile automatically';
    ELSE
        RAISE WARNING 'WARNING: Trigger did not create profile (this may be expected if trigger is disabled)';
    END IF;

    -- Clean up
    DELETE FROM public.user_profiles WHERE user_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RAISE NOTICE 'Trigger test cleanup completed';
END $$;

-- 8. Summary report
SELECT 
    'Fix Status Report' as report_type,
    '' as details
UNION ALL
SELECT 
    'Total Users',
    COUNT(*)::text
FROM auth.users
UNION ALL
SELECT 
    'Total Profiles',
    COUNT(*)::text
FROM public.user_profiles
UNION ALL
SELECT 
    'Users Missing Profiles',
    COUNT(*)::text
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE p.user_id IS NULL
UNION ALL
SELECT 
    'Recent Signups (7 days)',
    COUNT(*)::text
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    'Trigger Status',
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = 'create_user_profile_trigger'
        ) THEN 'ACTIVE'
        ELSE 'MISSING'
    END
UNION ALL
SELECT 
    'Manual Function Status',
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name = 'create_profile_for_user'
        ) THEN 'AVAILABLE'
        ELSE 'MISSING'
    END;

-- Final success message
SELECT 
    '✅ Google OAuth Fix Test Completed' as status,
    'Check the results above to verify everything is working correctly' as next_steps;
