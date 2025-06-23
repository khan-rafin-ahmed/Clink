-- Email Notification System
-- This migration adds email logging and automated email triggers

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('event_invitation', 'event_reminder', 'crew_invitation', 'welcome', 'password_reset')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  message_id TEXT,
  data JSONB,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs (recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs (type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs (status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs (sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs (created_at);

-- Create email_preferences table for user email settings
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_invitations BOOLEAN DEFAULT true,
  event_reminders BOOLEAN DEFAULT true,
  crew_invitations BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  email_frequency TEXT DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily', 'weekly', 'never')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for email_preferences
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences (user_id);

-- Function to get user email preferences
CREATE OR REPLACE FUNCTION get_user_email_preferences(p_user_id UUID)
RETURNS TABLE (
  event_invitations BOOLEAN,
  event_reminders BOOLEAN,
  crew_invitations BOOLEAN,
  marketing_emails BOOLEAN,
  email_frequency TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create default preferences if they don't exist
  INSERT INTO email_preferences (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Return preferences
  RETURN QUERY
  SELECT 
    ep.event_invitations,
    ep.event_reminders,
    ep.crew_invitations,
    ep.marketing_emails,
    ep.email_frequency
  FROM email_preferences ep
  WHERE ep.user_id = p_user_id;
END;
$$;

-- Function to send event invitation emails
CREATE OR REPLACE FUNCTION send_event_invitation_emails(
  p_event_id UUID,
  p_inviter_id UUID
)
RETURNS TABLE (
  emails_sent INTEGER,
  emails_failed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_record RECORD;
  invitation_record RECORD;
  inviter_record RECORD;
  user_email TEXT;
  user_prefs RECORD;
  emails_sent_count INTEGER := 0;
  emails_failed_count INTEGER := 0;
BEGIN
  -- Get event details
  SELECT e.*, up.display_name as host_name
  INTO event_record
  FROM events e
  JOIN user_profiles up ON e.created_by = up.user_id
  WHERE e.id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  -- Get inviter details
  SELECT up.display_name, up.avatar_url
  INTO inviter_record
  FROM user_profiles up
  WHERE up.user_id = p_inviter_id;
  
  -- Get all pending invitations for this event
  FOR invitation_record IN
    SELECT em.user_id, em.id as invitation_id
    FROM event_members em
    WHERE em.event_id = p_event_id 
      AND em.status = 'pending'
      AND em.invited_by = p_inviter_id
  LOOP
    -- Get user email and preferences
    SELECT au.email INTO user_email
    FROM auth.users au
    WHERE au.id = invitation_record.user_id;
    
    -- Get user email preferences
    SELECT * INTO user_prefs
    FROM get_user_email_preferences(invitation_record.user_id);
    
    -- Only send if user allows event invitations
    IF user_email IS NOT NULL AND user_prefs.event_invitations = true THEN
      -- Log the email (will be sent by Edge Function)
      INSERT INTO email_logs (
        recipient,
        subject,
        type,
        status,
        data
      ) VALUES (
        user_email,
        '🍺 You''re invited: ' || event_record.title,
        'event_invitation',
        'pending',
        jsonb_build_object(
          'event_id', p_event_id,
          'invitation_id', invitation_record.invitation_id,
          'inviter_id', p_inviter_id,
          'event_title', event_record.title,
          'event_date_time', event_record.date_time,
          'event_location', event_record.location,
          'inviter_name', inviter_record.display_name
        )
      );
      
      emails_sent_count := emails_sent_count + 1;
    ELSE
      emails_failed_count := emails_failed_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT emails_sent_count, emails_failed_count;
END;
$$;

-- Function to send event reminder emails
CREATE OR REPLACE FUNCTION send_event_reminder_emails(
  p_event_id UUID
)
RETURNS TABLE (
  emails_sent INTEGER,
  emails_failed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_record RECORD;
  attendee_record RECORD;
  user_email TEXT;
  user_prefs RECORD;
  attendee_count INTEGER;
  emails_sent_count INTEGER := 0;
  emails_failed_count INTEGER := 0;
BEGIN
  -- Get event details
  SELECT e.*, up.display_name as host_name
  INTO event_record
  FROM events e
  JOIN user_profiles up ON e.created_by = up.user_id
  WHERE e.id = p_event_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;
  
  -- Get attendee count
  SELECT COUNT(*) INTO attendee_count
  FROM event_members em
  WHERE em.event_id = p_event_id AND em.status = 'accepted';
  
  -- Get all accepted attendees for this event
  FOR attendee_record IN
    SELECT em.user_id
    FROM event_members em
    WHERE em.event_id = p_event_id 
      AND em.status = 'accepted'
  LOOP
    -- Get user email and preferences
    SELECT au.email INTO user_email
    FROM auth.users au
    WHERE au.id = attendee_record.user_id;
    
    -- Get user email preferences
    SELECT * INTO user_prefs
    FROM get_user_email_preferences(attendee_record.user_id);
    
    -- Only send if user allows event reminders
    IF user_email IS NOT NULL AND user_prefs.event_reminders = true THEN
      -- Log the email (will be sent by Edge Function)
      INSERT INTO email_logs (
        recipient,
        subject,
        type,
        status,
        data
      ) VALUES (
        user_email,
        '⏰ Starting soon: ' || event_record.title,
        'event_reminder',
        'pending',
        jsonb_build_object(
          'event_id', p_event_id,
          'event_title', event_record.title,
          'event_date_time', event_record.date_time,
          'event_location', event_record.location,
          'host_name', event_record.host_name,
          'attendee_count', attendee_count
        )
      );
      
      emails_sent_count := emails_sent_count + 1;
    ELSE
      emails_failed_count := emails_failed_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT emails_sent_count, emails_failed_count;
END;
$$;

-- Function to schedule event reminders
CREATE OR REPLACE FUNCTION schedule_event_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_record RECORD;
  reminder_count INTEGER := 0;
BEGIN
  -- Find events that start in approximately 1 hour and haven't had reminders sent
  FOR event_record IN
    SELECT e.id, e.title, e.date_time
    FROM events e
    WHERE e.date_time BETWEEN NOW() + INTERVAL '50 minutes' AND NOW() + INTERVAL '70 minutes'
      AND e.id NOT IN (
        SELECT DISTINCT (data->>'event_id')::UUID
        FROM email_logs
        WHERE type = 'event_reminder'
          AND status IN ('sent', 'pending')
          AND (data->>'event_id')::UUID = e.id
      )
  LOOP
    -- Send reminder emails for this event
    PERFORM send_event_reminder_emails(event_record.id);
    reminder_count := reminder_count + 1;
    
    RAISE NOTICE 'Scheduled reminders for event: % (ID: %)', event_record.title, event_record.id;
  END LOOP;
  
  RETURN reminder_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_email_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_invitation_emails(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_event_reminder_emails(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION schedule_event_reminders() TO authenticated;

-- RLS policies for email_logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email logs" ON email_logs
  FOR SELECT USING (
    recipient IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- RLS policies for email_preferences
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own email preferences" ON email_preferences
  FOR ALL USING (user_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE email_logs IS 'Log of all emails sent by the system';
COMMENT ON TABLE email_preferences IS 'User email notification preferences';
COMMENT ON FUNCTION send_event_invitation_emails IS 'Send invitation emails to all pending invitees of an event';
COMMENT ON FUNCTION send_event_reminder_emails IS 'Send reminder emails to all accepted attendees of an event';
COMMENT ON FUNCTION schedule_event_reminders IS 'Schedule reminder emails for events starting in ~1 hour';
