-- Fix get_user_accessible_events function to include creator information
-- This resolves the issue where profile events show empty and event details fail

-- Drop the existing function
DROP FUNCTION IF EXISTS get_user_accessible_events(UUID, BOOLEAN, INTEGER);

-- Create the fixed function with creator information
CREATE OR REPLACE FUNCTION get_user_accessible_events(
  user_id UUID,
  include_past BOOLEAN DEFAULT false,
  event_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  place_id TEXT,
  place_name TEXT,
  date_time TIMESTAMPTZ,
  drink_type TEXT,
  vibe TEXT,
  notes TEXT,
  is_public BOOLEAN,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  event_code TEXT,
  public_slug TEXT,
  private_slug TEXT,
  rsvp_count INTEGER,
  user_rsvp_status TEXT,
  creator_display_name TEXT,
  creator_nickname TEXT,
  creator_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH accessible_events AS (
    -- Events user created (both public and private)
    SELECT e.id, e.title, e.location, e.latitude, e.longitude, e.place_id, e.place_name,
           e.date_time, e.drink_type, e.vibe, e.notes, e.is_public, e.created_by,
           e.created_at, e.updated_at, e.event_code, e.public_slug, e.private_slug
    FROM events e
    WHERE e.created_by = get_user_accessible_events.user_id
      AND (
        (include_past = false AND e.date_time >= NOW()) OR
        (include_past = true AND e.date_time < NOW())
      )

    UNION

    -- Public events user RSVP'd to (but didn't create)
    SELECT e.id, e.title, e.location, e.latitude, e.longitude, e.place_id, e.place_name,
           e.date_time, e.drink_type, e.vibe, e.notes, e.is_public, e.created_by,
           e.created_at, e.updated_at, e.event_code, e.public_slug, e.private_slug
    FROM events e
    INNER JOIN rsvps r ON e.id = r.event_id
    WHERE e.is_public = true
      AND r.user_id = get_user_accessible_events.user_id
      AND r.status = 'going'
      AND e.created_by != get_user_accessible_events.user_id
      AND (
        (include_past = false AND e.date_time >= NOW()) OR
        (include_past = true AND e.date_time < NOW())
      )

    UNION

    -- Private events user was invited to and accepted
    SELECT e.id, e.title, e.location, e.latitude, e.longitude, e.place_id, e.place_name,
           e.date_time, e.drink_type, e.vibe, e.notes, e.is_public, e.created_by,
           e.created_at, e.updated_at, e.event_code, e.public_slug, e.private_slug
    FROM events e
    INNER JOIN event_members em ON e.id = em.event_id
    WHERE e.is_public = false
      AND em.user_id = get_user_accessible_events.user_id
      AND em.status = 'accepted'
      AND e.created_by != get_user_accessible_events.user_id
      AND (
        (include_past = false AND e.date_time >= NOW()) OR
        (include_past = true AND e.date_time < NOW())
      )
  ),
  attendee_counts AS (
    SELECT 
      ae.id as event_id,
      (
        1 + -- Host always counts as 1
        COALESCE((
          SELECT COUNT(DISTINCT r.user_id)
          FROM rsvps r
          WHERE r.event_id = ae.id
            AND r.status = 'going'
            AND r.user_id != ae.created_by -- Don't double-count host
        ), 0) +
        COALESCE((
          SELECT COUNT(DISTINCT em.user_id)
          FROM event_members em
          WHERE em.event_id = ae.id
            AND em.status = 'accepted'
            AND em.user_id != ae.created_by -- Don't double-count host
        ), 0)
      ) as total_attendees
    FROM accessible_events ae
  ),
  event_stats AS (
    SELECT ae.*,
           COALESCE(ac.total_attendees, 1) as rsvp_count, -- Always at least 1 (host)
           COALESCE(user_rsvps.status, null) as user_rsvp_status
    FROM accessible_events ae
    LEFT JOIN attendee_counts ac ON ae.id = ac.event_id
    LEFT JOIN (
      SELECT r.event_id, r.status
      FROM rsvps r
      WHERE r.user_id = get_user_accessible_events.user_id
    ) user_rsvps ON ae.id = user_rsvps.event_id
  )
  SELECT es.id, es.title, es.location, es.latitude, es.longitude, es.place_id, es.place_name,
         es.date_time, es.drink_type, es.vibe, es.notes, es.is_public, es.created_by,
         es.created_at, es.updated_at, es.event_code, es.public_slug, es.private_slug,
         es.rsvp_count, es.user_rsvp_status,
         up.display_name as creator_display_name,
         up.nickname as creator_nickname,
         up.avatar_url as creator_avatar_url
  FROM event_stats es
  LEFT JOIN user_profiles up ON es.created_by = up.user_id
  ORDER BY
    es.date_time ASC
  LIMIT event_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_accessible_events(UUID, BOOLEAN, INTEGER) TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
