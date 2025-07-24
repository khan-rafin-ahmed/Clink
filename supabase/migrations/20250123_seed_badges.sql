-- Badge System Seed Data
-- Populates the badges table with all 32 badges from the PRD
-- Date: 2025-01-23

-- Clear existing badges (for development)
DELETE FROM badges;

-- Event Participation Badges
INSERT INTO badges (name, description, category, tier, unlock_criteria, icon_name, color_tier, sort_order) VALUES
('First Pour', 'Made your debut – your glass is now in play', 'event_participation', 1, '{"type": "event_count", "target": 1}', 'glass-cheers', 'bronze', 1),
('Regular Drip I', '5 events deep – starting to smell familiar', 'event_participation', 1, '{"type": "event_count", "target": 5}', 'calendar-check', 'bronze', 2),
('Regular Drip II', '15 events – they know your order now', 'event_participation', 2, '{"type": "event_count", "target": 15}', 'calendar-check', 'silver', 3),
('Regular Drip III', '30 events – you practically live here', 'event_participation', 3, '{"type": "event_count", "target": 30}', 'calendar-check', 'gold', 4),
('Regular Drip IV', '60 events – someone get this legend a chair', 'event_participation', 4, '{"type": "event_count", "target": 60}', 'calendar-check', 'neon', 5),
('Amped & Buzzin''', 'Showed up to a LIVE one – you wild', 'event_participation', 1, '{"type": "live_event", "target": 1}', 'zap', 'gold', 6),
('Same Day Double', 'Two events, one calendar – you okay?', 'event_participation', 1, '{"type": "same_day_events", "target": 2}', 'calendar-days', 'silver', 7);

-- Hosting & Crew Badges
INSERT INTO badges (name, description, category, tier, unlock_criteria, icon_name, color_tier, sort_order) VALUES
('Vibe Initiator', 'Hosted your first – you brave soul', 'hosting_crew', 1, '{"type": "host_count", "target": 1}', 'party-popper', 'bronze', 10),
('Host With the Most I', 'Led 3 events – people actually came', 'hosting_crew', 1, '{"type": "host_count", "target": 3}', 'crown', 'bronze', 11),
('Host With the Most II', '10 events hosted – you''re suspiciously good at this', 'hosting_crew', 2, '{"type": "host_count", "target": 10}', 'crown', 'silver', 12),
('Master of Ceremonies', '25 under your belt – applause!', 'hosting_crew', 3, '{"type": "host_count", "target": 25}', 'crown', 'gold', 13),
('Certified Chaos Curator', '50 hosted – are you even okay?', 'hosting_crew', 4, '{"type": "host_count", "target": 50}', 'crown', 'neon', 14),
('Party Pack', 'Threw a bash with 5+ attendees', 'hosting_crew', 1, '{"type": "event_attendees", "target": 5}', 'users', 'gold', 15),
('Squad Recruit', 'Joined your first crew – now it''s real', 'hosting_crew', 1, '{"type": "crew_join", "target": 1}', 'user-plus', 'bronze', 16),
('Ride or Die I', '5 events with same crew – tight', 'hosting_crew', 1, '{"type": "crew_events", "target": 5}', 'shield', 'bronze', 17),
('Ride or Die II', '15 crew events – loyalty unlocked', 'hosting_crew', 2, '{"type": "crew_events", "target": 15}', 'shield', 'silver', 18),
('Ride or Die III', '30 crew events – is this a cult?', 'hosting_crew', 3, '{"type": "crew_events", "target": 30}', 'shield', 'gold', 19),
('Deputy of Debauchery', 'Got promoted to co-host – power corrupts', 'hosting_crew', 1, '{"type": "role_promotion", "target": 1, "conditions": {"role": "co_host"}}', 'star', 'gold', 20);

