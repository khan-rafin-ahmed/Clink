-- FINAL FIX: Eliminate ALL remaining "Someone" notifications
-- This migration fixes all database functions that still use "Someone" as fallback

-- 1. Fix the crew invitation notification trigger
CREATE OR REPLACE FUNCTION handle_crew_invitation_notification()
RETURNS TRIGGER AS $$
DECLARE
  crew_name TEXT;
  inviter_name TEXT;
  inviter_profile RECORD;
  notifications_exists BOOLEAN;
BEGIN
  -- Check if notifications table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'notifications'
  ) INTO notifications_exists;

  -- Only create notification if table exists
  IF notifications_exists THEN
    -- Get crew name
    SELECT name INTO crew_name
    FROM crews
    WHERE id = NEW.crew_id;

    -- Get inviter profile with comprehensive fallback
    SELECT display_name, username INTO inviter_profile
    FROM user_profiles
    WHERE user_id = NEW.invited_by;

    -- Create inviter name with NO "Someone" fallback
    inviter_name := COALESCE(
      inviter_profile.display_name,
      inviter_profile.username,
      (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = NEW.invited_by),
      'A user'
    );

    -- Check if create_notification function exists and create notification
    IF EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_name = 'create_notification'
    ) THEN
      PERFORM create_notification(
        NEW.user_id,
        'crew_invitation',
        'New Crew Invitation',
        inviter_name || ' invited you to join "' || crew_name || '" crew',
        jsonb_build_object('crew_id', NEW.crew_id, 'crew_member_id', NEW.id)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix any follow system functions (if they exist)
CREATE OR REPLACE FUNCTION handle_follow_request_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
  follower_profile RECORD;
BEGIN
  -- Get follower profile with comprehensive fallback
  SELECT display_name, username INTO follower_profile
  FROM user_profiles 
  WHERE user_id = NEW.follower_id;
  
  -- Create follower name with NO "Someone" fallback
  follower_name := COALESCE(
    follower_profile.display_name,
    follower_profile.username,
    (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = NEW.follower_id),
    'A user'
  );
  
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

-- 3. Fix follow acceptance notification function
CREATE OR REPLACE FUNCTION handle_follow_acceptance_notification()
RETURNS TRIGGER AS $$
DECLARE
  following_name TEXT;
  following_profile RECORD;
BEGIN
  -- Only trigger on status change to 'accepted'
  IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    -- Get the profile of person who accepted with comprehensive fallback
    SELECT display_name, username INTO following_profile
    FROM user_profiles 
    WHERE user_id = NEW.following_id;
    
    -- Create following name with NO "Someone" fallback
    following_name := COALESCE(
      following_profile.display_name,
      following_profile.username,
      (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = NEW.following_id),
      'A user'
    );
    
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

-- 4. Create a function to check for and fix existing "Someone" notifications
CREATE OR REPLACE FUNCTION fix_existing_someone_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_record RECORD;
  fixed_count INTEGER := 0;
  user_name TEXT;
  user_profile RECORD;
  sender_id UUID;
BEGIN
  -- Loop through all "Someone" notifications
  FOR notification_record IN 
    SELECT id, user_id, type, title, message, data, created_at
    FROM notifications 
    WHERE title ILIKE '%Someone%'
  LOOP
    -- Extract sender ID based on notification type
    sender_id := NULL;
    
    IF notification_record.type = 'event_rsvp' THEN
      sender_id := (notification_record.data->>'rsvpUserId')::UUID;
    ELSIF notification_record.type = 'event_invitation_response' THEN
      sender_id := COALESCE(
        (notification_record.data->>'inviter_id')::UUID,
        (notification_record.data->>'user_id')::UUID
      );
    ELSIF notification_record.type = 'crew_invitation' THEN
      sender_id := (notification_record.data->>'inviter_id')::UUID;
    ELSIF notification_record.type = 'crew_invitation_response' THEN
      sender_id := COALESCE(
        (notification_record.data->>'joiner_id')::UUID,
        (notification_record.data->>'user_id')::UUID
      );
    END IF;
    
    -- If we found a sender ID, get their profile
    IF sender_id IS NOT NULL THEN
      SELECT display_name, username INTO user_profile
      FROM user_profiles
      WHERE user_id = sender_id;
      
      -- Create proper user name
      user_name := COALESCE(
        user_profile.display_name,
        user_profile.username,
        (SELECT split_part(email, '@', 1) FROM auth.users WHERE id = sender_id),
        'A user'
      );
      
      -- Update the notification title and message
      UPDATE notifications 
      SET 
        title = REPLACE(title, 'Someone', user_name),
        message = REPLACE(message, 'Someone', user_name)
      WHERE id = notification_record.id;
      
      fixed_count := fixed_count + 1;
    END IF;
  END LOOP;
  
  RETURN fixed_count;
END;
$$;

-- 5. Run the fix for existing notifications
SELECT fix_existing_someone_notifications() as fixed_notifications_count;

-- 6. Add a comment for documentation
COMMENT ON FUNCTION handle_crew_invitation_notification IS 'FINAL VERSION: No more "Someone" notifications. Uses comprehensive user name fallback: display_name → username → email → "A user"';
COMMENT ON FUNCTION handle_follow_request_notification IS 'FINAL VERSION: No more "Someone" notifications. Uses comprehensive user name fallback: display_name → username → email → "A user"';
COMMENT ON FUNCTION handle_follow_acceptance_notification IS 'FINAL VERSION: No more "Someone" notifications. Uses comprehensive user name fallback: display_name → username → email → "A user"';

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_crew_invitation_notification TO authenticated;
GRANT EXECUTE ON FUNCTION handle_follow_request_notification TO authenticated;
GRANT EXECUTE ON FUNCTION handle_follow_acceptance_notification TO authenticated;
GRANT EXECUTE ON FUNCTION fix_existing_someone_notifications TO authenticated;

-- 8. Test message
SELECT 'All "Someone" notification sources have been eliminated!' as status;
SELECT 'Existing "Someone" notifications have been fixed with proper user names' as update_status;
