-- Add support for event duration and "All Night" events
-- This migration adds end_time support and updates event status logic

-- Add end_time column to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Add duration_type column to track different duration types
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS duration_type TEXT 
CHECK (duration_type IN ('specific_time', 'all_night', 'custom_duration')) 
DEFAULT 'specific_time';

-- Add duration_hours column for custom durations
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS duration_hours INTEGER;

-- Create index for better performance on end_time queries
CREATE INDEX IF NOT EXISTS idx_events_end_time ON events (end_time);
CREATE INDEX IF NOT EXISTS idx_events_duration_type ON events (duration_type);

-- Function to calculate event end time based on duration type
CREATE OR REPLACE FUNCTION calculate_event_end_time(
  p_start_time TIMESTAMPTZ,
  p_duration_type TEXT,
  p_duration_hours INTEGER DEFAULT NULL
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE p_duration_type
    WHEN 'all_night' THEN
      -- All night events end at midnight the next day
      RETURN DATE_TRUNC('day', p_start_time) + INTERVAL '1 day';
    WHEN 'custom_duration' THEN
      -- Custom duration in hours
      IF p_duration_hours IS NOT NULL THEN
        RETURN p_start_time + (p_duration_hours || ' hours')::INTERVAL;
      ELSE
        -- Default to 3 hours if no duration specified
        RETURN p_start_time + INTERVAL '3 hours';
      END IF;
    ELSE
      -- Default: specific_time events end 3 hours after start
      RETURN p_start_time + INTERVAL '3 hours';
  END CASE;
END;
$$;

-- Function to get event status considering duration
CREATE OR REPLACE FUNCTION get_event_status(
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ DEFAULT NULL,
  p_duration_type TEXT DEFAULT 'specific_time'
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  current_time TIMESTAMPTZ := NOW();
  calculated_end_time TIMESTAMPTZ;
BEGIN
  -- Calculate end time if not provided
  IF p_end_time IS NULL THEN
    calculated_end_time := calculate_event_end_time(p_start_time, p_duration_type, NULL);
  ELSE
    calculated_end_time := p_end_time;
  END IF;
  
  -- Determine status
  IF current_time < p_start_time THEN
    -- Event hasn't started yet
    IF DATE_TRUNC('day', current_time) = DATE_TRUNC('day', p_start_time) THEN
      RETURN 'today';
    ELSIF DATE_TRUNC('day', current_time) + INTERVAL '1 day' = DATE_TRUNC('day', p_start_time) THEN
      RETURN 'tomorrow';
    ELSE
      RETURN 'upcoming';
    END IF;
  ELSIF current_time >= p_start_time AND current_time <= calculated_end_time THEN
    -- Event is currently happening
    RETURN 'current';
  ELSE
    -- Event has ended
    RETURN 'past';
  END IF;
END;
$$;

-- Function to update existing events with calculated end times
CREATE OR REPLACE FUNCTION update_existing_events_with_end_times()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Update events that don't have end_time set
  UPDATE events 
  SET 
    end_time = calculate_event_end_time(date_time, COALESCE(duration_type, 'specific_time'), duration_hours),
    duration_type = COALESCE(duration_type, 'specific_time')
  WHERE end_time IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;

-- Trigger to automatically set end_time when inserting/updating events
CREATE OR REPLACE FUNCTION set_event_end_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only calculate end_time if not explicitly provided
  IF NEW.end_time IS NULL THEN
    NEW.end_time := calculate_event_end_time(
      NEW.date_time, 
      COALESCE(NEW.duration_type, 'specific_time'), 
      NEW.duration_hours
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic end_time calculation
DROP TRIGGER IF EXISTS trigger_set_event_end_time ON events;
CREATE TRIGGER trigger_set_event_end_time
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_event_end_time();

-- Update existing events with calculated end times
SELECT update_existing_events_with_end_times();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_event_end_time(TIMESTAMPTZ, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_status(TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_existing_events_with_end_times() TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION calculate_event_end_time IS 'Calculate event end time based on start time and duration type';
COMMENT ON FUNCTION get_event_status IS 'Get current status of an event considering its duration';
COMMENT ON FUNCTION update_existing_events_with_end_times IS 'Update existing events with calculated end times';

-- Create view for events with calculated status
CREATE OR REPLACE VIEW events_with_status AS
SELECT 
  e.*,
  get_event_status(e.date_time, e.end_time, e.duration_type) as current_status,
  CASE 
    WHEN e.duration_type = 'all_night' THEN 'All Night'
    WHEN e.duration_type = 'custom_duration' AND e.duration_hours IS NOT NULL THEN 
      e.duration_hours || ' hours'
    ELSE 
      EXTRACT(EPOCH FROM (e.end_time - e.date_time)) / 3600 || ' hours'
  END as duration_display
FROM events e;

-- Grant access to the view
GRANT SELECT ON events_with_status TO authenticated;

COMMENT ON VIEW events_with_status IS 'Events table with calculated status and duration display';