-- Social Activity Badges
INSERT INTO badges (name, description, category, tier, unlock_criteria, icon_name, color_tier, sort_order) VALUES
('Buzzword Rookie', 'Posted 3 comments – proud of you', 'social_activity', 1, '{"type": "comment_count", "target": 3}', 'message-circle', 'bronze', 30),
('Buzzword Brawler', '10 comments – you have *thoughts*', 'social_activity', 2, '{"type": "comment_count", "target": 10}', 'message-circle', 'silver', 31),
('Buzzword Boss', '25 comments – you need a podcast', 'social_activity', 3, '{"type": "comment_count", "target": 25}', 'message-circle', 'gold', 32),
('Photo Bae I', 'Dropped your first pic – nice angle', 'social_activity', 1, '{"type": "photo_count", "target": 1}', 'camera', 'bronze', 33),
('Photo Bae II', '5 photos – serving looks', 'social_activity', 2, '{"type": "photo_count", "target": 5}', 'camera', 'silver', 34),
('Photo Bae III', '10 photos – basically the historian', 'social_activity', 3, '{"type": "photo_count", "target": 10}', 'camera', 'gold', 35),
('Cheers Clicker I', '10 reactions – polite little clapper', 'social_activity', 1, '{"type": "reaction_count", "target": 10}', 'heart', 'bronze', 36),
('Cheers Clicker II', '50 reactions – compulsive liker', 'social_activity', 2, '{"type": "reaction_count", "target": 50}', 'heart', 'silver', 37),
('Cheers Clicker III', '150 reactions – you need a nap', 'social_activity', 3, '{"type": "reaction_count", "target": 150}', 'heart', 'gold', 38);

-- Streaks & Time-Based Badges
INSERT INTO badges (name, description, category, tier, unlock_criteria, icon_name, color_tier, is_hidden, is_easter_egg, sort_order) VALUES
('Streak Seeker I', '3 weeks – we see you, commitment king/queen', 'streaks_time', 1, '{"type": "weekly_streak", "target": 3}', 'flame', 'bronze', false, false, 40),
('Streak Seeker II', '6 weeks – okay, that''s dedication', 'streaks_time', 2, '{"type": "weekly_streak", "target": 6}', 'flame', 'silver', false, false, 41),
('Streak Seeker III', '12 weeks – you''re legally a regular now', 'streaks_time', 3, '{"type": "weekly_streak", "target": 12}', 'flame', 'gold', false, false, 42),
('Thirstee OG', 'One month in – welcome to the jungle', 'streaks_time', 1, '{"type": "days_active", "target": 30}', 'trophy', 'gold', false, false, 43),
('No Days Off', '4-day streak – we worry about you', 'streaks_time', 1, '{"type": "daily_streak", "target": 4}', 'zap', 'neon', true, false, 44),
('The Midnight One', 'Joined ''Midnight Mischief'' – you know the lore', 'streaks_time', 1, '{"type": "event_title", "target": "Midnight Mischief"}', 'moon', 'neon', false, true, 45);

-- Weekly Sinners (Day-Based Badges)
INSERT INTO badges (name, description, category, tier, unlock_criteria, icon_name, color_tier, sort_order) VALUES
('Monday Mourner', '5 Mondays in – respect the struggle', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "monday"}}', 'calendar', 'bronze', 50),
('Tequila Tuesday', '5 Tuesdays – regrettably consistent', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "tuesday"}}', 'calendar', 'bronze', 51),
('Wasted Wednesday', '5 Wednesdays – hump day hero', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "wednesday"}}', 'calendar', 'bronze', 52),
('Thirstday Legend', '5 Thursdays – it''s always Thursday somewhere', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "thursday"}}', 'calendar', 'gold', 53),
('Freaky Friday', '5 Fridays – you belong in a montage', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "friday"}}', 'calendar', 'silver', 54),
('Spicy Saturday', '5 Saturdays – the main event', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "saturday"}}', 'calendar', 'gold', 55),
('Sin-Day Devotee', '5 Sundays – you''re spiritually...hydrated?', 'weekly_sinners', 1, '{"type": "day_events", "target": 5, "conditions": {"day": "sunday"}}', 'calendar', 'bronze', 56);

-- Drink-Type Devotees
INSERT INTO badges (name, description, category, tier, unlock_criteria, icon_name, color_tier, sort_order) VALUES
('Lager Royalty', '10+ beer events – foamy and faithful', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "beer"}}', 'beer', 'gold', 60),
('Wine Whisperer', '10+ wine events – swirling with purpose', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "wine"}}', 'wine', 'gold', 61),
('Whiskey Wizard', '10+ whiskey events – strong and smoldering', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "whiskey"}}', 'glass-water', 'gold', 62),
('Cocktail Creature', '10+ cocktails – mixed up and thriving', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "cocktails"}}', 'martini', 'gold', 63),
('Shot Sensei', '10+ shots – blink and it''s gone', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "shots"}}', 'zap', 'neon', 64),
('Blend Baron', '10+ mixed drinks – chaos in a cup', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "mixed"}}', 'blend', 'silver', 65),
('Wildcard Sipper', '10+ mystery drinks – living dangerously', 'drink_devotees', 1, '{"type": "drink_type", "target": 10, "conditions": {"drink": "other"}}', 'help-circle', 'bronze', 66);
