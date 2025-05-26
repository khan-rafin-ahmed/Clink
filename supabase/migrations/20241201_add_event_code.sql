-- Add event_code column to events table for shareable links
ALTER TABLE events ADD COLUMN event_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX events_event_code_idx ON events(event_code);

-- Add constraint to ensure event_code is not null for new events
-- (existing events can have null event_code for backward compatibility)
ALTER TABLE events ADD CONSTRAINT events_event_code_format 
CHECK (event_code IS NULL OR (event_code ~ '^[A-Z0-9]{6}$'));

-- Function to generate event codes for existing events (optional)
CREATE OR REPLACE FUNCTION generate_event_code_for_existing()
RETURNS void AS $$
DECLARE
    event_record RECORD;
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    -- Loop through events that don't have an event_code
    FOR event_record IN 
        SELECT id FROM events WHERE event_code IS NULL
    LOOP
        -- Generate a unique code
        LOOP
            new_code := '';
            -- Generate 6 character code
            FOR i IN 1..6 LOOP
                new_code := new_code || substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 
                    floor(random() * 36 + 1)::int, 1);
            END LOOP;
            
            -- Check if code already exists
            SELECT EXISTS(SELECT 1 FROM events WHERE event_code = new_code) INTO code_exists;
            
            -- If code doesn't exist, use it
            IF NOT code_exists THEN
                EXIT;
            END IF;
        END LOOP;
        
        -- Update the event with the new code
        UPDATE events SET event_code = new_code WHERE id = event_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Uncomment the line below if you want to generate codes for existing events
-- SELECT generate_event_code_for_existing();
