-- Safe migration to add privacy columns to user_profiles and crew_invitations table
-- This handles cases where columns/tables might already exist

DO $$
BEGIN
    -- Create crew_invitations table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'crew_invitations'
    ) THEN
        CREATE TABLE crew_invitations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            crew_id UUID REFERENCES crews(id) ON DELETE CASCADE NOT NULL,
            invite_code TEXT UNIQUE NOT NULL,
            created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE,
            max_uses INTEGER,
            current_uses INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE crew_invitations ENABLE ROW LEVEL SECURITY;

        RAISE NOTICE 'Created crew_invitations table';
    ELSE
        RAISE NOTICE 'crew_invitations table already exists';
    END IF;
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

    -- Create user_profiles visibility index if it doesn't exist
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

    -- Create crew_invitations indexes if they don't exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crew_invitations') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'crew_invitations' AND indexname = 'crew_invitations_invite_code_idx') THEN
            CREATE INDEX crew_invitations_invite_code_idx ON crew_invitations(invite_code);
            RAISE NOTICE 'Created crew_invitations invite_code index';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'crew_invitations' AND indexname = 'crew_invitations_crew_id_idx') THEN
            CREATE INDEX crew_invitations_crew_id_idx ON crew_invitations(crew_id);
            RAISE NOTICE 'Created crew_invitations crew_id index';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'crew_invitations' AND indexname = 'crew_invitations_created_by_idx') THEN
            CREATE INDEX crew_invitations_created_by_idx ON crew_invitations(created_by);
            RAISE NOTICE 'Created crew_invitations created_by index';
        END IF;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in migration: %', SQLERRM;
        -- Don't fail the migration, just log the error
END $$;

-- Add RLS policies for crew_invitations (separate block to avoid conflicts)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crew_invitations') THEN
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Crew creators can create invite links" ON crew_invitations;
        DROP POLICY IF EXISTS "Crew creators can view their invite links" ON crew_invitations;
        DROP POLICY IF EXISTS "Anyone can view invite links for joining" ON crew_invitations;
        DROP POLICY IF EXISTS "Crew creators can update invite links" ON crew_invitations;
        DROP POLICY IF EXISTS "Crew creators can delete invite links" ON crew_invitations;

        -- Create policies
        CREATE POLICY "Crew creators can create invite links" ON crew_invitations
        FOR INSERT WITH CHECK (
            created_by = auth.uid() AND
            EXISTS (
                SELECT 1 FROM crews
                WHERE id = crew_invitations.crew_id
                AND created_by = auth.uid()
            )
        );

        CREATE POLICY "Anyone can view invite links for joining" ON crew_invitations
        FOR SELECT USING (true);

        CREATE POLICY "Crew creators can update invite links" ON crew_invitations
        FOR UPDATE USING (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM crews
                WHERE id = crew_invitations.crew_id
                AND created_by = auth.uid()
            )
        );

        CREATE POLICY "Crew creators can delete invite links" ON crew_invitations
        FOR DELETE USING (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM crews
                WHERE id = crew_invitations.crew_id
                AND created_by = auth.uid()
            )
        );

        RAISE NOTICE 'Created crew_invitations RLS policies';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating RLS policies: %', SQLERRM;
END $$;
