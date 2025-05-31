-- Fix foreign key relationships for rsvps table
-- This ensures proper relationships between tables

-- Step 1: Check if rsvps table has proper foreign key to auth.users
DO $$
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'rsvps_user_id_fkey' 
        AND table_name = 'rsvps'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE rsvps 
        ADD CONSTRAINT rsvps_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint rsvps_user_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint rsvps_user_id_fkey already exists';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding foreign key: %', SQLERRM;
        -- Don't fail the migration
END $$;

-- Step 2: Check if event_members table has proper foreign key to auth.users
DO $$
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'event_members_user_id_fkey' 
        AND table_name = 'event_members'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE event_members 
        ADD CONSTRAINT event_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint event_members_user_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint event_members_user_id_fkey already exists';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding foreign key: %', SQLERRM;
        -- Don't fail the migration
END $$;

-- Step 3: Check if event_members table has proper foreign key for invited_by
DO $$
BEGIN
    -- Add foreign key constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'event_members_invited_by_fkey' 
        AND table_name = 'event_members'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE event_members 
        ADD CONSTRAINT event_members_invited_by_fkey 
        FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added foreign key constraint event_members_invited_by_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint event_members_invited_by_fkey already exists';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding foreign key: %', SQLERRM;
        -- Don't fail the migration
END $$;

-- Step 4: Refresh the schema cache
NOTIFY pgrst, 'reload schema';
