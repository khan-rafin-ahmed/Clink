-- Safe migration to add privacy columns to user_profiles
-- This handles cases where columns might already exist

DO $$
BEGIN
    -- Add profile_visibility column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'profile_visibility'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN profile_visibility TEXT DEFAULT 'public';
        
        -- Add constraint after column is created
        ALTER TABLE user_profiles 
        ADD CONSTRAINT user_profiles_profile_visibility_check 
        CHECK (profile_visibility IN ('public', 'crew_only', 'private'));
        
        RAISE NOTICE 'Added profile_visibility column';
    ELSE
        RAISE NOTICE 'profile_visibility column already exists';
    END IF;
    
    -- Add show_crews_publicly column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'show_crews_publicly'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN show_crews_publicly BOOLEAN DEFAULT true;
        
        RAISE NOTICE 'Added show_crews_publicly column';
    ELSE
        RAISE NOTICE 'show_crews_publicly column already exists';
    END IF;
    
    -- Create index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'user_profiles' 
        AND indexname = 'user_profiles_visibility_idx'
    ) THEN
        CREATE INDEX user_profiles_visibility_idx ON user_profiles(profile_visibility);
        RAISE NOTICE 'Created visibility index';
    ELSE
        RAISE NOTICE 'Visibility index already exists';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in migration: %', SQLERRM;
        -- Don't fail the migration, just log the error
END $$;
