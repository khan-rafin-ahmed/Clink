-- Add event photos and comments functionality
-- This migration creates tables for event galleries and comment threads

-- Create event_photos table
CREATE TABLE event_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_comments table
CREATE TABLE event_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_comment_reactions table
CREATE TABLE event_comment_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID REFERENCES event_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reaction TEXT NOT NULL CHECK (reaction IN ('🍻', '🙌', '🤘', '🥴', '😂', '❤️', '🔥')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, user_id, reaction)
);

-- Create indexes for better query performance
CREATE INDEX event_photos_event_id_idx ON event_photos(event_id);
CREATE INDEX event_photos_uploaded_by_idx ON event_photos(uploaded_by);
CREATE INDEX event_comments_event_id_idx ON event_comments(event_id);
CREATE INDEX event_comments_user_id_idx ON event_comments(user_id);
CREATE INDEX event_comment_reactions_comment_id_idx ON event_comment_reactions(comment_id);
CREATE INDEX event_comment_reactions_user_id_idx ON event_comment_reactions(user_id);

-- Enable Row Level Security
ALTER TABLE event_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comment_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_photos
-- Only attendees can view photos
CREATE POLICY "Event attendees can view photos" ON event_photos
FOR SELECT USING (
    -- Check if user attended the event (via RSVP or event_members)
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_photos.event_id
        AND (
            -- User is the host
            e.created_by = auth.uid() OR
            -- User RSVP'd as going
            EXISTS (
                SELECT 1 FROM rsvps r
                WHERE r.event_id = e.id 
                AND r.user_id = auth.uid() 
                AND r.status = 'going'
            ) OR
            -- User was invited and accepted (private events)
            EXISTS (
                SELECT 1 FROM event_members em
                WHERE em.event_id = e.id 
                AND em.user_id = auth.uid() 
                AND em.status = 'accepted'
            )
        )
    )
);

-- Only attendees can upload photos
CREATE POLICY "Event attendees can upload photos" ON event_photos
FOR INSERT WITH CHECK (
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
    ) AND uploaded_by = auth.uid()
);

-- Users can delete their own photos, hosts can delete any photo
CREATE POLICY "Users can manage event photos" ON event_photos
FOR DELETE USING (
    uploaded_by = auth.uid() OR
    EXISTS (
        SELECT 1 FROM events e
        WHERE e.id = event_photos.event_id 
        AND e.created_by = auth.uid()
    )
);

-- RLS Policies for event_comments
-- Only attendees can view comments
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

-- Only attendees can post comments
CREATE POLICY "Event attendees can post comments" ON event_comments
FOR INSERT WITH CHECK (
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
    ) AND user_id = auth.uid()
);

-- Users can update/delete their own comments, hosts can moderate
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

-- RLS Policies for event_comment_reactions
-- Only attendees can view reactions
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

-- Only attendees can add reactions
CREATE POLICY "Event attendees can add reactions" ON event_comment_reactions
FOR INSERT WITH CHECK (
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
    ) AND user_id = auth.uid()
);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their reactions" ON event_comment_reactions
FOR DELETE USING (user_id = auth.uid());
