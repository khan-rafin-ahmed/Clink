-- Performance optimizations for user events
-- This function efficiently retrieves events accessible to a user with proper privacy filtering

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_accessible_events(UUID, INTEGER);

-- Create optimized function for getting user's accessible events
CREATE OR REPLACE FUNCTION get_user_accessible_events(
  user_id UUID,
  event_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  location TEXT,
  date_time TIMESTAMPTZ,
  drink_type TEXT,
  vibe TEXT,
  notes TEXT,
  is_public BOOLEAN,
  created_by UUID,
  created_at TIMESTAMPTZ,
  rsvp_count INTEGER,
  user_rsvp_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH accessible_events AS (
    -- Events user created (both public and private)
    SELECT e.id, e.title, e.location, e.date_time, e.drink_type, e.vibe,
           e.notes, e.is_public, e.created_by, e.created_at
    FROM events e
    WHERE e.created_by = user_id
      AND e.date_time >= NOW()

    UNION

    -- Public events user RSVP'd to
    SELECT e.id, e.title, e.location, e.date_time, e.drink_type, e.vibe,
           e.notes, e.is_public, e.created_by, e.created_at
    FROM events e
    INNER JOIN rsvps r ON e.id = r.event_id
    WHERE e.is_public = true
      AND r.user_id = user_id
      AND r.status = 'going'
      AND e.date_time >= NOW()

    UNION

    -- Private events user is invited to
    SELECT e.id, e.title, e.location, e.date_time, e.drink_type, e.vibe,
           e.notes, e.is_public, e.created_by, e.created_at
    FROM events e
    INNER JOIN event_members em ON e.id = em.event_id
    WHERE e.is_public = false
      AND em.user_id = user_id
      AND em.status = 'accepted'
      AND e.date_time >= NOW()
  ),
  attendee_counts AS (
    -- Calculate total unique attendees for each event
    SELECT
      event_id,
      COUNT(DISTINCT user_id) as total_attendees
    FROM (
      -- RSVPs with status 'going'
      SELECT r.event_id, r.user_id
      FROM rsvps r
      INNER JOIN accessible_events ae ON r.event_id = ae.id
      WHERE r.status = 'going'

      UNION

      -- Event members with status 'accepted' (crew members)
      SELECT em.event_id, em.user_id
      FROM event_members em
      INNER JOIN accessible_events ae ON em.event_id = ae.id
      WHERE em.status = 'accepted'

      UNION

      -- Always include the host
      SELECT ae.id as event_id, ae.created_by as user_id
      FROM accessible_events ae
      WHERE ae.created_by IS NOT NULL
    ) all_attendees
    GROUP BY event_id
  ),
  event_stats AS (
    SELECT ae.*,
           COALESCE(ac.total_attendees, 1) as rsvp_count, -- Always at least 1 (host)
           COALESCE(user_rsvps.status, null) as user_rsvp_status
    FROM accessible_events ae
    LEFT JOIN attendee_counts ac ON ae.id = ac.event_id
    LEFT JOIN (
      SELECT event_id, status
      FROM rsvps
      WHERE rsvps.user_id = get_user_accessible_events.user_id
    ) user_rsvps ON ae.id = user_rsvps.event_id
  )
  SELECT es.id, es.title, es.location, es.date_time, es.drink_type, es.vibe,
         es.notes, es.is_public, es.created_by, es.created_at,
         es.rsvp_count, es.user_rsvp_status
  FROM event_stats es
  ORDER BY es.date_time ASC
  LIMIT event_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add additional indexes for better performance (removed CONCURRENTLY and NOW() predicate)
CREATE INDEX IF NOT EXISTS events_date_time_public_idx ON events(date_time, is_public);
CREATE INDEX IF NOT EXISTS events_created_by_date_idx ON events(created_by, date_time);
CREATE INDEX IF NOT EXISTS rsvps_event_status_idx ON rsvps(event_id, status);
CREATE INDEX IF NOT EXISTS rsvps_user_event_idx ON rsvps(user_id, event_id);
CREATE INDEX IF NOT EXISTS event_members_user_status_idx ON event_members(user_id, status);

-- Create materialized view for popular events (optional - for future use)
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_events AS
SELECT
  e.id,
  e.title,
  e.location,
  e.date_time,
  e.drink_type,
  e.vibe,
  e.is_public,
  COUNT(r.id) FILTER (WHERE r.status = 'going') as going_count,
  COUNT(r.id) as total_rsvps
FROM events e
LEFT JOIN rsvps r ON e.id = r.event_id
WHERE e.is_public = true
  AND e.date_time >= NOW()
GROUP BY e.id, e.title, e.location, e.date_time, e.drink_type, e.vibe, e.is_public
ORDER BY going_count DESC, total_rsvps DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS popular_events_going_count_idx ON popular_events(going_count DESC);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_accessible_events(UUID, INTEGER) TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';