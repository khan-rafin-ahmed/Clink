-- Simple Email Fix Script (No Syntax Errors)
-- This script fixes the root cause of email failures step by step

-- ============================================================================
-- STEP 1: Add email column to user_profiles if it doesn't exist
-- ============================================================================

DO $$
BEGIN
    -- Check if email column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'email'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN email TEXT;
        RAISE NOTICE '✅ Added email column to user_profiles table';
    ELSE
        RAISE NOTICE '✅ Email column already exists in user_profiles table';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Create index for email column
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'user_profiles' 
        AND indexname = 'idx_user_profiles_email'
    ) THEN
        CREATE INDEX idx_user_profiles_email ON user_profiles(email);
        RAISE NOTICE '✅ Created email index on user_profiles table';
    ELSE
        RAISE NOTICE '✅ Email index already exists on user_profiles table';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Sync existing user emails from auth.users to user_profiles
-- ============================================================================

DO $$
DECLARE
    sync_count INTEGER := 0;
BEGIN
    -- Update user_profiles with emails from auth.users
    UPDATE user_profiles 
    SET email = au.email,
        updated_at = NOW()
    FROM auth.users au 
    WHERE user_profiles.user_id = au.id 
      AND (user_profiles.email IS NULL OR user_profiles.email = '')
      AND au.email IS NOT NULL;
    
    GET DIAGNOSTICS sync_count = ROW_COUNT;
    RAISE NOTICE '✅ Synced emails for % existing users', sync_count;
END $$;

-- ============================================================================
-- STEP 4: Create secure email lookup function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_email_for_invitation(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.user_id,
        up.display_name,
        COALESCE(up.email, au.email) as email
    FROM user_profiles up
    JOIN auth.users au ON up.user_id = au.id
    WHERE up.user_id = p_user_id
      AND (up.email IS NOT NULL OR au.email IS NOT NULL);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_email_for_invitation(UUID) TO authenticated;

-- ============================================================================
-- STEP 5: Create email sync function for triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
    -- For INSERT operations, sync email from auth.users
    IF TG_OP = 'INSERT' THEN
        UPDATE user_profiles 
        SET email = au.email,
            updated_at = NOW()
        FROM auth.users au 
        WHERE user_profiles.user_id = NEW.user_id 
          AND au.id = NEW.user_id
          AND au.email IS NOT NULL
          AND (user_profiles.email IS NULL OR user_profiles.email = '');
        
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: Create trigger to auto-sync emails for new profiles
-- ============================================================================

DROP TRIGGER IF EXISTS sync_user_email_trigger ON user_profiles;
CREATE TRIGGER sync_user_email_trigger
    AFTER INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_email();

-- ============================================================================
-- STEP 7: Create manual sync function for maintenance
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_all_user_emails()
RETURNS INTEGER AS $$
DECLARE
    sync_count INTEGER := 0;
BEGIN
    -- Update all user_profiles with missing emails
    UPDATE user_profiles 
    SET email = au.email,
        updated_at = NOW()
    FROM auth.users au 
    WHERE user_profiles.user_id = au.id 
      AND (user_profiles.email IS NULL OR user_profiles.email = '')
      AND au.email IS NOT NULL;
    
    GET DIAGNOSTICS sync_count = ROW_COUNT;
    RETURN sync_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION sync_all_user_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_user_emails() TO service_role;

-- ============================================================================
-- STEP 8: Verification
-- ============================================================================

DO $$
DECLARE
    total_users INTEGER;
    users_with_email INTEGER;
    missing_emails INTEGER;
BEGIN
    -- Count total users
    SELECT COUNT(*) INTO total_users FROM user_profiles;
    
    -- Count users with emails in profiles
    SELECT COUNT(*) INTO users_with_email 
    FROM user_profiles 
    WHERE email IS NOT NULL AND email != '';
    
    -- Count users still missing emails
    SELECT COUNT(*) INTO missing_emails
    FROM user_profiles up
    JOIN auth.users au ON up.user_id = au.id
    WHERE au.email IS NOT NULL 
      AND (up.email IS NULL OR up.email = '');
    
    RAISE NOTICE '📊 EMAIL FIX RESULTS:';
    RAISE NOTICE '- Total users: %', total_users;
    RAISE NOTICE '- Users with emails in profiles: %', users_with_email;
    RAISE NOTICE '- Users still missing emails: %', missing_emails;
    
    IF missing_emails = 0 THEN
        RAISE NOTICE '🎉 SUCCESS: All users now have emails synced!';
        RAISE NOTICE '✅ Production emails should now work correctly';
    ELSE
        RAISE NOTICE '⚠️  WARNING: % users still missing emails', missing_emails;
        RAISE NOTICE '💡 You may need to check auth.users data for these users';
    END IF;
END $$;

-- Show sample of synced data
SELECT 
    'SAMPLE SYNCED DATA' as verification_step,
    user_id,
    display_name,
    CASE WHEN email IS NOT NULL THEN 'Has email' ELSE 'No email' END as email_status,
    created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;
