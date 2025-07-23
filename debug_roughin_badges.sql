-- Debug Badge Eligibility for Username: roughin
-- This query shows all activity metrics vs badge requirements without actually awarding badges

-- First, get the user_id for username 'roughin'
WITH user_info AS (
  SELECT user_id, username, display_name
  FROM user_profiles 
  WHERE username = 'roughin'
),

-- Get user's current activity statistics
user_stats AS (
  SELECT 
    ui.user_id,
    ui.username,
    ui.display_name,
    
    -- Event participation (events attended with status 'going')
    (SELECT COUNT(*) 
     FROM event_members em 
     WHERE em.user_id = ui.user_id AND em.status = 'going') as events_attended,
    
    -- Event hosting (events created by user)
    (SELECT COUNT(*) 
     FROM events e 
     WHERE e.created_by = ui.user_id) as events_hosted,
    
    -- Crew memberships (accepted crew memberships)
    (SELECT COUNT(*) 
     FROM crew_members cm 
     WHERE cm.user_id = ui.user_id AND cm.status = 'accepted') as crews_joined,
    
    -- Additional stats for social activity badges (if tables exist)
    (SELECT COUNT(*) 
     FROM event_comments ec 
     WHERE ec.user_id = ui.user_id) as comments_made,
    
    (SELECT COUNT(*) 
     FROM event_photos ep 
     WHERE ep.uploaded_by = ui.user_id) as photos_uploaded,
    
    -- Day-specific event counts
    (SELECT COUNT(*) 
     FROM events e 
     JOIN event_members em ON e.id = em.event_id
     WHERE em.user_id = ui.user_id 
     AND em.status = 'going' 
     AND EXTRACT(DOW FROM e.date_time) = 1) as monday_events,
    
    (SELECT COUNT(*) 
     FROM events e 
     JOIN event_members em ON e.id = em.event_id
     WHERE em.user_id = ui.user_id 
     AND em.status = 'going' 
     AND EXTRACT(DOW FROM e.date_time) = 2) as tuesday_events,
    
    (SELECT COUNT(*) 
     FROM events e 
     JOIN event_members em ON e.id = em.event_id
     WHERE em.user_id = ui.user_id 
     AND em.status = 'going' 
     AND EXTRACT(DOW FROM e.date_time) = 3) as wednesday_events,
    
    (SELECT COUNT(*) 
     FROM events e 
     JOIN event_members em ON e.id = em.event_id
     WHERE em.user_id = ui.user_id 
     AND em.status = 'going' 
     AND EXTRACT(DOW FROM e.date_time) = 4) as thursday_events,
    
    (SELECT COUNT(*) 
     FROM events e 
     JOIN event_members em ON e.id = em.event_id
     WHERE em.user_id = ui.user_id 
     AND em.status = 'going' 
     AND EXTRACT(DOW FROM e.date_time) = 5) as friday_events,
    
    (SELECT COUNT(*) 
     FROM events e 
     JOIN event_members em ON e.id = em.event_id
     WHERE em.user_id = ui.user_id 
     AND em.status = 'going' 
     AND EXTRACT(DOW FROM e.date_time) = 6) as saturday_events,
    
    (SELECT COUNT(*) 
     FROM events e 
     JOIN event_members em ON e.id = em.event_id
     WHERE em.user_id = ui.user_id 
     AND em.status = 'going' 
     AND EXTRACT(DOW FROM e.date_time) = 0) as sunday_events,
    
    -- Drink type specific counts
    (SELECT COUNT(*) 
     FROM events e 
     JOIN event_members em ON e.id = em.event_id
     WHERE em.user_id = ui.user_id 
     AND em.status = 'going' 
     AND e.drink_type = 'beer') as beer_events,
    
    (SELECT COUNT(*) 
     FROM events e 
     JOIN event_members em ON e.id = em.event_id
     WHERE em.user_id = ui.user_id 
     AND em.status = 'going' 
     AND e.drink_type = 'wine') as wine_events,
    
    (SELECT COUNT(*) 
     FROM events e 
     JOIN event_members em ON e.id = em.event_id
     WHERE em.user_id = ui.user_id 
     AND em.status = 'going' 
     AND e.drink_type = 'whiskey') as whiskey_events,
    
    (SELECT COUNT(*) 
     FROM events e 
     JOIN event_members em ON e.id = em.event_id
     WHERE em.user_id = ui.user_id 
     AND em.status = 'going' 
     AND e.drink_type = 'cocktails') as cocktail_events,
    
    (SELECT COUNT(*) 
     FROM events e 
     JOIN event_members em ON e.id = em.event_id
     WHERE em.user_id = ui.user_id 
     AND em.status = 'going' 
     AND e.drink_type = 'mixed') as mixed_events
    
  FROM user_info ui
),

