-- Add favorite_drink column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN favorite_drink TEXT;

-- Create index for better query performance
CREATE INDEX user_profiles_favorite_drink_idx ON user_profiles(favorite_drink);

-- Update the updated_at trigger to include the new column
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_profiles_updated_at'
    ) THEN
        CREATE TRIGGER update_user_profiles_updated_at
            BEFORE UPDATE ON user_profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_user_profiles_updated_at();
    END IF;
END $$;
