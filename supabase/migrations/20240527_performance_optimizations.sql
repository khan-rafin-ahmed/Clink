-- Performance optimization migration
-- Run this AFTER the privacy migration

-- Create optimized function for follow counts
CREATE OR REPLACE FUNCTION get_follow_counts(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
  follower_count INTEGER;
  following_count INTEGER;
BEGIN
  -- Get follower count
  SELECT COUNT(*) INTO follower_count
  FROM user_follows
  WHERE following_id = target_user_id;
  
  -- Get following count
  SELECT COUNT(*) INTO following_count
  FROM user_follows
  WHERE follower_id = target_user_id;
  
  -- Return as JSON
  RETURN json_build_object(
    'followers', follower_count,
    'following', following_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's accessible events efficiently
CREATE OR REPLACE FUNCTION get_user_accessible_events(user_id UUID, event_limit INTEGER DEFAULT 25)
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
    -- Public events
    SELECT e.id, e.title, e.location, e.date_time, e.drink_type, e.vibe, 
           e.notes, e.is_public, e.created_by, e.created_at
    FROM events e
    WHERE e.is_public = true
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
  event_stats AS (
    SELECT ae.*,
           COALESCE(attendee_counts.total_attendees, 1) as rsvp_count, -- Always at least 1 (host)
           COALESCE(user_rsvps.status, null) as user_rsvp_status
    FROM accessible_events ae
    LEFT JOIN (
      -- Calculate total unique attendees (RSVPs + crew members + host)
      SELECT
        event_id,
        (
          -- Count unique attendees from RSVPs and event_members
          SELECT COUNT(DISTINCT user_id)
          FROM (
            -- RSVPs with status 'going'
            SELECT r.user_id
            FROM rsvps r
            WHERE r.event_id = ae_inner.id AND r.status = 'going'

            UNION

            -- Event members with status 'accepted' (crew members)
            SELECT em.user_id
            FROM event_members em
            WHERE em.event_id = ae_inner.id AND em.status = 'accepted'

            UNION

            -- Always include the host
            SELECT ae_inner.created_by
            WHERE ae_inner.created_by IS NOT NULL
          ) unique_attendees
        ) as total_attendees
      FROM accessible_events ae_inner
    ) attendee_counts ON ae.id = attendee_counts.event_id
    LEFT JOIN (
      SELECT event_id, status
      FROM rsvps
      WHERE user_id = user_id
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

-- Add additional indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS events_date_time_public_idx ON events(date_time, is_public) WHERE date_time >= NOW();
CREATE INDEX CONCURRENTLY IF NOT EXISTS events_created_by_date_idx ON events(created_by, date_time);
CREATE INDEX CONCURRENTLY IF NOT EXISTS rsvps_event_status_idx ON rsvps(event_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS rsvps_user_event_idx ON rsvps(user_id, event_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS event_members_user_status_idx ON event_members(user_id, status);

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

-- Function to refresh popular events (call this periodically)
CREATE OR REPLACE FUNCTION refresh_popular_events()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optimize RLS policies to use indexes better
DROP POLICY IF EXISTS "Private events are viewable by creator and invited members" ON events;

-- Split into separate policies for better performance
CREATE POLICY "Private events viewable by creator"
    ON events FOR SELECT
    USING (is_public = false AND auth.uid() = created_by);

CREATE POLICY "Private events viewable by accepted members"
    ON events FOR SELECT
    USING (is_public = false AND EXISTS (
        SELECT 1 FROM event_members 
        WHERE event_id = events.id 
          AND user_id = auth.uid() 
          AND status = 'accepted'
    ));

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_follow_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_accessible_events(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_popular_events() TO authenticated;
