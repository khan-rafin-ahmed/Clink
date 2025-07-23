-- Badge System Implementation
-- Creates tables for badge catalog, user achievements, and progress tracking
-- Date: 2025-01-23

-- Create badges master catalog table
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'event_participation', 'hosting_crew', 'social_activity', 
    'streaks_time', 'weekly_sinners', 'drink_devotees'
  )),
  tier integer DEFAULT 1 CHECK (tier BETWEEN 1 AND 4),
  unlock_criteria jsonb NOT NULL,
  icon_name text NOT NULL,
  color_tier text NOT NULL CHECK (color_tier IN ('bronze', 'silver', 'gold', 'neon')),
  is_hidden boolean DEFAULT false,
  is_easter_egg boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user badges achievements table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  progress_data jsonb DEFAULT '{}',
  is_visible_on_profile boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create badge progress tracking table (optional)
CREATE TABLE IF NOT EXISTS public.badge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  current_progress integer DEFAULT 0,
  target_progress integer NOT NULL,
  progress_data jsonb DEFAULT '{}',
  last_updated timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_visible ON user_badges(user_id, is_visible_on_profile);
CREATE INDEX IF NOT EXISTS idx_badge_progress_user_id ON badge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category);
CREATE INDEX IF NOT EXISTS idx_badges_sort_order ON badges(sort_order);

-- Enable RLS on all tables
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges (public read)
CREATE POLICY "Anyone can view badges catalog" ON badges
  FOR SELECT USING (true);

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' visible badges" ON user_badges
  FOR SELECT USING (is_visible_on_profile = true);

CREATE POLICY "Users can update their own badge visibility" ON user_badges
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for badge_progress
CREATE POLICY "Users can view their own progress" ON badge_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Add badge_achievement to notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  'event_invitation', 'event_invitation_response', 'event_update',
  'event_rsvp', 'event_reminder', 'event_cancelled', 'event_rating_reminder',
  'crew_invitation', 'crew_invitation_response', 'crew_invite_accepted',
  'crew_promotion', 'event_promotion', 'crew_join', 'badge_achievement'
));

-- Helper functions for badge calculations
CREATE OR REPLACE FUNCTION get_user_event_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM event_members em
    WHERE em.user_id = user_id_param 
    AND em.status = 'going'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_host_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM events e
    WHERE e.created_by = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_crew_count(user_id_param UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM crew_members cm
    WHERE cm.user_id = user_id_param 
    AND cm.status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and award badges
CREATE OR REPLACE FUNCTION check_and_award_badges(user_id_param UUID)
RETURNS TABLE(badge_id UUID, badge_name TEXT) AS $$
DECLARE
  badge_record RECORD;
  user_stats RECORD;
BEGIN
  -- Get user statistics
  SELECT 
    get_user_event_count(user_id_param) as event_count,
    get_user_host_count(user_id_param) as host_count,
    get_user_crew_count(user_id_param) as crew_count
  INTO user_stats;

  -- Check each badge criteria
  FOR badge_record IN 
    SELECT b.id, b.name, b.unlock_criteria
    FROM badges b
    WHERE b.id NOT IN (
      SELECT ub.badge_id 
      FROM user_badges ub 
      WHERE ub.user_id = user_id_param
    )
  LOOP
    -- Event participation badges
    IF (badge_record.unlock_criteria->>'type' = 'event_count' AND 
        user_stats.event_count >= (badge_record.unlock_criteria->>'target')::INTEGER) THEN
      
      INSERT INTO user_badges (user_id, badge_id) 
      VALUES (user_id_param, badge_record.id);
      
      RETURN QUERY SELECT badge_record.id, badge_record.name;
    END IF;

    -- Host count badges
    IF (badge_record.unlock_criteria->>'type' = 'host_count' AND 
        user_stats.host_count >= (badge_record.unlock_criteria->>'target')::INTEGER) THEN
      
      INSERT INTO user_badges (user_id, badge_id) 
      VALUES (user_id_param, badge_record.id);
      
      RETURN QUERY SELECT badge_record.id, badge_record.name;
    END IF;

    -- Crew join badges
    IF (badge_record.unlock_criteria->>'type' = 'crew_join' AND 
        user_stats.crew_count >= (badge_record.unlock_criteria->>'target')::INTEGER) THEN
      
      INSERT INTO user_badges (user_id, badge_id) 
      VALUES (user_id_param, badge_record.id);
      
      RETURN QUERY SELECT badge_record.id, badge_record.name;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
