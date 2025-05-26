-- Add missing columns to events table if they don't exist
DO $$ 
BEGIN
    -- Add drink_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'drink_type'
    ) THEN
        ALTER TABLE events ADD COLUMN drink_type TEXT;
    END IF;

    -- Add vibe column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'events' AND column_name = 'vibe'
    ) THEN
        ALTER TABLE events ADD COLUMN vibe TEXT;
    END IF;
END $$;
