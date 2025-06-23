-- SAFE EMAIL SYSTEM SETUP
-- This script only adds what's missing and skips existing items

-- ============================================================================
-- STEP 1: CREATE EMAIL_LOGS TABLE (ONLY IF NOT EXISTS)
-- ============================================================================

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

-- Create indexes for email_logs (ONLY IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs (recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs (type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs (status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs (sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs (created_at);

-- ============================================================================
-- STEP 2: CREATE EMAIL_PREFERENCES TABLE (ONLY IF NOT EXISTS)
-- ============================================================================

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

-- Create index for email_preferences (ONLY IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences (user_id);

-- ============================================================================
-- STEP 3: ENABLE RLS (SAFE - WON'T ERROR IF ALREADY ENABLED)
-- ============================================================================

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: CREATE POLICIES (SKIP IF EXISTS - HANDLE MANUALLY)
-- ============================================================================

-- NOTE: If you get "policy already exists" errors, skip these and move to Step 5
-- Only run these if the policies don't exist:

-- DROP POLICY IF EXISTS "Users can view their own email logs" ON email_logs;
-- CREATE POLICY "Users can view their own email logs" ON email_logs
--   FOR SELECT USING (
--     recipient IN (
--       SELECT email FROM auth.users WHERE id = auth.uid()
--     )
--   );

-- DROP POLICY IF EXISTS "Users can manage their own email preferences" ON email_preferences;
-- CREATE POLICY "Users can manage their own email preferences" ON email_preferences
--   FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- STEP 5: CREATE EMAIL PREFERENCES FUNCTION
-- ============================================================================

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_email_preferences(UUID) TO authenticated;

-- ============================================================================
-- STEP 6: ADD EVENT DURATION SUPPORT (SAFE)
-- ============================================================================

-- Add duration columns to events table (ONLY IF NOT EXISTS)
DO $$ 
BEGIN
  -- Add duration_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'duration_type'
  ) THEN
    ALTER TABLE events ADD COLUMN duration_type TEXT CHECK (duration_type IN ('specific_time', 'all_night'));
  END IF;

  -- Add end_time column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE events ADD COLUMN end_time TIMESTAMPTZ;
  END IF;

  -- Add duration_hours column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'duration_hours'
  ) THEN
    ALTER TABLE events ADD COLUMN duration_hours INTEGER;
  END IF;
END $$;

-- ============================================================================
-- STEP 7: CREATE EVENT DURATION FUNCTIONS
-- ============================================================================

-- Function to calculate event end time
CREATE OR REPLACE FUNCTION calculate_event_end_time(
  start_time TIMESTAMPTZ,
  duration_type TEXT,
  duration_hours INTEGER DEFAULT 3
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
AS $$
BEGIN
  IF duration_type = 'all_night' THEN
    -- All night events end at midnight the next day
    RETURN (start_time::DATE + INTERVAL '1 day')::TIMESTAMPTZ;
  ELSE
    -- Specific time events use duration_hours (default 3)
    RETURN start_time + (COALESCE(duration_hours, 3) || ' hours')::INTERVAL;
  END IF;
END;
$$;

-- Trigger function to automatically set end_time
CREATE OR REPLACE FUNCTION set_event_end_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.end_time IS NULL AND NEW.date_time IS NOT NULL THEN
    NEW.end_time := calculate_event_end_time(
      NEW.date_time,
      NEW.duration_type,
      NEW.duration_hours
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger (DROP first to avoid conflicts)
DROP TRIGGER IF EXISTS trigger_set_event_end_time ON events;
CREATE TRIGGER trigger_set_event_end_time
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_event_end_time();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_event_end_time(TIMESTAMPTZ, TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- STEP 8: BULK EMAIL FUNCTIONS
-- ============================================================================

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
    -- Get user email
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION send_event_invitation_emails(UUID, UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify everything was created successfully:

-- Check tables
SELECT 'email_logs table exists' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs'
);

SELECT 'email_preferences table exists' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'email_preferences'
);

-- Check events table columns
SELECT 'events duration columns added' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'events' AND column_name = 'duration_type'
);

-- Check functions
SELECT 'email preferences function exists' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_name = 'get_user_email_preferences'
);

SELECT 'email invitation function exists' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_name = 'send_event_invitation_emails'
);

-- Success message
SELECT '🎉 Email system setup complete! Ready for SendGrid configuration.' as final_status;
