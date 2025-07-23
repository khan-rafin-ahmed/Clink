-- Clear existing badge data (run this before re-seeding if needed)
-- This is optional - only run if you need to reset the badge system

-- Clear user badge data
DELETE FROM user_badges;
DELETE FROM badge_progress;

-- Clear badge catalog
DELETE FROM badges;

-- Reset sequences if needed
-- (Postgres will handle this automatically for UUIDs)
