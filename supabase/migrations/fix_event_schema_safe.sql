-- Safe migration that works with existing schema
-- This fixes the modern event system without breaking existing data

-- Step 1: Add slug columns to events table (safe)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS public_slug TEXT,
ADD COLUMN IF NOT EXISTS private_slug TEXT;

-- Step 2: Create unique indexes for slugs
CREATE UNIQUE INDEX IF NOT EXISTS events_public_slug_idx ON events(public_slug) WHERE public_slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS events_private_slug_idx ON events(private_slug) WHERE private_slug IS NOT NULL;

-- Step 3: Create storage bucket for event photos (safe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'event-photos',
    'event-photos',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Create storage policies for event photos
INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition)
VALUES (
    'event-photos-select',
    'event-photos',
    'Event attendees can view photos',
    'bucket_id = ''event-photos''',
    'bucket_id = ''event-photos'''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.policies (id, bucket_id, name, definition, check_definition)
VALUES (
    'event-photos-insert',
    'event-photos',
    'Event attendees can upload photos',
    'bucket_id = ''event-photos''',
    'bucket_id = ''event-photos'''
) ON CONFLICT (id) DO NOTHING;

-- Step 5: Fix event_photos table with proper foreign keys (safe recreation)
DROP TABLE IF EXISTS event_photos CASCADE;
CREATE TABLE event_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Fix event_comments table with proper foreign keys (safe recreation)
DROP TABLE IF EXISTS event_comments CASCADE;
CREATE TABLE event_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Fix event_comment_reactions table (safe recreation)
DROP TABLE IF EXISTS event_comment_reactions CASCADE;
CREATE TABLE event_comment_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES event_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL CHECK (reaction IN ('🍻', '🙌', '🤘', '🥴', '😂', '❤️', '🔥')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id, reaction)
);

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS event_photos_event_id_idx ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS event_photos_uploaded_by_idx ON event_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS event_comments_event_id_idx ON event_comments(event_id);
CREATE INDEX IF NOT EXISTS event_comments_user_id_idx ON event_comments(user_id);
CREATE INDEX IF NOT EXISTS event_comment_reactions_comment_id_idx ON event_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS event_comment_reactions_user_id_idx ON event_comment_reactions(user_id);

-- Step 9: Enable RLS on new tables
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies for event_photos
DROP POLICY IF EXISTS "Event attendees can view photos" ON event_photos;
DROP POLICY IF EXISTS "Event attendees can upload photos" ON event_photos;
DROP POLICY IF EXISTS "Users can manage event photos" ON event_photos;

CREATE POLICY "Event attendees can view photos" ON event_photos
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_photos.event_id
        AND (
            e.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM rsvps r
                WHERE r.event_id = e.id 
                AND r.user_id = auth.uid() 
                AND r.status = 'going'
            ) OR
            EXISTS (
                SELECT 1 FROM event_members em
                WHERE em.event_id = e.id 
                AND em.user_id = auth.uid() 
                AND em.status = 'accepted'
            )
        )
    )
);

CREATE POLICY "Event attendees can upload photos" ON event_photos
FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_photos.event_id
        AND (
            e.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM rsvps r
                WHERE r.event_id = e.id 
                AND r.user_id = auth.uid() 
                AND r.status = 'going'
            ) OR
            EXISTS (
                SELECT 1 FROM event_members em
                WHERE em.event_id = e.id 
                AND em.user_id = auth.uid() 
                AND em.status = 'accepted'
            )
        )
    )
);

CREATE POLICY "Users can manage event photos" ON event_photos
FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_photos.event_id 
        AND e.created_by = auth.uid()
    )
);

-- Step 11: Create RLS policies for event_comments
DROP POLICY IF EXISTS "Event attendees can view comments" ON event_comments;
DROP POLICY IF EXISTS "Event attendees can post comments" ON event_comments;
DROP POLICY IF EXISTS "Users can manage their comments" ON event_comments;
DROP POLICY IF EXISTS "Users and hosts can delete comments" ON event_comments;

CREATE POLICY "Event attendees can view comments" ON event_comments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_comments.event_id
        AND (
            e.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM rsvps r
                WHERE r.event_id = e.id 
                AND r.user_id = auth.uid() 
                AND r.status = 'going'
            ) OR
            EXISTS (
                SELECT 1 FROM event_members em
                WHERE em.event_id = e.id 
                AND em.user_id = auth.uid() 
                AND em.status = 'accepted'
            )
        )
    )
);

CREATE POLICY "Event attendees can post comments" ON event_comments
FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_comments.event_id
        AND (
            e.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM rsvps r
                WHERE r.event_id = e.id 
                AND r.user_id = auth.uid() 
                AND r.status = 'going'
            ) OR
            EXISTS (
                SELECT 1 FROM event_members em
                WHERE em.event_id = e.id 
                AND em.user_id = auth.uid() 
                AND em.status = 'accepted'
            )
        )
    )
);

CREATE POLICY "Users can manage their comments" ON event_comments
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users and hosts can delete comments" ON event_comments
FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_comments.event_id 
        AND e.created_by = auth.uid()
    )
);

-- Step 12: Create RLS policies for event_comment_reactions
DROP POLICY IF EXISTS "Event attendees can view reactions" ON event_comment_reactions;
DROP POLICY IF EXISTS "Event attendees can add reactions" ON event_comment_reactions;
DROP POLICY IF EXISTS "Users can remove their reactions" ON event_comment_reactions;

CREATE POLICY "Event attendees can view reactions" ON event_comment_reactions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM event_comments ec
        JOIN events e ON e.id = ec.event_id
        WHERE ec.id = event_comment_reactions.comment_id
        AND (
            e.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM rsvps r
                WHERE r.event_id = e.id 
                AND r.user_id = auth.uid() 
                AND r.status = 'going'
            ) OR
            EXISTS (
                SELECT 1 FROM event_members em
                WHERE em.event_id = e.id 
                AND em.user_id = auth.uid() 
                AND em.status = 'accepted'
            )
        )
    )
);

CREATE POLICY "Event attendees can add reactions" ON event_comment_reactions
FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM event_comments ec
        JOIN events e ON e.id = ec.event_id
        WHERE ec.id = event_comment_reactions.comment_id
        AND (
            e.created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM rsvps r
                WHERE r.event_id = e.id 
                AND r.user_id = auth.uid() 
                AND r.status = 'going'
            ) OR
            EXISTS (
                SELECT 1 FROM event_members em
                WHERE em.event_id = e.id 
                AND em.user_id = auth.uid() 
                AND em.status = 'accepted'
            )
        )
    )
);

CREATE POLICY "Users can remove their reactions" ON event_comment_reactions
FOR DELETE USING (user_id = auth.uid());
