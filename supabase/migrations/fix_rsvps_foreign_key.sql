-- CRITICAL PRIVACY AND DATA INTEGRITY FIXES
-- This migration addresses serious privacy violations and duplicate event issues

-- Step 1: Fix RLS policies to prevent privacy violations and infinite recursion
-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Private events viewable by creator" ON events;
DROP POLICY IF EXISTS "Private events viewable by accepted members" ON events;
DROP POLICY IF EXISTS "Private events are viewable by creator and invited members" ON events;
DROP POLICY IF EXISTS "Public events viewable by all" ON events;
DROP POLICY IF EXISTS "Private events viewable by invited members only" ON events;
DROP POLICY IF EXISTS "Users can view public events" ON events;
DROP POLICY IF EXISTS "Users can view their created events" ON events;
DROP POLICY IF EXISTS "Users can view events they're invited to" ON events;
DROP POLICY IF EXISTS "events_select_policy" ON events;

-- Create simple, non-recursive RLS policies for events
CREATE POLICY "events_select_policy" ON events
FOR SELECT USING (
    -- Public events are visible to everyone
    is_public = true
    OR
    -- Private events are visible to creator
    (is_public = false AND created_by = auth.uid())
    OR
    -- Private events are visible to accepted members
    (is_public = false AND id IN (
        SELECT em.event_id
        FROM event_members em
        WHERE em.user_id = auth.uid()
        AND em.status = 'accepted'
    ))
);

-- Step 2: Fix RSVP policies to respect event privacy
DROP POLICY IF EXISTS "RSVPs for public events are viewable" ON rsvps;
DROP POLICY IF EXISTS "Users can view RSVPs for events they have access to" ON rsvps;
DROP POLICY IF EXISTS "RSVPs viewable for accessible events only" ON rsvps;

CREATE POLICY "RSVPs viewable for accessible events only" ON rsvps
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = rsvps.event_id
        AND (
            -- Public events
            e.is_public = true
            OR
            -- User is the event creator
            e.created_by = auth.uid()
            OR
            -- User is invited to private event
            EXISTS (
                SELECT 1 FROM event_members em
                WHERE em.event_id = e.id
                AND em.user_id = auth.uid()
                AND em.status = 'accepted'
            )
        )
    )
);

-- Step 3: Fix event_members and rsvps policies
DROP POLICY IF EXISTS "Event members viewable for accessible events only" ON event_members;
DROP POLICY IF EXISTS "Event members are viewable for accessible events only" ON event_members;
DROP POLICY IF EXISTS "Users can view event members for accessible events" ON event_members;

CREATE POLICY "Event members viewable for accessible events only" ON event_members
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_members.event_id
        AND (
            -- Public events are visible to everyone
            e.is_public = true
            OR
            -- Private events are visible to creator
            (e.is_public = false AND e.created_by = auth.uid())
            OR
            -- Private events are visible to accepted members
            (e.is_public = false AND e.id IN (
                SELECT em.event_id
                FROM event_members em
                WHERE em.user_id = auth.uid()
                AND em.status = 'accepted'
            ))
        )
    )
);

-- Step 4: Fix foreign key relationships for data integrity
DO $$
BEGIN
    -- Add foreign key constraint for rsvps.user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'rsvps_user_id_fkey'
        AND table_name = 'rsvps'
    ) THEN
        ALTER TABLE rsvps
        ADD CONSTRAINT rsvps_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint rsvps_user_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint rsvps_user_id_fkey already exists';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding rsvps foreign key: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Add foreign key constraint for event_members.user_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_members_user_id_fkey'
        AND table_name = 'event_members'
    ) THEN
        ALTER TABLE event_members
        ADD CONSTRAINT event_members_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added foreign key constraint event_members_user_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint event_members_user_id_fkey already exists';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding event_members user_id foreign key: %', SQLERRM;
END $$;

DO $$
BEGIN
    -- Add foreign key constraint for event_members.invited_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_members_invited_by_fkey'
        AND table_name = 'event_members'
    ) THEN
        ALTER TABLE event_members
        ADD CONSTRAINT event_members_invited_by_fkey
        FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added foreign key constraint event_members_invited_by_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint event_members_invited_by_fkey already exists';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding event_members invited_by foreign key: %', SQLERRM;
END $$;

-- Step 5: Fix notification types to include event_rsvp
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN ('follow_request', 'follow_accepted', 'event_invitation', 'event_update', 'crew_invitation', 'event_rsvp', 'event_reminder', 'crew_invite_accepted', 'event_cancelled'));

-- Step 6: Create RPC function to get public events for Discover page (bypasses RLS)
DROP FUNCTION IF EXISTS get_public_events_for_discover(INTEGER);
CREATE OR REPLACE FUNCTION get_public_events_for_discover(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  title TEXT,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  place_id TEXT,
  place_name TEXT,
  date_time TIMESTAMP WITH TIME ZONE,
  drink_type TEXT,
  vibe TEXT,
  notes TEXT,
  is_public BOOLEAN,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  event_code TEXT,
  public_slug TEXT,
  private_slug TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.title, e.location, e.latitude, e.longitude, e.place_id, e.place_name,
         e.date_time, e.drink_type, e.vibe, e.notes, e.is_public, e.created_by,
         e.created_at, e.updated_at, e.event_code, e.public_slug, e.private_slug
  FROM events e
  WHERE e.is_public = true
    AND e.date_time >= NOW()
  ORDER BY e.date_time ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_public_events_for_discover(INTEGER) TO anon, authenticated;

-- Step 7: Refresh the schema cache
NOTIFY pgrst, 'reload schema';
