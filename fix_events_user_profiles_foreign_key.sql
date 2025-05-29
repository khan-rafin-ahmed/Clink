-- Fix Events to User Profiles Foreign Key Relationship
-- This fixes the "Could not find a relationship" error in Supabase queries
-- Run this in Supabase SQL Editor

-- Check current foreign key constraints on events table
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'events';

-- Check if the foreign key already exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_created_by_fkey' 
    AND table_name = 'events'
) as fkey_exists;

-- Create the foreign key constraint if it doesn't exist
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'events_created_by_fkey' 
        AND table_name = 'events'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE events 
        ADD CONSTRAINT events_created_by_fkey 
        FOREIGN KEY (created_by) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint events_created_by_fkey created successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint events_created_by_fkey already exists';
    END IF;
END $$;

-- Verify the constraint was created
SELECT 
    'Foreign key verification' as check_type,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'events'
    AND tc.constraint_name = 'events_created_by_fkey';

-- Alternative: Create a view that joins events with user_profiles for easier querying
CREATE OR REPLACE VIEW events_with_creators AS
SELECT 
    e.*,
    up.display_name as creator_display_name,
    up.avatar_url as creator_avatar_url
FROM events e
LEFT JOIN user_profiles up ON e.created_by = up.user_id;

-- Grant permissions on the view
GRANT SELECT ON events_with_creators TO authenticated;
GRANT SELECT ON events_with_creators TO anon;

-- Test the relationship by running a sample query
SELECT 
    'Test query' as test_type,
    COUNT(*) as event_count
FROM events e
LEFT JOIN user_profiles up ON e.created_by = up.user_id
WHERE e.created_at > NOW() - INTERVAL '30 days';

RAISE NOTICE 'Foreign key relationship fix completed successfully';
