-- FINAL ATTENDEE COUNT CONSISTENCY FIX
-- This SQL fixes all SQL errors and ensures profile event cards show the same count as event detail pages
-- Fixed issues: ambiguous user_id references, immutable function errors, transaction block errors

-- Drop and recreate the get_user_accessible_events function with corrected SQL
DROP FUNCTION IF EXISTS get_user_accessible_events(UUID, BOOLEAN, INTEGER);

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
  user_rsvp_status TEXT
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

    -- Private events user is invited to as crew member
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
    -- Calculate total unique attendees for each event
    SELECT
      all_attendees.event_id,
      COUNT(DISTINCT all_attendees.user_id)::INTEGER as total_attendees
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
    GROUP BY all_attendees.event_id
  ),
  event_stats AS (
    SELECT ae.*,
           COALESCE(ac.total_attendees, 1) as rsvp_count, -- Always at least 1 (host)
           COALESCE(user_rsvps.status::TEXT, null) as user_rsvp_status
    FROM accessible_events ae
    LEFT JOIN attendee_counts ac ON ae.id = ac.event_id
    LEFT JOIN (
      SELECT event_id, status
      FROM rsvps
      WHERE rsvps.user_id = get_user_accessible_events.user_id
    ) user_rsvps ON ae.id = user_rsvps.event_id
  )
  SELECT es.id, es.title, es.location, es.latitude, es.longitude, es.place_id, es.place_name,
         es.date_time, es.drink_type, es.vibe, es.notes, es.is_public, es.created_by,
         es.created_at, es.updated_at, es.event_code, es.public_slug, es.private_slug,
         es.rsvp_count, es.user_rsvp_status
  FROM event_stats es
  ORDER BY
    es.date_time ASC
  LIMIT event_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_accessible_events(UUID, BOOLEAN, INTEGER) TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