-- Get badges already earned by user
earned_badges AS (
  SELECT ub.badge_id, b.name as badge_name
  FROM user_badges ub
  JOIN badges b ON ub.badge_id = b.id
  JOIN user_info ui ON ub.user_id = ui.user_id
),

-- Badge eligibility check
badge_eligibility AS (
  SELECT 
    b.name as badge_name,
    b.description,
    b.category,
    b.unlock_criteria,
    us.*,
    
    -- Check if badge is already earned
    CASE WHEN eb.badge_id IS NOT NULL THEN 'ALREADY_EARNED' ELSE 'NOT_EARNED' END as current_status,
    
    -- Check eligibility based on criteria type
    CASE 
      WHEN b.unlock_criteria->>'type' = 'event_count' THEN
        CASE WHEN us.events_attended >= (b.unlock_criteria->>'target')::INTEGER 
             THEN 'ELIGIBLE' ELSE 'NOT_ELIGIBLE' END
      
      WHEN b.unlock_criteria->>'type' = 'host_count' THEN
        CASE WHEN us.events_hosted >= (b.unlock_criteria->>'target')::INTEGER 
             THEN 'ELIGIBLE' ELSE 'NOT_ELIGIBLE' END
      
      WHEN b.unlock_criteria->>'type' = 'crew_join' THEN
        CASE WHEN us.crews_joined >= (b.unlock_criteria->>'target')::INTEGER 
             THEN 'ELIGIBLE' ELSE 'NOT_ELIGIBLE' END
      
      WHEN b.unlock_criteria->>'type' = 'comment_count' THEN
        CASE WHEN us.comments_made >= (b.unlock_criteria->>'target')::INTEGER 
             THEN 'ELIGIBLE' ELSE 'NOT_ELIGIBLE' END
      
      WHEN b.unlock_criteria->>'type' = 'photo_count' THEN
        CASE WHEN us.photos_uploaded >= (b.unlock_criteria->>'target')::INTEGER 
             THEN 'ELIGIBLE' ELSE 'NOT_ELIGIBLE' END
      
      ELSE 'CRITERIA_NOT_IMPLEMENTED'
    END as eligibility_status,
    
    -- Show current vs required values
    CASE 
      WHEN b.unlock_criteria->>'type' = 'event_count' THEN
        us.events_attended || ' / ' || (b.unlock_criteria->>'target')
      WHEN b.unlock_criteria->>'type' = 'host_count' THEN
        us.events_hosted || ' / ' || (b.unlock_criteria->>'target')
      WHEN b.unlock_criteria->>'type' = 'crew_join' THEN
        us.crews_joined || ' / ' || (b.unlock_criteria->>'target')
      WHEN b.unlock_criteria->>'type' = 'comment_count' THEN
        us.comments_made || ' / ' || (b.unlock_criteria->>'target')
      WHEN b.unlock_criteria->>'type' = 'photo_count' THEN
        us.photos_uploaded || ' / ' || (b.unlock_criteria->>'target')
      ELSE 'N/A'
    END as progress
    
  FROM badges b
  CROSS JOIN user_stats us
  LEFT JOIN earned_badges eb ON b.id = eb.badge_id
)

-- Final results
SELECT 
  '=== USER ACTIVITY SUMMARY ===' as section,
  username,
  display_name,
  events_attended,
  events_hosted,
  crews_joined,
  comments_made,
  photos_uploaded,
  monday_events,
  tuesday_events,
  wednesday_events,
  thursday_events,
  friday_events,
  saturday_events,
  sunday_events,
  beer_events,
  wine_events,
  whiskey_events,
  cocktail_events,
  mixed_events
FROM user_stats

UNION ALL

SELECT 
  '=== BADGE ELIGIBILITY ANALYSIS ===' as section,
  badge_name,
  description,
  category,
  current_status,
  eligibility_status,
  progress,
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
FROM badge_eligibility
ORDER BY 
  CASE WHEN section LIKE '%SUMMARY%' THEN 1 ELSE 2 END,
  CASE WHEN eligibility_status = 'ELIGIBLE' AND current_status = 'NOT_EARNED' THEN 1
       WHEN current_status = 'ALREADY_EARNED' THEN 2
       ELSE 3 END,
  badge_name;
