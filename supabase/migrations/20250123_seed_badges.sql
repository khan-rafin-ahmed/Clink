-- Badge System Seed Data
-- Populates the badges table with all 32 badges from the PRD
-- Date: 2025-01-23

-- Clear existing badges (for development)
DELETE FROM badges;

-- Event Participation Badges
INSERT INTO badges (name, description, category, tier, unlock_criteria, icon_name, color_tier, sort_order) VALUES
('First Sip', 'Attend your first event', 'event_participation', 1, '{"type": "event_count", "target": 1}', 'glass-cheers', 'bronze', 1),
('The Regular I', 'Attend 5 events', 'event_participation', 1, '{"type": "event_count", "target": 5}', 'calendar-check', 'bronze', 2),
('The Regular II', 'Attend 15 events', 'event_participation', 2, '{"type": "event_count", "target": 15}', 'calendar-check', 'silver', 3),
('The Regular III', 'Attend 30 events', 'event_participation', 3, '{"type": "event_count", "target": 30}', 'calendar-check', 'gold', 4),
('The Regular IV', 'Attend 60 events', 'event_participation', 4, '{"type": "event_count", "target": 60}', 'calendar-check', 'neon', 5),
('Live & Lit', 'Attend any LIVE event', 'event_participation', 1, '{"type": "live_event", "target": 1}', 'zap', 'gold', 6),
('Double Trouble', 'Attend 2+ events same day', 'event_participation', 1, '{"type": "same_day_events", "target": 2}', 'calendar-days', 'silver', 7);

-- Hosting & Crew Badges
INSERT INTO badges (name, description, category, tier, unlock_criteria, icon_name, color_tier, sort_order) VALUES
('Party Starter', 'Host your first event', 'hosting_crew', 1, '{"type": "host_count", "target": 1}', 'party-popper', 'bronze', 10),
('Thirst Commander I', 'Host 3 events', 'hosting_crew', 1, '{"type": "host_count", "target": 3}', 'crown', 'bronze', 11),
('Thirst Commander II', 'Host 10 events', 'hosting_crew', 2, '{"type": "host_count", "target": 10}', 'crown', 'silver', 12),
('Thirst Commander III', 'Host 25 events', 'hosting_crew', 3, '{"type": "host_count", "target": 25}', 'crown', 'gold', 13),
('Thirst Commander IV', 'Host 50 events', 'hosting_crew', 4, '{"type": "host_count", "target": 50}', 'crown', 'neon', 14),
('Squad Goals', 'Host event with 5+ attendees', 'hosting_crew', 1, '{"type": "event_attendees", "target": 5}', 'users', 'gold', 15),
('Crew Member', 'Join your first crew', 'hosting_crew', 1, '{"type": "crew_join", "target": 1}', 'user-plus', 'bronze', 16),
('Crew Champion I', 'Attend 5 events with same crew', 'hosting_crew', 1, '{"type": "crew_events", "target": 5}', 'shield', 'bronze', 17),
('Crew Champion II', 'Attend 15 events with same crew', 'hosting_crew', 2, '{"type": "crew_events", "target": 15}', 'shield', 'silver', 18),
('Crew Champion III', 'Attend 30 events with same crew', 'hosting_crew', 3, '{"type": "crew_events", "target": 30}', 'shield', 'gold', 19),
('Co-Captain', 'Get promoted to co-host', 'hosting_crew', 1, '{"type": "role_promotion", "target": 1, "conditions": {"role": "co_host"}}', 'star', 'gold', 20);

