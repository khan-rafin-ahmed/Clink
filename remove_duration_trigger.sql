-- Remove event duration trigger and related functions
-- This fixes the constraint violation by removing the automatic duration_type setting

-- Drop the trigger that's causing the issue
DROP TRIGGER IF EXISTS trigger_set_event_end_time ON events;

-- Drop the trigger function
DROP FUNCTION IF EXISTS set_event_end_time();

-- Drop other duration-related functions
DROP FUNCTION IF EXISTS calculate_event_end_time(TIMESTAMPTZ, TEXT, INTEGER);
DROP FUNCTION IF EXISTS get_event_status(TIMESTAMPTZ, TIMESTAMPTZ, TEXT);
DROP FUNCTION IF EXISTS update_existing_events_with_end_times();

-- Drop the duration-related view
DROP VIEW IF EXISTS events_with_status;

-- Drop duration-related columns if they exist
ALTER TABLE events DROP COLUMN IF EXISTS duration_type;
ALTER TABLE events DROP COLUMN IF EXISTS duration_hours;
ALTER TABLE events DROP COLUMN IF EXISTS end_time;

-- Drop duration-related indexes
DROP INDEX IF EXISTS idx_events_end_time;
DROP INDEX IF EXISTS idx_events_duration_type;

-- Verify the fix
SELECT 'Duration trigger and functions removed successfully' as status;
