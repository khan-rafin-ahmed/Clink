-- Manual SQL script to apply all fixes for cover upload, event creator info, and search
-- Apply this directly in Supabase SQL Editor

-- 1. Create event-covers storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'event-covers',
    'event-covers',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Create storage policies for event covers
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition)
VALUES (
    'event-covers-select',
    'event-covers',
    'Event covers are publicly accessible',
    'bucket_id = ''event-covers''',
    'bucket_id = ''event-covers'''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition)
VALUES (
    'event-covers-insert',
    'event-covers',
    'Authenticated users can upload event covers',
    'bucket_id = ''event-covers'' AND auth.uid() IS NOT NULL',
    'bucket_id = ''event-covers'' AND auth.uid() IS NOT NULL'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition)
VALUES (
    'event-covers-update',
    'event-covers',
    'Users can update their own event covers',
    'bucket_id = ''event-covers'' AND auth.uid()::text = (storage.foldername(name))[1]',
    'bucket_id = ''event-covers'' AND auth.uid()::text = (storage.foldername(name))[1]'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition)
VALUES (
    'event-covers-delete',
    'event-covers',
    'Users can delete their own event covers',
    'bucket_id = ''event-covers'' AND auth.uid()::text = (storage.foldername(name))[1]',
    'bucket_id = ''event-covers'' AND auth.uid()::text = (storage.foldername(name))[1]'
) ON CONFLICT (id) DO NOTHING;

-- 3. Drop existing functions to recreate with creator info
DROP FUNCTION IF EXISTS get_public_events_for_discover(INTEGER);
DROP FUNCTION IF EXISTS get_user_accessible_events(UUID, BOOLEAN, INTEGER);

-- 4. Create improved get_public_events_for_discover function with creator info
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
  private_slug TEXT,
  cover_image_url TEXT,
  creator_display_name TEXT,
  creator_nickname TEXT,
  creator_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.title, e.location, e.latitude, e.longitude, e.place_id, e.place_name,
         e.date_time, e.drink_type, e.vibe, e.notes, e.is_public, e.created_by,
         e.created_at, e.updated_at, e.event_code, e.public_slug, e.private_slug,
         e.cover_image_url,
         up.display_name as creator_display_name,
         up.nickname as creator_nickname,
         up.avatar_url as creator_avatar_url
  FROM events e
  LEFT JOIN user_profiles up ON e.created_by = up.user_id
  WHERE e.is_public = true
    AND e.date_time >= NOW()
  ORDER BY e.date_time ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create improved get_user_accessible_events function with creator info
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
  cover_image_url TEXT,
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
           e.created_at, e.updated_at, e.event_code, e.public_slug, e.private_slug,
           e.cover_image_url
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
           e.created_at, e.updated_at, e.event_code, e.public_slug, e.private_slug,
           e.cover_image_url
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

    -- Private events user is a member of (but didn't create)
    SELECT e.id, e.title, e.location, e.latitude, e.longitude, e.place_id, e.place_name,
           e.date_time, e.drink_type, e.vibe, e.notes, e.is_public, e.created_by,
           e.created_at, e.updated_at, e.event_code, e.public_slug, e.private_slug,
           e.cover_image_url
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
           -- Calculate RSVP count (host + accepted RSVPs + accepted crew members)
           (1 + 
            COALESCE((SELECT COUNT(*) FROM rsvps r WHERE r.event_id = ae.id AND r.status = 'going'), 0) +
            COALESCE((SELECT COUNT(*) FROM event_members em WHERE em.event_id = ae.id AND em.status = 'accepted'), 0)
           ) as rsvp_count,
           -- Get user's RSVP status
           COALESCE(
             (SELECT r.status::text FROM rsvps r WHERE r.event_id = ae.id AND r.user_id = get_user_accessible_events.user_id),
             CASE 
               WHEN ae.created_by = get_user_accessible_events.user_id THEN 'host'
               WHEN EXISTS(SELECT 1 FROM event_members em WHERE em.event_id = ae.id AND em.user_id = get_user_accessible_events.user_id AND em.status = 'accepted') THEN 'crew'
               ELSE 'not_joined'
             END
           ) as user_rsvp_status
    FROM accessible_events ae
  )
  SELECT es.id, es.title, es.location, es.latitude, es.longitude, es.place_id, es.place_name,
         es.date_time, es.drink_type, es.vibe, es.notes, es.is_public, es.created_by,
         es.created_at, es.updated_at, es.event_code, es.public_slug, es.private_slug,
         es.cover_image_url, es.rsvp_count, es.user_rsvp_status,
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

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_public_events_for_discover(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_accessible_events(UUID, BOOLEAN, INTEGER) TO authenticated;

-- 7. Refresh the schema cache
NOTIFY pgrst, 'reload schema';
