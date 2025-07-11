-- Fix the specific "Someone" notifications that weren't caught by the previous migration
-- This targets the exact notifications found in the test

-- Enhanced function to fix the specific "Someone" notifications
CREATE OR REPLACE FUNCTION fix_specific_someone_notifications()
RETURNS TABLE(notification_id UUID, old_title TEXT, new_title TEXT, fixed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_record RECORD;
  user_name TEXT;
  user_profile RECORD;
  sender_id UUID;
  fixed_count INTEGER := 0;
BEGIN
  -- Loop through the specific "Someone" notifications
  FOR notification_record IN
    SELECT n.id, n.user_id, n.type, n.title, n.message, n.data, n.created_at
    FROM notifications n
    WHERE n.title ILIKE '%Someone%'
    ORDER BY n.created_at DESC
  LOOP
    sender_id := NULL;
    user_name := 'A user'; -- Default fallback
    
    -- Extract sender ID based on notification data structure
    IF notification_record.data ? 'user_id' THEN
      -- Direct user_id in data (like first notification)
      sender_id := (notification_record.data->>'user_id')::UUID;
    ELSIF notification_record.data ? 'invitation_id' THEN
      -- Get sender from invitation (like second notification)
      SELECT invited_by INTO sender_id
      FROM event_members 
      WHERE id = (notification_record.data->>'invitation_id')::UUID;
    ELSIF notification_record.data ? 'rsvpUserId' THEN
      -- RSVP notifications
      sender_id := (notification_record.data->>'rsvpUserId')::UUID;
    ELSIF notification_record.data ? 'inviter_id' THEN
      -- Direct inviter_id
      sender_id := (notification_record.data->>'inviter_id')::UUID;
    ELSIF notification_record.data ? 'joiner_id' THEN
      -- Crew join notifications
      sender_id := (notification_record.data->>'joiner_id')::UUID;
    END IF;
    
    -- If we found a sender ID, get their profile
    IF sender_id IS NOT NULL THEN
      SELECT display_name, username INTO user_profile
      FROM user_profiles
      WHERE user_id = sender_id;
      
      -- Create proper user name with comprehensive fallback
      user_name := COALESCE(
        user_profile.display_name,
        user_profile.username,
        (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = sender_id),
        'A user'
      );
    END IF;
    
    -- Return the current state and what we'll fix
    RETURN QUERY SELECT 
      notification_record.id,
      notification_record.title,
      REPLACE(notification_record.title, 'Someone', user_name),
      (sender_id IS NOT NULL);
    
    -- Update the notification if we found a valid sender
    IF sender_id IS NOT NULL AND user_name != 'A user' THEN
      UPDATE notifications
      SET
        title = REPLACE(notifications.title, 'Someone', user_name),
        message = REPLACE(notifications.message, 'Someone', user_name)
      WHERE notifications.id = notification_record.id;

      fixed_count := fixed_count + 1;
    END IF;
  END LOOP;
  
  -- Log the results
  RAISE NOTICE 'Fixed % notifications', fixed_count;
END;
$$;

-- Run the enhanced fix and show results
SELECT * FROM fix_specific_someone_notifications();

-- Also create a diagnostic function to understand the notification data better
CREATE OR REPLACE FUNCTION diagnose_someone_notifications()
RETURNS TABLE(
  notification_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  data_keys TEXT[],
  potential_sender_id UUID,
  sender_display_name TEXT,
  sender_username TEXT,
  sender_email_prefix TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_record RECORD;
  sender_id UUID;
  user_profile RECORD;
  email_prefix TEXT;
BEGIN
  FOR notification_record IN
    SELECT n.id, n.type, n.title, n.data
    FROM notifications n
    WHERE n.title ILIKE '%Someone%'
  LOOP
    sender_id := NULL;
    user_profile := NULL;
    email_prefix := NULL;

    -- Try to extract sender ID
    IF notification_record.data ? 'user_id' THEN
      sender_id := (notification_record.data->>'user_id')::UUID;
    ELSIF notification_record.data ? 'invitation_id' THEN
      SELECT em.invited_by INTO sender_id
      FROM event_members em
      WHERE em.id = (notification_record.data->>'invitation_id')::UUID;
    ELSIF notification_record.data ? 'rsvpUserId' THEN
      sender_id := (notification_record.data->>'rsvpUserId')::UUID;
    ELSIF notification_record.data ? 'inviter_id' THEN
      sender_id := (notification_record.data->>'inviter_id')::UUID;
    END IF;

    -- Get user profile if sender found
    IF sender_id IS NOT NULL THEN
      SELECT up.display_name, up.username INTO user_profile
      FROM user_profiles up
      WHERE up.user_id = sender_id;

      SELECT split_part(au.email, '@', 1) INTO email_prefix
      FROM auth.users au
      WHERE au.id = sender_id;
    END IF;

    RETURN QUERY SELECT
      notification_record.id,
      notification_record.type,
      notification_record.title,
      ARRAY(SELECT jsonb_object_keys(notification_record.data)),
      sender_id,
      user_profile.display_name,
      user_profile.username,
      email_prefix;
  END LOOP;
END;
$$;

-- Run diagnostics to understand the data
SELECT * FROM diagnose_someone_notifications();

-- Grant permissions
GRANT EXECUTE ON FUNCTION fix_specific_someone_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION diagnose_someone_notifications TO authenticated;
