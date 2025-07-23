-- Badge Statistics Query
-- Run this in Supabase SQL Editor to see badge distribution across all users

-- 1. Overall Badge Statistics
SELECT 
  'OVERALL STATISTICS' as section,
  COUNT(DISTINCT ub.user_id) as users_with_badges,
  COUNT(*) as total_badges_awarded,
  ROUND(COUNT(*)::numeric / COUNT(DISTINCT ub.user_id), 2) as avg_badges_per_user
FROM user_badges ub

UNION ALL

-- 2. Badge Distribution by Category
SELECT 
  'CATEGORY: ' || b.category as section,
  COUNT(DISTINCT ub.user_id) as users_with_badges,
  COUNT(*) as total_badges_awarded,
  ROUND(COUNT(*)::numeric / COUNT(DISTINCT ub.user_id), 2) as avg_badges_per_user
FROM user_badges ub
JOIN badges b ON ub.badge_id = b.id
GROUP BY b.category
ORDER BY total_badges_awarded DESC

UNION ALL

-- 3. Top Badge Earners
SELECT 
  'TOP EARNERS' as section,
  NULL as users_with_badges,
  NULL as total_badges_awarded,
  NULL as avg_badges_per_user
FROM user_badges
LIMIT 1;

-- Separate query for top earners with usernames
SELECT 
  'Top Badge Earners:' as info,
  up.username,
  up.display_name,
  COUNT(ub.id) as badge_count,
  STRING_AGG(b.name, ', ' ORDER BY b.name) as badges_earned
FROM user_badges ub
JOIN user_profiles up ON ub.user_id = up.user_id
JOIN badges b ON ub.badge_id = b.id
GROUP BY up.user_id, up.username, up.display_name
ORDER BY badge_count DESC
LIMIT 10;

-- Most Popular Badges
SELECT 
  'Most Popular Badges:' as info,
  b.name as badge_name,
  b.category,
  COUNT(ub.id) as times_earned,
  ROUND((COUNT(ub.id)::numeric / (SELECT COUNT(DISTINCT user_id) FROM user_profiles) * 100), 1) as percentage_of_users
FROM badges b
LEFT JOIN user_badges ub ON b.id = ub.badge_id
GROUP BY b.id, b.name, b.category
ORDER BY times_earned DESC;

-- Badge Progress by User (showing users with most activity)
SELECT 
  'User Badge Progress:' as info,
  up.username,
  COUNT(ub.id) as badges_earned,
  (SELECT COUNT(*) FROM badges) as total_possible_badges,
  ROUND((COUNT(ub.id)::numeric / (SELECT COUNT(*) FROM badges) * 100), 1) as completion_percentage,
  
  -- Activity stats
  (SELECT COUNT(*) FROM events WHERE created_by = up.user_id) as events_hosted,
  (SELECT COUNT(*) FROM event_members em WHERE em.user_id = up.user_id AND em.status = 'going') as events_attended,
  (SELECT COUNT(*) FROM crew_members cm WHERE cm.user_id = up.user_id AND cm.status = 'accepted') as crews_joined
  
FROM user_profiles up
LEFT JOIN user_badges ub ON up.user_id = ub.user_id
GROUP BY up.user_id, up.username
ORDER BY badges_earned DESC
LIMIT 20;
