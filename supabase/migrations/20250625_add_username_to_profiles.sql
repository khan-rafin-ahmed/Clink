-- Simple username migration
ALTER TABLE user_profiles ADD COLUMN username TEXT;

-- Generate usernames for existing users (simple approach)
UPDATE user_profiles
SET username = LOWER(REGEXP_REPLACE(
    COALESCE(display_name, 'user') || '_' || SUBSTRING(user_id::TEXT, 1, 8),
    '[^a-z0-9_]', '', 'g'
))
WHERE username IS NULL;

-- Make username required and unique
ALTER TABLE user_profiles ALTER COLUMN username SET NOT NULL;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_username_unique UNIQUE (username);


