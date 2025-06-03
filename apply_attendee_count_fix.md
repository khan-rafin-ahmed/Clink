# Apply Attendee Count Fix

## Instructions

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the following SQL to fix the attendee count consistency issue:

```sql
-- Fix attendee count consistency across profile and event detail pages
-- This ensures the profile event cards show the same count as the event details page
-- by properly counting host + RSVPs + crew members with deduplication

-- Drop and recreate the get_user_accessible_events function with proper attendee counting
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
  event_stats AS (
    SELECT ae.*,
           COALESCE(attendee_counts.total_attendees, 1) as rsvp_count, -- Always at least 1 (host)
           COALESCE(user_rsvps.status, null) as user_rsvp_status
    FROM accessible_events ae
    LEFT JOIN (
      -- Calculate total unique attendees (RSVPs + crew members + host)
      SELECT 
        ae_inner.id as event_id,
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
```

## What this fixes

- **Profile event cards** now show the same attendee count as **Event Details** pages
- Properly counts: Host (always +1) + RSVPs with status 'going' + Crew members with status 'accepted'
- Deduplicates attendees (if someone is both RSVP'd and a crew member, they're only counted once)
- Ensures minimum count of 1 (the host is always attending)

## Frontend changes

The EventCard component has been updated to handle both scenarios:
- When event data comes from RPC function (uses computed `rsvp_count`)
- When event data comes with full RSVP/member arrays (uses `calculateAttendeeCount` utility)

This ensures consistent behavior across all pages in the app.
