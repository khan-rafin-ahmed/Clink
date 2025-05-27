-- Follow System with Inner Circle functionality
-- Run this in Supabase SQL Editor

-- Create follows table for Inner Circle system
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('follow_request', 'follow_accepted', 'event_invitation', 'event_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_invitations table
CREATE TABLE IF NOT EXISTS event_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, invitee_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_status ON follows(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_event_invitations_event_id ON event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_invitee_id ON event_invitations(invitee_id);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows table
CREATE POLICY "Users can view their own follows" ON follows
FOR SELECT USING (follower_id = auth.uid() OR following_id = auth.uid());

CREATE POLICY "Users can create follow requests" ON follows
FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can update their received follow requests" ON follows
FOR UPDATE USING (following_id = auth.uid());

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for event_invitations table
CREATE POLICY "Users can view their invitations" ON event_invitations
FOR SELECT USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

CREATE POLICY "Event creators can create invitations" ON event_invitations
FOR INSERT WITH CHECK (
  inviter_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM events WHERE id = event_id AND created_by = auth.uid())
);

CREATE POLICY "Invitees can update their invitation status" ON event_invitations
FOR UPDATE USING (invitee_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_follows_updated_at BEFORE UPDATE ON follows
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_invitations_updated_at BEFORE UPDATE ON event_invitations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (p_user_id, p_type, p_title, p_message, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle follow request notifications
CREATE OR REPLACE FUNCTION handle_follow_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get follower's display name
  SELECT COALESCE(display_name, 'Someone') INTO follower_name
  FROM user_profiles 
  WHERE user_id = NEW.follower_id;
  
  -- Create notification for the person being followed
  PERFORM create_notification(
    NEW.following_id,
    'follow_request',
    'New Inner Circle Request',
    follower_name || ' wants to join your Inner Circle',
    jsonb_build_object('follower_id', NEW.follower_id, 'follow_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle follow acceptance notifications
CREATE OR REPLACE FUNCTION handle_follow_acceptance_notification()
RETURNS TRIGGER AS $$
DECLARE
  following_name TEXT;
BEGIN
  -- Only trigger on status change to 'accepted'
  IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    -- Get the name of person who accepted
    SELECT COALESCE(display_name, 'Someone') INTO following_name
    FROM user_profiles 
    WHERE user_id = NEW.following_id;
    
    -- Create notification for the follower
    PERFORM create_notification(
      NEW.follower_id,
      'follow_accepted',
      'Inner Circle Request Accepted',
      following_name || ' accepted your Inner Circle request',
      jsonb_build_object('following_id', NEW.following_id, 'follow_id', NEW.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for follow notifications
CREATE TRIGGER follow_request_notification_trigger
AFTER INSERT ON follows
FOR EACH ROW EXECUTE FUNCTION handle_follow_request_notification();

CREATE TRIGGER follow_acceptance_notification_trigger
AFTER UPDATE ON follows
FOR EACH ROW EXECUTE FUNCTION handle_follow_acceptance_notification();
