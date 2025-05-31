-- Modern event schema with proper foreign keys and slug-based routing
-- This implements modern web practices for public/private event handling

-- Step 1: Add proper columns to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS public_slug TEXT,
ADD COLUMN IF NOT EXISTS private_slug TEXT;

-- Step 2: Create unique indexes for slugs
CREATE UNIQUE INDEX IF NOT EXISTS events_public_slug_idx ON events(public_slug) WHERE public_slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS events_private_slug_idx ON events(private_slug) WHERE private_slug IS NOT NULL;

-- Step 3: Fix event_photos table with proper foreign key
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

-- Step 4: Fix event_comments table with proper foreign key
DROP TABLE IF EXISTS event_comments CASCADE;
CREATE TABLE event_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Fix event_comment_reactions table
DROP TABLE IF EXISTS event_comment_reactions CASCADE;
CREATE TABLE event_comment_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES event_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction TEXT NOT NULL CHECK (reaction IN ('🍻', '🙌', '🤘', '🥴', '😂', '❤️', '🔥')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id, reaction)
);

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS event_photos_event_id_idx ON event_photos(event_id);
CREATE INDEX IF NOT EXISTS event_photos_uploaded_by_idx ON event_photos(uploaded_by);
CREATE INDEX IF NOT EXISTS event_comments_event_id_idx ON event_comments(event_id);
CREATE INDEX IF NOT EXISTS event_comments_user_id_idx ON event_comments(user_id);
CREATE INDEX IF NOT EXISTS event_comment_reactions_comment_id_idx ON event_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS event_comment_reactions_user_id_idx ON event_comment_reactions(user_id);

-- Step 7: Enable RLS on new tables
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comment_reactions ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for event_photos
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

-- Step 9: Create RLS policies for event_comments
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

-- Step 10: Create RLS policies for event_comment_reactions
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

-- Step 11: Function to generate unique slugs
CREATE OR REPLACE FUNCTION generate_event_slug(event_title TEXT, is_public_event BOOLEAN DEFAULT true)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
    slug_exists BOOLEAN;
BEGIN
    -- Create base slug from title
    base_slug := lower(regexp_replace(event_title, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- Limit length
    IF length(base_slug) > 50 THEN
        base_slug := substring(base_slug from 1 for 50);
    END IF;
    
    -- If empty, use default
    IF base_slug = '' THEN
        base_slug := 'event';
    END IF;
    
    -- For private events, add random suffix for security
    IF NOT is_public_event THEN
        base_slug := base_slug || '-' || substring(gen_random_uuid()::text from 1 for 8);
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness and increment if needed
    LOOP
        IF is_public_event THEN
            SELECT EXISTS(SELECT 1 FROM events WHERE public_slug = final_slug) INTO slug_exists;
        ELSE
            SELECT EXISTS(SELECT 1 FROM events WHERE private_slug = final_slug) INTO slug_exists;
        END IF;
        
        IF NOT slug_exists THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Update existing events with slugs
DO $$
DECLARE
    event_record RECORD;
    new_slug TEXT;
BEGIN
    FOR event_record IN SELECT id, title, visibility FROM events WHERE public_slug IS NULL AND private_slug IS NULL
    LOOP
        IF event_record.visibility = 'public' THEN
            new_slug := generate_event_slug(event_record.title, true);
            UPDATE events SET 
                is_public = true,
                public_slug = new_slug 
            WHERE id = event_record.id;
        ELSE
            new_slug := generate_event_slug(event_record.title, false);
            UPDATE events SET 
                is_public = false,
                private_slug = new_slug 
            WHERE id = event_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Updated existing events with slugs';
END $$;
