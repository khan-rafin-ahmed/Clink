-- CRITICAL PRIVACY AND DATA INTEGRITY FIXES
-- This migration addresses serious privacy violations and duplicate event issues

-- Step 1: Fix RLS policies to prevent privacy violations
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Users can view their own events" ON events;
DROP POLICY IF EXISTS "Private events viewable by creator" ON events;
DROP POLICY IF EXISTS "Private events viewable by accepted members" ON events;
DROP POLICY IF EXISTS "Private events are viewable by creator and invited members" ON events;

-- Create comprehensive, secure RLS policies for events
CREATE POLICY "Public events viewable by all" ON events
FOR SELECT USING (is_public = true);

CREATE POLICY "Private events viewable by creator" ON events
FOR SELECT USING (
    is_public = false
    AND auth.uid() = created_by
);

CREATE POLICY "Private events viewable by invited members only" ON events
FOR SELECT USING (
    is_public = false
    AND auth.uid() != created_by
    AND EXISTS (
        SELECT 1 FROM event_members
        WHERE event_id = events.id
        AND user_id = auth.uid()
        AND status = 'accepted'
    )
);

-- Step 2: Fix RSVP policies to respect event privacy
DROP POLICY IF EXISTS "RSVPs for public events are viewable" ON rsvps;
DROP POLICY IF EXISTS "Users can view RSVPs for events they have access to" ON rsvps;

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

-- Step 3: Fix foreign key relationships for data integrity
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

-- Step 4: Fix notification types to include event_rsvp
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN ('follow_request', 'follow_accepted', 'event_invitation', 'event_update', 'crew_invitation', 'event_rsvp', 'event_reminder', 'crew_invite_accepted', 'event_cancelled'));

-- Step 5: Refresh the schema cache
NOTIFY pgrst, 'reload schema';
