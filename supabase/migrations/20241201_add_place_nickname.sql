-- Add place_nickname column to events table
-- Run this in Supabase SQL Editor

-- Check if column already exists and add it if it doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'place_nickname'
    ) THEN
        ALTER TABLE events ADD COLUMN place_nickname TEXT;
        RAISE NOTICE 'place_nickname column added successfully';
    ELSE
        RAISE NOTICE 'place_nickname column already exists';
    END IF;
END $$;

-- Create index for better query performance on place_nickname
CREATE INDEX IF NOT EXISTS events_place_nickname_idx ON events(place_nickname);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' AND column_name = 'place_nickname';
