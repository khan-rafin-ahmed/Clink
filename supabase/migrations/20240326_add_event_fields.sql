-- Add missing fields to events table for QuickEventModal
ALTER TABLE events 
ADD COLUMN drink_type TEXT,
ADD COLUMN vibe TEXT;

-- Add some constraints for the new fields
ALTER TABLE events 
ADD CONSTRAINT events_drink_type_check 
CHECK (drink_type IN ('beer', 'wine', 'cocktails', 'shots', 'mixed', 'other') OR drink_type IS NULL);

ALTER TABLE events 
ADD CONSTRAINT events_vibe_check 
CHECK (vibe IN ('casual', 'party', 'chill', 'wild', 'classy', 'other') OR vibe IS NULL);

-- Create indexes for better query performance
CREATE INDEX events_drink_type_idx ON events(drink_type);
CREATE INDEX events_vibe_idx ON events(vibe);
