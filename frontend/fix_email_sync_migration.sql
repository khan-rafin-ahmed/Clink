-- Email Sync Migration Script
-- This script fixes the root cause of email failures by ensuring emails are properly synced
-- from auth.users to user_profiles table

-- ============================================================================
-- STEP 1: Add email column to user_profiles if it doesn't exist
-- ============================================================================

SELECT 'ADDING EMAIL COLUMN TO USER_PROFILES' as migration_step;

-- Add email column to user_profiles table (safe operation)
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
-- STEP 2: Create index for email column for better performance
-- ============================================================================

SELECT 'CREATING EMAIL INDEX' as migration_step;

-- Create index on email column for better query performance
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

SELECT 'SYNCING EXISTING USER EMAILS' as migration_step;

-- Copy emails from auth.users to user_profiles for existing users
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
-- STEP 4: Create function to sync emails automatically
-- ============================================================================

SELECT 'CREATING EMAIL SYNC FUNCTION' as migration_step;

-- Function to sync email when user profile is created or updated
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

    -- For UPDATE operations, ensure email is synced if missing
    IF TG_OP = 'UPDATE' AND (NEW.email IS NULL OR NEW.email = '') THEN
        SELECT au.email INTO NEW.email
        FROM auth.users au
        WHERE au.id = NEW.user_id
          AND au.email IS NOT NULL;

        IF NEW.email IS NOT NULL THEN
            NEW.updated_at = NOW();
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    RAISE NOTICE '✅ Created sync_user_email function';
END $$;

-- ============================================================================
-- STEP 5: Create trigger to auto-sync emails for new and updated profiles
-- ============================================================================

SELECT 'CREATING EMAIL SYNC TRIGGERS' as migration_step;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_user_email_trigger ON user_profiles;

-- Create trigger to auto-sync emails
CREATE TRIGGER sync_user_email_trigger
    AFTER INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_email();

DO $$
BEGIN
    RAISE NOTICE '✅ Created email sync trigger';
END $$;

-- ============================================================================
-- STEP 6: Create function to manually sync emails for all users
-- ============================================================================

SELECT 'CREATING MANUAL SYNC FUNCTION' as migration_step;

-- Function to manually sync all user emails (useful for maintenance)
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
    
    RAISE NOTICE 'Synced emails for % users', sync_count;
    RETURN sync_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION sync_all_user_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_user_emails() TO service_role;

DO $$
BEGIN
    RAISE NOTICE '✅ Created manual sync function';
END $$;

-- ============================================================================
-- STEP 7: Create secure email lookup function for invitations
-- ============================================================================

SELECT 'CREATING SECURE EMAIL LOOKUP FUNCTION' as migration_step;

-- Function to securely get user email for invitations
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

DO $$
BEGIN
    RAISE NOTICE '✅ Created secure email lookup function';
END $$;

-- ============================================================================
-- STEP 8: Verification and summary
-- ============================================================================

SELECT 'MIGRATION VERIFICATION' as migration_step;

-- Verify the migration worked
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
    
    RAISE NOTICE '📊 MIGRATION RESULTS:';
    RAISE NOTICE '- Total users: %', total_users;
    RAISE NOTICE '- Users with emails in profiles: %', users_with_email;
    RAISE NOTICE '- Users still missing emails: %', missing_emails;
    
    IF missing_emails = 0 THEN
        RAISE NOTICE '🎉 SUCCESS: All users now have emails synced!';
    ELSE
        RAISE NOTICE '⚠️  WARNING: % users still missing emails - check auth.users data', missing_emails;
    END IF;
END $$;

-- Show sample of synced data
SELECT 'SAMPLE SYNCED DATA' as verification_step;
SELECT 
    user_id,
    display_name,
    CASE WHEN email IS NOT NULL THEN 'Has email' ELSE 'No email' END as email_status,
    created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

SELECT '🎉 EMAIL SYNC MIGRATION COMPLETED!' as final_status;
