-- Final Badge Name Corrections
-- Fixes any remaining badge name/description mismatches
-- Date: 2025-01-24

-- Fix Thirstee OG (name stays same, description updates)
UPDATE badges SET 
  description = 'One month in – welcome to the jungle'
WHERE name = 'Thirstee OG';

-- Fix Buzzword Brawler description with asterisks
UPDATE badges SET 
  description = '10 comments – you have *thoughts*'
WHERE name = 'Buzzword Brawler';

-- Ensure all badge names match the reference table exactly
-- (Run this to verify all names are correct)

-- Verify Event Participation badges
UPDATE badges SET name = 'First Pour' WHERE name = 'First Sip';
UPDATE badges SET name = 'Regular Drip I' WHERE name = 'The Regular I';
UPDATE badges SET name = 'Regular Drip II' WHERE name = 'The Regular II';
UPDATE badges SET name = 'Regular Drip III' WHERE name = 'The Regular III';
UPDATE badges SET name = 'Regular Drip IV' WHERE name = 'The Regular IV';
UPDATE badges SET name = 'Amped & Buzzin''' WHERE name = 'Live & Lit';
UPDATE badges SET name = 'Same Day Double' WHERE name = 'Double Trouble';

-- Verify Hosting & Crew badges
UPDATE badges SET name = 'Vibe Initiator' WHERE name = 'Party Starter';
UPDATE badges SET name = 'Host With the Most I' WHERE name = 'Thirst Commander I';
UPDATE badges SET name = 'Host With the Most II' WHERE name = 'Thirst Commander II';
UPDATE badges SET name = 'Master of Ceremonies' WHERE name = 'Thirst Commander III';
UPDATE badges SET name = 'Certified Chaos Curator' WHERE name = 'Thirst Commander IV';
UPDATE badges SET name = 'Party Pack' WHERE name = 'Squad Goals';
UPDATE badges SET name = 'Squad Recruit' WHERE name = 'Crew Member';
UPDATE badges SET name = 'Ride or Die I' WHERE name = 'Crew Champion I';
UPDATE badges SET name = 'Ride or Die II' WHERE name = 'Crew Champion II';
UPDATE badges SET name = 'Ride or Die III' WHERE name = 'Crew Champion III';
UPDATE badges SET name = 'Deputy of Debauchery' WHERE name = 'Co-Captain';

-- Verify Social Activity badges
UPDATE badges SET name = 'Buzzword Rookie' WHERE name = 'Comment Commander I';
UPDATE badges SET name = 'Buzzword Brawler' WHERE name = 'Comment Commander II';
UPDATE badges SET name = 'Buzzword Boss' WHERE name = 'Comment Commander III';
UPDATE badges SET name = 'Photo Bae I' WHERE name = 'Photo Dropper I';
UPDATE badges SET name = 'Photo Bae II' WHERE name = 'Photo Dropper II';
UPDATE badges SET name = 'Photo Bae III' WHERE name = 'Photo Dropper III';
UPDATE badges SET name = 'Cheers Clicker I' WHERE name = 'Cheers Machine I';
UPDATE badges SET name = 'Cheers Clicker II' WHERE name = 'Cheers Machine II';
UPDATE badges SET name = 'Cheers Clicker III' WHERE name = 'Cheers Machine III';

-- Verify Streaks & Time badges
UPDATE badges SET name = 'Streak Seeker I' WHERE name = 'Loyal Drinker I';
UPDATE badges SET name = 'Streak Seeker II' WHERE name = 'Loyal Drinker II';
UPDATE badges SET name = 'Streak Seeker III' WHERE name = 'Loyal Drinker III';
-- Thirstee OG stays the same name
UPDATE badges SET name = 'No Days Off' WHERE name = 'No Breaks Baby';
UPDATE badges SET name = 'The Midnight One' WHERE name = 'Midnight Mischief';

-- Verify Weekly Sinners badges
-- Monday Mourner stays the same
UPDATE badges SET name = 'Tequila Tuesday' WHERE name = 'Too Much Tuesday';
UPDATE badges SET name = 'Wasted Wednesday' WHERE name = 'Wrecked Wednesday';
UPDATE badges SET name = 'Thirstday Legend' WHERE name = 'Thirstday God';
UPDATE badges SET name = 'Freaky Friday' WHERE name = 'Friday Fiend';
UPDATE badges SET name = 'Spicy Saturday' WHERE name = 'Savage Saturday';
UPDATE badges SET name = 'Sin-Day Devotee' WHERE name = 'Sin-Day Saint';

-- Verify Drink Devotees badges
UPDATE badges SET name = 'Lager Royalty' WHERE name = 'Lager Lord';
UPDATE badges SET name = 'Wine Whisperer' WHERE name = 'Wino Supremo';
-- Whiskey Wizard stays the same
UPDATE badges SET name = 'Cocktail Creature' WHERE name = 'Mixer Monster';
UPDATE badges SET name = 'Shot Sensei' WHERE name = 'Shot Caller';
UPDATE badges SET name = 'Blend Baron' WHERE name = 'Blend Lord';
UPDATE badges SET name = 'Wildcard Sipper' WHERE name = 'Wildcard Drinker';

-- Show final count to verify
SELECT 
  category,
  COUNT(*) as badge_count,
  STRING_AGG(name, ', ' ORDER BY sort_order) as badge_names
FROM badges 
GROUP BY category 
ORDER BY category;
