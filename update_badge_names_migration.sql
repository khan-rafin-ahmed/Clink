-- Badge Name & Description Update Migration
-- Updates all badge names and descriptions with new personality-driven content
-- Date: 2025-01-24

-- Event Participation Badges
UPDATE badges SET 
  name = 'First Pour',
  description = 'Made your debut – your glass is now in play'
WHERE name = 'First Sip';

UPDATE badges SET 
  name = 'Regular Drip I',
  description = '5 events deep – starting to smell familiar'
WHERE name = 'The Regular I';

UPDATE badges SET 
  name = 'Regular Drip II',
  description = '15 events – they know your order now'
WHERE name = 'The Regular II';

UPDATE badges SET 
  name = 'Regular Drip III',
  description = '30 events – you practically live here'
WHERE name = 'The Regular III';

UPDATE badges SET 
  name = 'Regular Drip IV',
  description = '60 events – someone get this legend a chair'
WHERE name = 'The Regular IV';

UPDATE badges SET 
  name = 'Amped & Buzzin''',
  description = 'Showed up to a LIVE one – you wild'
WHERE name = 'Live & Lit';

UPDATE badges SET 
  name = 'Same Day Double',
  description = 'Two events, one calendar – you okay?'
WHERE name = 'Double Trouble';

-- Hosting & Crew Badges
UPDATE badges SET 
  name = 'Vibe Initiator',
  description = 'Hosted your first – you brave soul'
WHERE name = 'Party Starter';

UPDATE badges SET 
  name = 'Host With the Most I',
  description = 'Led 3 events – people actually came'
WHERE name = 'Thirst Commander I';

UPDATE badges SET 
  name = 'Host With the Most II',
  description = '10 events hosted – you''re suspiciously good at this'
WHERE name = 'Thirst Commander II';

UPDATE badges SET 
  name = 'Master of Ceremonies',
  description = '25 under your belt – applause!'
WHERE name = 'Thirst Commander III';

UPDATE badges SET 
  name = 'Certified Chaos Curator',
  description = '50 hosted – are you even okay?'
WHERE name = 'Thirst Commander IV';

UPDATE badges SET 
  name = 'Party Pack',
  description = 'Threw a bash with 5+ attendees'
WHERE name = 'Squad Goals';

UPDATE badges SET 
  name = 'Squad Recruit',
  description = 'Joined your first crew – now it''s real'
WHERE name = 'Crew Member';

UPDATE badges SET 
  name = 'Ride or Die I',
  description = '5 events with same crew – tight'
WHERE name = 'Crew Champion I';

UPDATE badges SET 
  name = 'Ride or Die II',
  description = '15 crew events – loyalty unlocked'
WHERE name = 'Crew Champion II';

UPDATE badges SET 
  name = 'Ride or Die III',
  description = '30 crew events – is this a cult?'
WHERE name = 'Crew Champion III';

UPDATE badges SET 
  name = 'Deputy of Debauchery',
  description = 'Got promoted to co-host – power corrupts'
WHERE name = 'Co-Captain';

-- Social Activity Badges
UPDATE badges SET 
  name = 'Buzzword Rookie',
  description = 'Posted 3 comments – proud of you'
WHERE name = 'Comment Commander I';

UPDATE badges SET 
  name = 'Buzzword Brawler',
  description = '10 comments – you have thoughts'
WHERE name = 'Comment Commander II';

UPDATE badges SET 
  name = 'Buzzword Boss',
  description = '25 comments – you need a podcast'
WHERE name = 'Comment Commander III';

UPDATE badges SET 
  name = 'Photo Bae I',
  description = 'Dropped your first pic – nice angle'
WHERE name = 'Photo Dropper I';

UPDATE badges SET 
  name = 'Photo Bae II',
  description = '5 photos – serving looks'
WHERE name = 'Photo Dropper II';

UPDATE badges SET 
  name = 'Photo Bae III',
  description = '10 photos – basically the historian'
