-- Insert mock public events for the Discover page
-- Note: Replace the user_id values with actual user IDs from your auth.users table

-- First, let's create some mock user profiles if they don't exist
INSERT INTO user_profiles (user_id, display_name, bio, avatar_url) VALUES
('11111111-1111-1111-1111-111111111111', 'Alex Thompson', 'Party organizer and craft beer enthusiast 🍺', null),
('22222222-2222-2222-2222-222222222222', 'Sarah Chen', 'Wine lover and social butterfly 🍷', null),
('33333333-3333-3333-3333-333333333333', 'Mike Rodriguez', 'Cocktail connoisseur and weekend warrior 🍸', null),
('44444444-4444-4444-4444-444444444444', 'Emma Wilson', 'Beer garden regular and trivia night champion 🍻', null),
('55555555-5555-5555-5555-555555555555', 'David Kim', 'Whiskey collector and karaoke king 🥃', null)
ON CONFLICT (user_id) DO NOTHING;

-- Insert mock public events
INSERT INTO events (
  title, 
  location, 
  date_time, 
  drink_type, 
  vibe, 
  notes, 
  is_public, 
  created_by,
  event_code,
  created_at
) VALUES
-- Tonight's events
(
  'Friday Night Craft Beer Crawl',
  'Downtown Brewery District',
  (CURRENT_DATE + INTERVAL '20 hours')::timestamp,
  'beer',
  'energetic',
  'Join us for an epic brewery crawl through downtown! We''ll hit 4 amazing craft breweries and try their signature brews. Perfect for meeting new people and discovering great beer! 🍺',
  true,
  '11111111-1111-1111-1111-111111111111',
  'BEER01',
  NOW() - INTERVAL '2 hours'
),
(
  'Rooftop Wine & Sunset Vibes',
  'Sky Lounge, 42nd Floor',
  (CURRENT_DATE + INTERVAL '18 hours')::timestamp,
  'wine',
  'chill',
  'Sophisticated evening with premium wines and stunning city views. Dress code: smart casual. Let''s watch the sunset with a glass of fine wine! 🍷✨',
  true,
  '22222222-2222-2222-2222-222222222222',
  'WINE01',
  NOW() - INTERVAL '1 hour'
),
(
  'Cocktail Masterclass & Tasting',
  'The Mixology Lab',
  (CURRENT_DATE + INTERVAL '19 hours 30 minutes')::timestamp,
  'cocktails',
  'sophisticated',
  'Learn to make 3 classic cocktails from a professional bartender! All ingredients provided. Great for date night or making new friends who love good drinks! 🍸',
  true,
  '33333333-3333-3333-3333-333333333333',
  'COCK01',
  NOW() - INTERVAL '30 minutes'
),

-- Tomorrow's events
(
  'Saturday Beer Garden Hangout',
  'Central Park Beer Garden',
  (CURRENT_DATE + INTERVAL '1 day 15 hours')::timestamp,
  'beer',
  'casual',
  'Casual Saturday afternoon at the best beer garden in town! Bring your friends or come solo - we''re a friendly bunch. Food trucks will be there too! 🍻🌭',
  true,
  '44444444-4444-4444-4444-444444444444',
  'BEER02',
  NOW() - INTERVAL '3 hours'
),
(
  'Whiskey Tasting & Cigar Night',
  'The Gentleman''s Club',
  (CURRENT_DATE + INTERVAL '1 day 20 hours')::timestamp,
  'whiskey',
  'sophisticated',
  'Premium whiskey tasting featuring rare Scottish and Japanese whiskies. Cigars available for purchase. 21+ only. Dress code enforced. 🥃',
  true,
  '55555555-5555-5555-5555-555555555555',
  'WHIS01',
  NOW() - INTERVAL '4 hours'
),

-- Weekend events
(
  'Sunday Brunch & Mimosas',
  'Garden Terrace Restaurant',
  (CURRENT_DATE + INTERVAL '2 days 12 hours')::timestamp,
  'cocktails',
  'chill',
  'Perfect Sunday brunch with unlimited mimosas! Great food, great company, great vibes. Bring your appetite and your friends! 🥂🥞',
  true,
  '22222222-2222-2222-2222-222222222222',
  'MIMO01',
  NOW() - INTERVAL '5 hours'
),
(
  'Craft Beer & Board Games',
  'The Game Café',
  (CURRENT_DATE + INTERVAL '2 days 16 hours')::timestamp,
  'beer',
  'casual',
  'Chill Sunday with craft beers and board games! We have everything from Settlers of Catan to Cards Against Humanity. Perfect for a relaxed weekend! 🎲🍺',
  true,
  '11111111-1111-1111-1111-111111111111',
  'GAME01',
  NOW() - INTERVAL '6 hours'
),

-- Next week events
(
  'Wine & Paint Night',
  'Creative Canvas Studio',
  (CURRENT_DATE + INTERVAL '3 days 19 hours')::timestamp,
  'wine',
  'creative',
  'Unleash your inner artist while sipping fine wine! No experience needed - just bring your creativity. All supplies included. Perfect for a unique night out! 🎨🍷',
  true,
  '22222222-2222-2222-2222-222222222222',
  'PAINT1',
  NOW() - INTERVAL '8 hours'
),
(
  'Tequila Tuesday Fiesta',
  'Casa Mexicana',
  (CURRENT_DATE + INTERVAL '4 days 20 hours')::timestamp,
  'cocktails',
  'energetic',
  'Authentic Mexican cantina experience! Premium tequilas, fresh margaritas, and live mariachi music. ¡Vamos a la fiesta! 🌮🍹',
  true,
  '33333333-3333-3333-3333-333333333333',
  'TEQU01',
  NOW() - INTERVAL '10 hours'
),
(
  'Craft Cocktail Competition',
  'The Alchemist Bar',
  (CURRENT_DATE + INTERVAL '5 days 21 hours')::timestamp,
  'cocktails',
  'competitive',
  'Watch talented bartenders compete in creating the most innovative cocktails! Audience gets to taste and vote. Prizes for winners! 🏆🍸',
  true,
  '33333333-3333-3333-3333-333333333333',
  'COMP01',
  NOW() - INTERVAL '12 hours'
);

-- Add some RSVPs to make events look popular
INSERT INTO rsvps (event_id, user_id, status) 
SELECT 
  e.id,
  (ARRAY['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555'])[floor(random() * 5 + 1)],
  (ARRAY['going', 'maybe', 'going'])[floor(random() * 3 + 1)]
FROM events e
WHERE e.is_public = true
AND random() < 0.7; -- 70% chance of having RSVPs

-- Add more RSVPs for popular events
INSERT INTO rsvps (event_id, user_id, status)
SELECT 
  e.id,
  '11111111-1111-1111-1111-111111111111',
  'going'
FROM events e 
WHERE e.title LIKE '%Beer%' AND e.is_public = true
ON CONFLICT (event_id, user_id) DO NOTHING;

INSERT INTO rsvps (event_id, user_id, status)
SELECT 
  e.id,
  '22222222-2222-2222-2222-222222222222',
  'going'
FROM events e 
WHERE e.title LIKE '%Wine%' AND e.is_public = true
ON CONFLICT (event_id, user_id) DO NOTHING;
