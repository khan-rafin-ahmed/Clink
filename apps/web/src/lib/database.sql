-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  drink_type TEXT NOT NULL,
  vibe TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all events
CREATE POLICY "Anyone can view events" ON events
  FOR SELECT USING (true);

-- Policy: Users can insert their own events
CREATE POLICY "Users can insert their own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own events
CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() = created_by);

-- Policy: Users can delete their own events
CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (auth.uid() = created_by);

-- Create RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create RLS policies for RSVPs
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view RSVPs
CREATE POLICY "Anyone can view rsvps" ON rsvps
  FOR SELECT USING (true);

-- Policy: Users can insert their own RSVPs
CREATE POLICY "Users can insert their own rsvps" ON rsvps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own RSVPs
CREATE POLICY "Users can update their own rsvps" ON rsvps
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own RSVPs
CREATE POLICY "Users can delete their own rsvps" ON rsvps
  FOR DELETE USING (auth.uid() = user_id);