WHERE name = 'Photo Dropper III';

UPDATE badges SET 
  name = 'Cheers Clicker I',
  description = '10 reactions – polite little clapper'
WHERE name = 'Cheers Machine I';

UPDATE badges SET 
  name = 'Cheers Clicker II',
  description = '50 reactions – compulsive liker'
WHERE name = 'Cheers Machine II';

UPDATE badges SET 
  name = 'Cheers Clicker III',
  description = '150 reactions – you need a nap'
WHERE name = 'Cheers Machine III';

-- Streaks & Time-Based Badges
UPDATE badges SET 
  name = 'Streak Seeker I',
  description = '3 weeks – we see you, commitment king/queen'
WHERE name = 'Loyal Drinker I';

UPDATE badges SET 
  name = 'Streak Seeker II',
  description = '6 weeks – okay, that''s dedication'
WHERE name = 'Loyal Drinker II';

UPDATE badges SET 
  name = 'Streak Seeker III',
  description = '12 weeks – you''re legally a regular now'
WHERE name = 'Loyal Drinker III';

UPDATE badges SET 
  name = 'Founding Thirstee',
  description = 'One month in – welcome to the jungle'
WHERE name = 'Thirstee OG';

UPDATE badges SET 
  name = 'No Days Off',
  description = '4-day streak – we worry about you'
WHERE name = 'No Breaks Baby';

UPDATE badges SET 
  name = 'The Midnight One',
  description = 'Joined ''Midnight Mischief'' – you know the lore'
WHERE name = 'Midnight Mischief';

-- Weekly Sinners (Day-Based Badges)
UPDATE badges SET 
  description = '5 Mondays in – respect the struggle'
WHERE name = 'Monday Mourner';

UPDATE badges SET 
  name = 'Tequila Tuesday',
  description = '5 Tuesdays – regrettably consistent'
WHERE name = 'Too Much Tuesday';

UPDATE badges SET 
  name = 'Wasted Wednesday',
  description = '5 Wednesdays – hump day hero'
WHERE name = 'Wrecked Wednesday';

UPDATE badges SET 
  name = 'Thirstday Legend',
  description = '5 Thursdays – it''s always Thursday somewhere'
WHERE name = 'Thirstday God';

UPDATE badges SET 
  name = 'Freaky Friday',
  description = '5 Fridays – you belong in a montage'
WHERE name = 'Friday Fiend';

UPDATE badges SET 
  name = 'Spicy Saturday',
  description = '5 Saturdays – the main event'
WHERE name = 'Savage Saturday';

UPDATE badges SET 
  name = 'Sin-Day Devotee',
  description = '5 Sundays – you''re spiritually...hydrated?'
WHERE name = 'Sin-Day Saint';

-- Drink-Type Devotees
UPDATE badges SET 
  name = 'Lager Royalty',
  description = '10+ beer events – foamy and faithful'
WHERE name = 'Lager Lord';

UPDATE badges SET 
  name = 'Wine Whisperer',
  description = '10+ wine events – swirling with purpose'
WHERE name = 'Wino Supremo';

UPDATE badges SET 
  description = '10+ whiskey events – strong and smoldering'
WHERE name = 'Whiskey Wizard';

UPDATE badges SET 
  name = 'Cocktail Creature',
  description = '10+ cocktails – mixed up and thriving'
WHERE name = 'Mixer Monster';

UPDATE badges SET 
  name = 'Shot Sensei',
  description = '10+ shots – blink and it''s gone'
WHERE name = 'Shot Caller';

UPDATE badges SET 
  name = 'Blend Baron',
  description = '10+ mixed drinks – chaos in a cup'
WHERE name = 'Blend Lord';

UPDATE badges SET 
  name = 'Wildcard Sipper',
  description = '10+ mystery drinks – living dangerously'
WHERE name = 'Wildcard Drinker';
