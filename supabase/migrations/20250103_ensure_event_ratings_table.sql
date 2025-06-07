-- Ensure event_ratings table exists with proper structure
-- This migration is idempotent and safe to run multiple times

-- Create event_ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS event_ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Create indexes for better query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS event_ratings_event_id_idx ON event_ratings(event_id);
CREATE INDEX IF NOT EXISTS event_ratings_user_id_idx ON event_ratings(user_id);
CREATE INDEX IF NOT EXISTS event_ratings_rating_idx ON event_ratings(rating);
CREATE INDEX IF NOT EXISTS event_ratings_created_at_idx ON event_ratings(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE event_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view event ratings for accessible events" ON event_ratings;
DROP POLICY IF EXISTS "Users can rate events they attended" ON event_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON event_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON event_ratings;

-- Create policies for event_ratings table

-- Policy: Users can view ratings for events they can access
CREATE POLICY "Users can view event ratings for accessible events"
    ON event_ratings FOR SELECT
    USING (
        -- Can view ratings for public events
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = event_ratings.event_id 
            AND e.is_public = true
        )
        OR
        -- Can view ratings for events they created
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = event_ratings.event_id 
            AND e.created_by = auth.uid()
        )
        OR
        -- Can view ratings for events they attended
        EXISTS (
            SELECT 1 FROM rsvps r 
            WHERE r.event_id = event_ratings.event_id 
            AND r.user_id = auth.uid() 
            AND r.status = 'going'
        )
        OR
        -- Can view ratings for events they were invited to as members
        EXISTS (
            SELECT 1 FROM event_members em 
            WHERE em.event_id = event_ratings.event_id 
            AND em.user_id = auth.uid() 
            AND em.status = 'accepted'
        )
    );

-- Policy: Users can insert ratings for events they attended
CREATE POLICY "Users can rate events they attended"
    ON event_ratings FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND (
            -- Can rate events they RSVP'd to as 'going'
            EXISTS (
                SELECT 1 FROM rsvps r 
                WHERE r.event_id = event_ratings.event_id 
                AND r.user_id = auth.uid() 
                AND r.status = 'going'
            )
            OR
            -- Can rate events they were invited to and accepted
            EXISTS (
                SELECT 1 FROM event_members em 
                WHERE em.event_id = event_ratings.event_id 
                AND em.user_id = auth.uid() 
                AND em.status = 'accepted'
            )
            OR
            -- Event hosts can always rate their own events
            EXISTS (
                SELECT 1 FROM events e 
                WHERE e.id = event_ratings.event_id 
                AND e.created_by = auth.uid()
            )
        )
    );

-- Policy: Users can update their own ratings
CREATE POLICY "Users can update their own ratings"
    ON event_ratings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings"
    ON event_ratings FOR DELETE
    USING (auth.uid() = user_id);

-- Create or replace function to calculate average rating for an event
CREATE OR REPLACE FUNCTION get_event_average_rating(event_uuid UUID)
RETURNS TABLE (
    average_rating NUMERIC,
    total_ratings INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROUND(AVG(rating::NUMERIC), 1) as average_rating,
        COUNT(*)::INTEGER as total_ratings
    FROM event_ratings 
    WHERE event_id = event_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace function to check if user can rate an event
CREATE OR REPLACE FUNCTION can_user_rate_event(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user attended the event or is the host
    RETURN EXISTS (
        SELECT 1 FROM rsvps r 
        WHERE r.event_id = event_uuid 
        AND r.user_id = user_uuid 
        AND r.status = 'going'
    ) OR EXISTS (
        SELECT 1 FROM event_members em 
        WHERE em.event_id = event_uuid 
        AND em.user_id = user_uuid 
        AND em.status = 'accepted'
    ) OR EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = event_uuid 
        AND e.created_by = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update notifications constraint to include rating reminder type
DO $$
BEGIN
    -- Check if notifications table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
        
        -- Add updated constraint with rating reminder type
        ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
        CHECK (type IN (
            'follow_request', 'follow_accepted', 'event_invitation', 'event_update', 
            'crew_invitation', 'event_rsvp', 'event_reminder', 'crew_invite_accepted', 
            'event_cancelled', 'event_rating_reminder'
        ));
    END IF;
END $$;
