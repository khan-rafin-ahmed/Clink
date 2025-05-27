-- Fix RLS policies to allow public access to public events
-- Run this in Supabase SQL Editor

-- Check current policies on events table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'events';

-- Drop existing policies if they're too restrictive
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON events;

-- Create policy to allow public access to public events
CREATE POLICY "Public events are viewable by everyone" ON events
FOR SELECT USING (is_public = true);

-- Create policy to allow authenticated users to view their own events
CREATE POLICY "Users can view their own events" ON events
FOR SELECT USING (auth.uid() = created_by);

-- Check current policies on rsvps table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'rsvps';

-- Create policy to allow public access to RSVPs for public events
DROP POLICY IF EXISTS "RSVPs for public events are viewable" ON rsvps;
CREATE POLICY "RSVPs for public events are viewable" ON rsvps
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = rsvps.event_id 
    AND events.is_public = true
  )
);

-- Create policy to allow authenticated users to view RSVPs for their events
DROP POLICY IF EXISTS "Users can view RSVPs for their events" ON rsvps;
CREATE POLICY "Users can view RSVPs for their events" ON rsvps
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM events 
    WHERE events.id = rsvps.event_id 
    AND events.created_by = auth.uid()
  )
);

-- Create policy to allow authenticated users to manage their own RSVPs
DROP POLICY IF EXISTS "Users can manage their own RSVPs" ON rsvps;
CREATE POLICY "Users can manage their own RSVPs" ON rsvps
FOR ALL USING (auth.uid() = user_id);

-- Check user_profiles policies for public access
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- Allow public read access to user profiles (for displaying host/participant info)
DROP POLICY IF EXISTS "User profiles are publicly readable" ON user_profiles;
CREATE POLICY "User profiles are publicly readable" ON user_profiles
FOR SELECT USING (true);

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('events', 'rsvps', 'user_profiles')
ORDER BY tablename, policyname;
