-- Create enum for RSVP status
CREATE TYPE rsvp_status AS ENUM ('going', 'maybe', 'not_going');

-- Create events table
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RSVPs table
CREATE TABLE rsvps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status rsvp_status NOT NULL DEFAULT 'maybe',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX events_created_by_idx ON events(created_by);
CREATE INDEX rsvps_event_id_idx ON rsvps(event_id);
CREATE INDEX rsvps_user_id_idx ON rsvps(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
CREATE POLICY "Events are viewable by everyone"
    ON events FOR SELECT
    USING (true);

CREATE POLICY "Users can create events"
    ON events FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events"
    ON events FOR UPDATE
    USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events"
    ON events FOR DELETE
    USING (auth.uid() = created_by);

-- Create policies for rsvps table
CREATE POLICY "RSVPs are viewable by everyone"
    ON rsvps FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own RSVPs"
    ON rsvps FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own RSVPs"
    ON rsvps FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own RSVPs"
    ON rsvps FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at
    BEFORE UPDATE ON rsvps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 