-- Social Activity Badges
INSERT INTO badges (name, description, category, tier, unlock_criteria, icon_name, color_tier, sort_order) VALUES
('Comment Commander I', 'Post 3 comments', 'social_activity', 1, '{"type": "comment_count", "target": 3}', 'message-circle', 'bronze', 30),
('Comment Commander II', 'Post 10 comments', 'social_activity', 2, '{"type": "comment_count", "target": 10}', 'message-circle', 'silver', 31),
('Comment Commander III', 'Post 25 comments', 'social_activity', 3, '{"type": "comment_count", "target": 25}', 'message-circle', 'gold', 32),
('Photo Dropper I', 'Upload 1 event photo', 'social_activity', 1, '{"type": "photo_count", "target": 1}', 'camera', 'bronze', 33),
('Photo Dropper II', 'Upload 5 event photos', 'social_activity', 2, '{"type": "photo_count", "target": 5}', 'camera', 'silver', 34),
('Photo Dropper III', 'Upload 10 event photos', 'social_activity', 3, '{"type": "photo_count", "target": 10}', 'camera', 'gold', 35),
('Cheers Machine I', 'React to 10 posts', 'social_activity', 1, '{"type": "reaction_count", "target": 10}', 'heart', 'bronze', 36),
('Cheers Machine II', 'React to 50 posts', 'social_activity', 2, '{"type": "reaction_count", "target": 50}', 'heart', 'silver', 37),
('Cheers Machine III', 'React to 150 posts', 'social_activity', 3, '{"type": "reaction_count", "target": 150}', 'heart', 'gold', 38);

-- Streaks & Time-Based Badges
INSERT INTO badges (name, description, category, tier, unlock_criteria, icon_name, color_tier, is_hidden, is_easter_egg, sort_order) VALUES
('Loyal Drinker I', '3 week streak', 'streaks_time', 1, '{"type": "weekly_streak", "target": 3}', 'flame', 'bronze', false, false, 40),
('Loyal Drinker II', '6 week streak', 'streaks_time', 2, '{"type": "weekly_streak", "target": 6}', 'flame', 'silver', false, false, 41),
('Loyal Drinker III', '12 week streak', 'streaks_time', 3, '{"type": "weekly_streak", "target": 12}', 'flame', 'gold', false, false, 42),
('Thirstee OG', '1 month active user', 'streaks_time', 1, '{"type": "days_active", "target": 30}', 'trophy', 'gold', false, false, 43),
('No Breaks Baby', '4+ days in a row', 'streaks_time', 1, '{"type": "daily_streak", "target": 4}', 'zap', 'neon', true, false, 44),
('Midnight Mischief', 'Join event titled "Midnight Mischief"', 'streaks_time', 1, '{"type": "event_title", "target": "Midnight Mischief"}', 'moon', 'neon', false, true, 45);

-- Weekly Sinners (Day-Based Badges)
INSERT INTO badges (name, description, category, tier, unlock_criteria, icon_name, color_tier, sort_order) VALUES
('Monday Mourner', '5 Monday events', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "monday"}}', 'calendar', 'bronze', 50),
('Too Much Tuesday', '5 Tuesday events', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "tuesday"}}', 'calendar', 'bronze', 51),
('Wrecked Wednesday', '5 Wednesday events', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "wednesday"}}', 'calendar', 'bronze', 52),
('Thirstday God', '5 Thursday events', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "thursday"}}', 'calendar', 'gold', 53),
('Friday Fiend', '5 Friday events', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "friday"}}', 'calendar', 'silver', 54),
('Savage Saturday', '5 Saturday events', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "saturday"}}', 'calendar', 'gold', 55),
('Sin-Day Saint', '5 Sunday events', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "sunday"}}', 'calendar', 'bronze', 56);

-- Drink-Type Devotees
INSERT INTO badges (name, description, category, tier, unlock_criteria, icon_name, color_tier, sort_order) VALUES
('Lager Lord', '10+ beer events', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "beer"}}', 'beer', 'gold', 60),
('Wino Supremo', '10+ wine events', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "wine"}}', 'wine', 'gold', 61),
('Whiskey Wizard', '10+ whiskey events', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "whiskey"}}', 'glass-water', 'gold', 62),
('Mixer Monster', '10+ cocktail events', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "cocktails"}}', 'martini', 'gold', 63),
('Shot Caller', '10+ shots events', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "shots"}}', 'zap', 'neon', 64),
('Blend Lord', '10+ mixed drink events', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "mixed"}}', 'blend', 'silver', 65),
('Wildcard Drinker', '10+ other drinks', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "other"}}', 'help-circle', 'bronze', 66);
