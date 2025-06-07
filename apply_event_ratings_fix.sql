-- MANUAL FIX FOR EVENT RATINGS TABLE
-- Run this in your Supabase SQL Editor to fix the missing event_ratings table

-- Step 1: Create event_ratings table if it doesn't exist
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

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS event_ratings_event_id_idx ON event_ratings(event_id);
CREATE INDEX IF NOT EXISTS event_ratings_user_id_idx ON event_ratings(user_id);
CREATE INDEX IF NOT EXISTS event_ratings_rating_idx ON event_ratings(rating);
CREATE INDEX IF NOT EXISTS event_ratings_created_at_idx ON event_ratings(created_at);

-- Step 3: Enable Row Level Security
ALTER TABLE event_ratings ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
CREATE POLICY "Users can view event ratings for accessible events"
    ON event_ratings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = event_ratings.event_id 
            AND e.is_public = true
        )
        OR
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = event_ratings.event_id 
            AND e.created_by = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM rsvps r 
            WHERE r.event_id = event_ratings.event_id 
            AND r.user_id = auth.uid() 
            AND r.status = 'going'
        )
        OR
        EXISTS (
            SELECT 1 FROM event_members em 
            WHERE em.event_id = event_ratings.event_id 
            AND em.user_id = auth.uid() 
            AND em.status = 'accepted'
        )
    );

CREATE POLICY "Users can rate events they attended"
    ON event_ratings FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND (
            EXISTS (
                SELECT 1 FROM rsvps r 
                WHERE r.event_id = event_ratings.event_id 
                AND r.user_id = auth.uid() 
                AND r.status = 'going'
            )
            OR
            EXISTS (
                SELECT 1 FROM event_members em 
                WHERE em.event_id = event_ratings.event_id 
                AND em.user_id = auth.uid() 
                AND em.status = 'accepted'
            )
            OR
            EXISTS (
                SELECT 1 FROM events e 
                WHERE e.id = event_ratings.event_id 
                AND e.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own ratings"
    ON event_ratings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
    ON event_ratings FOR DELETE
    USING (auth.uid() = user_id);

-- Step 5: Create helper functions
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

CREATE OR REPLACE FUNCTION can_user_rate_event(event_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
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

-- Step 6: Verify the table was created
SELECT 'event_ratings table created successfully!' as status;
SELECT COUNT(*) as existing_ratings FROM event_ratings;
