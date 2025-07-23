-- Simple Badge Debug for Username: roughin
-- Focuses only on the implemented badge criteria (event_count, host_count, crew_join)

-- Get user info
SELECT 
  '=== USER INFO ===' as info,
  user_id,
  username,
  display_name
FROM user_profiles 
WHERE username = 'roughin';

-- Get user's core activity stats using the same functions as badge system
WITH user_data AS (
  SELECT user_id FROM user_profiles WHERE username = 'roughin'
)
SELECT 
  '=== ACTIVITY STATS ===' as info,
  get_user_event_count(user_id) as events_attended,
  get_user_host_count(user_id) as events_hosted,
  get_user_crew_count(user_id) as crews_joined
FROM user_data;

-- Show raw data from tables
SELECT 
  '=== RAW EVENT MEMBERS DATA ===' as info,
  COUNT(*) as total_event_member_records,
  COUNT(CASE WHEN status = 'going' THEN 1 END) as going_status_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_status_count,
  COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined_status_count
FROM event_members em
JOIN user_profiles up ON em.user_id = up.user_id
WHERE up.username = 'roughin';

SELECT 
  '=== RAW EVENTS DATA ===' as info,
  COUNT(*) as total_events_created
FROM events e
JOIN user_profiles up ON e.created_by = up.user_id
WHERE up.username = 'roughin';

SELECT 
  '=== RAW CREW MEMBERS DATA ===' as info,
  COUNT(*) as total_crew_member_records,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_status_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_status_count
FROM crew_members cm
JOIN user_profiles up ON cm.user_id = up.user_id
WHERE up.username = 'roughin';

-- Show badges already earned
SELECT 
  '=== BADGES ALREADY EARNED ===' as info,
  b.name as badge_name,
  b.description,
  b.category,
  ub.earned_at
FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
JOIN user_profiles up ON ub.user_id = up.user_id
WHERE up.username = 'roughin'
ORDER BY ub.earned_at DESC;

-- Show which badges should be eligible based on implemented criteria
WITH user_data AS (
  SELECT user_id FROM user_profiles WHERE username = 'roughin'
),
user_stats AS (
  SELECT 
    user_id,
    get_user_event_count(user_id) as event_count,
    get_user_host_count(user_id) as host_count,
    get_user_crew_count(user_id) as crew_count
  FROM user_data
),
eligible_badges AS (
  SELECT 
    b.name,
    b.description,
    b.unlock_criteria,
    us.event_count,
    us.host_count,
    us.crew_count,
    CASE 
      WHEN b.unlock_criteria->>'type' = 'event_count' 
        AND us.event_count >= (b.unlock_criteria->>'target')::INTEGER 
        THEN 'SHOULD_BE_ELIGIBLE'
      WHEN b.unlock_criteria->>'type' = 'host_count' 
        AND us.host_count >= (b.unlock_criteria->>'target')::INTEGER 
        THEN 'SHOULD_BE_ELIGIBLE'
      WHEN b.unlock_criteria->>'type' = 'crew_join' 
        AND us.crew_count >= (b.unlock_criteria->>'target')::INTEGER 
        THEN 'SHOULD_BE_ELIGIBLE'
      ELSE 'NOT_ELIGIBLE'
    END as eligibility,
    CASE WHEN ub.badge_id IS NOT NULL THEN 'ALREADY_EARNED' ELSE 'NOT_EARNED' END as current_status
  FROM badges b
  CROSS JOIN user_stats us
  LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = us.user_id
  WHERE b.unlock_criteria->>'type' IN ('event_count', 'host_count', 'crew_join')
)
SELECT 
  '=== BADGE ELIGIBILITY ANALYSIS ===' as info,
  name as badge_name,
  description,
  unlock_criteria,
  eligibility,
  current_status,
  event_count,
  host_count,
  crew_count
FROM eligible_badges
WHERE eligibility = 'SHOULD_BE_ELIGIBLE' OR current_status = 'ALREADY_EARNED'
ORDER BY 
  CASE WHEN current_status = 'ALREADY_EARNED' THEN 1 ELSE 2 END,
  name;

-- Show ALL badges with their criteria for reference
SELECT 
  '=== ALL BADGE CRITERIA REFERENCE ===' as info,
  name,
  description,
  category,
  unlock_criteria
FROM badges
ORDER BY category, sort_order;
